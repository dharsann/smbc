# Simple Blockchain Chat Backend
# This is a simplified version for beginners to understand

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from bson import ObjectId
import os
import secrets
from web3 import Web3
from eth_account.messages import encode_defunct
from jose import JWTError, jwt
from dotenv import load_dotenv
from database import connect_to_mongo, close_mongo_connection, get_database
from ipfs_utils import upload_file_to_ipfs
from models import AuthRequest, AuthVerify, AuthResponse, UserResponse, User

# Load environment variables
load_dotenv()

# Simple configuration
SECRET_KEY = os.getenv("SECRET_KEY", "simple_secret_key_for_demo")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/blockchain_chat")
security = HTTPBearer()

# Global variables (simple approach)
db_client = None
db = None

# Web3 helper class
class SimpleWeb3Auth:
    def __init__(self):
        self.w3 = Web3()

    def create_sign_message(self, wallet_address: str, nonce: str) -> str:
        return f"Sign this message to login: {wallet_address} - Nonce: {nonce}"

    def verify_signature(self, message: str, signature: str, wallet_address: str) -> bool:
        try:
            encoded_message = encode_defunct(text=message)
            recovered_address = self.w3.eth.account.recover_message(encoded_message, signature=signature)
            return recovered_address.lower() == wallet_address.lower()
        except:
            return False

    def create_token(self, wallet_address: str, user_id: str) -> str:
        expire = datetime.utcnow() + timedelta(hours=24)
        payload = {"wallet": wallet_address, "user_id": user_id, "exp": expire}
        return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

web3_auth = SimpleWeb3Auth()

# Database connection
async def init_db():
    global db_client, db
    try:
        db_client = AsyncIOMotorClient(MONGODB_URL)
        db = db_client.blockchain_chat
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"Database connection failed: {e}")

async def close_db():
    if db_client:
        db_client.close()
        print("Database connection closed")

# Authentication middleware
async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")

        return User(
            id=user_doc["_id"],
            wallet_address=user_doc["wallet_address"],
            username=user_doc.get("username"),
            profile_cid=user_doc.get("profile_cid"),
            is_active=user_doc.get("is_active", True),
            created_at=user_doc["created_at"]
        )
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# FastAPI app setup
app = FastAPI(title="Simple Blockchain Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()

# Simple Authentication Endpoints
@app.post("/auth/request")
async def auth_request(request: AuthRequest):
    """Step 1: Request a message to sign"""
    wallet_address = request.wallet_address.lower()

    # Find or create user
    user_doc = await db.users.find_one({"wallet_address": wallet_address})

    if not user_doc:
        # Create new user
        user_data = {
            "wallet_address": wallet_address,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "nonce": secrets.token_hex(16)
        }
        result = await db.users.insert_one(user_data)
        user_id = result.inserted_id
    else:
        # Update nonce for existing user
        nonce = secrets.token_hex(16)
        await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"nonce": nonce}}
        )
        user_id = user_doc["_id"]

    # Create message to sign
    user_doc = await db.users.find_one({"_id": user_id})
    message = web3_auth.create_sign_message(wallet_address, user_doc["nonce"])

    return {"message": message, "nonce": user_doc["nonce"]}

@app.post("/auth/verify")
async def auth_verify(request: AuthVerify):
    """Step 2: Verify signature and return token"""
    wallet_address = request.wallet_address.lower()

    # Find user
    user_doc = await db.users.find_one({"wallet_address": wallet_address})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify signature
    is_valid = web3_auth.verify_signature(request.message, request.signature, wallet_address)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Create JWT token
    token = web3_auth.create_token(wallet_address, str(user_doc["_id"]))

    # Clear nonce
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$unset": {"nonce": ""}}
    )

    return {
        "access_token": token,
        "user": {
            "id": str(user_doc["_id"]),
            "wallet_address": user_doc["wallet_address"],
            "username": user_doc.get("username"),
            "profile_cid": user_doc.get("profile_cid"),
            "created_at": user_doc["created_at"]
        }
    }

# Simple User Endpoints
@app.get("/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": str(current_user.id),
        "wallet_address": current_user.wallet_address,
        "username": current_user.username,
        "profile_cid": current_user.profile_cid,
        "created_at": current_user.created_at
    }

