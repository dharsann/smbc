from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from bson import ObjectId


# ---------- Helpers ----------
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# ---------- User Models ----------
class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    wallet_address: str
    username: Optional[str] = None
    profile_cid: Optional[str] = None  # IPFS CID for profile data
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()}
    )


class UserResponse(BaseModel):
    id: str
    wallet_address: str
    username: Optional[str] = None
    profile_cid: Optional[str] = None
    created_at: datetime


class UserCreate(BaseModel):
    wallet_address: str
    username: Optional[str] = None
    profile_cid: Optional[str] = None


# ---------- Friend Models ----------
class Friend(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId  # The user who added the friend
    friend_wallet: str  # Wallet address of the friend
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()}
    )


class FriendCreate(BaseModel):
    friend_wallet: str


# ---------- Message Models ----------
class Message(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    sender_id: PyObjectId
    recipient_id: Optional[PyObjectId] = None
    content_cid: str  # IPFS CID for message content
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()}
    )


class MessageResponse(BaseModel):
    id: str
    sender: Dict[str, Any]   # sender info dict
    recipient_id: str
    content_cid: str
    created_at: datetime


# ---------- Auth Models ----------
class AuthRequest(BaseModel):
    wallet_address: str


class AuthVerify(BaseModel):
    wallet_address: str
    signature: str
    message: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