@app.put("/users/me")
async def update_me(user_update: dict, current_user: User = Depends(get_current_user)):
    """Update user profile"""
    if "username" in user_update and user_update["username"]:
        # Check if username is taken
        existing = await db.users.find_one({
            "username": user_update["username"],
            "_id": {"$ne": current_user.id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    # Update user
    await db.users.update_one({"_id": current_user.id}, {"$set": user_update})
    user_doc = await db.users.find_one({"_id": current_user.id})

    return {
        "id": str(user_doc["_id"]),
        "wallet_address": user_doc["wallet_address"],
        "username": user_doc.get("username"),
        "profile_cid": user_doc.get("profile_cid"),
        "created_at": user_doc["created_at"]
    }

@app.post("/users/avatar")
async def update_avatar(avatar_data: dict, current_user: User = Depends(get_current_user)):
    """Update user avatar"""
    avatar_cid = avatar_data.get("avatar_cid")
    if not avatar_cid:
        raise HTTPException(status_code=400, detail="Avatar CID is required")

    await db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"profile_cid": avatar_cid}}
    )

    return {"message": "Avatar updated successfully", "avatar_cid": avatar_cid}

@app.get("/users/get_user/{wallet_address}")
async def get_user_by_wallet(wallet_address: str, current_user: User = Depends(get_current_user)):
    """Get user by wallet address"""
    wallet_address = wallet_address.lower()

    user_doc = await db.users.find_one({"wallet_address": wallet_address})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Not Found")

    return {
        "id": str(user_doc["_id"]),
        "wallet_address": user_doc["wallet_address"],
        "username": user_doc.get("username"),
        "profile_cid": user_doc.get("profile_cid"),
        "created_at": user_doc["created_at"]
    }

# Simple Chat Endpoints
@app.get("/chat/users")
async def get_chat_users(current_user: User = Depends(get_current_user)):
    """Get all users for chat (simplified - just returns all users)"""
    users = []
    cursor = db.users.find({"_id": {"$ne": current_user.id}})

    async for user_doc in cursor:
        users.append({
            "id": str(user_doc["_id"]),
            "wallet_address": user_doc["wallet_address"],
            "username": user_doc.get("username", ""),
            "profile_cid": user_doc.get("profile_cid", ""),
            "is_active": user_doc.get("is_active", True)
        })

    return {"users": users}

@app.post("/chat/users/add")
async def add_user_by_wallet(request: dict, current_user: User = Depends(get_current_user)):
    """Add a user by wallet address"""
    wallet_address = request.get("wallet_address", "").lower()
    
    if not wallet_address:
        raise HTTPException(status_code=400, detail="Wallet address is required")

    # Check if user already exists
    existing_user = await db.users.find_one({"wallet_address": wallet_address})
    
    if existing_user:
        return {
            "id": str(existing_user["_id"]),
            "wallet_address": existing_user["wallet_address"],
            "username": existing_user.get("username", ""),
            "profile_cid": existing_user.get("profile_cid", ""),
            "message": "User already exists"
        }
    
    # Create new user entry
    user_data = {
        "wallet_address": wallet_address,
        "is_active": True,  # Allow chatting
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_data)
    new_user = await db.users.find_one({"_id": result.inserted_id})
    
    return {
        "id": str(new_user["_id"]),
        "wallet_address": new_user["wallet_address"],
        "username": new_user.get("username", ""),
        "profile_cid": new_user.get("profile_cid", ""),
        "message": "User added successfully"
    }

@app.delete("/chat/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user from contacts"""
    try:
        user_object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Check if user exists
    user_to_delete = await db.users.find_one({"_id": user_object_id})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting yourself
    if user_object_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Delete the user
    await db.users.delete_one({"_id": user_object_id})
    
    # Also delete any messages between current user and deleted user
    await db.messages.delete_many({
        "$or": [
            {"sender_id": current_user.id, "recipient_id": user_object_id},
            {"sender_id": user_object_id, "recipient_id": current_user.id}
        ]
    })
    
    return {"message": "User deleted successfully"}

# Simple IPFS Endpoint
@app.post("/ipfs/upload")
async def upload_file_to_ipfs_endpoint(file: UploadFile = File(...)):
    """Upload a file to IPFS"""
    try:
        contents = await file.read()
        cid = await upload_file_to_ipfs(contents, file.filename)
        return {"cid": cid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Start the server
if __name__ == "__main__":
    import uvicorn
    print("Starting Simple Blockchain Chat Backend...")
    print("API will be available at: http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)