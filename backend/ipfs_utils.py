import requests
import aiohttp
import json
import os

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")

def cid_to_url(cid: str) -> str:
    return f"https://gateway.pinata.cloud/ipfs/{cid}"

def upload_to_ipfs(file_path):
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise Exception("IPFS upload failed: Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env file.")

    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }
    with open(file_path, 'rb') as file:
        response = requests.post(url, files={"file": file}, headers=headers)
    return response.json()

async def upload_file_to_ipfs(file_data: bytes, filename: str) -> str:
    """Upload file data to IPFS and return CID"""
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise Exception("IPFS upload failed: Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env file.")

    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }

    # Create multipart form data
    from aiohttp import FormData
    data = FormData()
    data.add_field('file', file_data, filename=filename)

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=data, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result['IpfsHash']
            else:
                error_text = await response.text()
                raise Exception(f"Failed to upload to IPFS: {response.status} - {error_text}")

async def upload_json_to_ipfs(data: dict) -> str:
    """Upload JSON data to IPFS and return CID"""
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise Exception("IPFS upload failed: Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env file.")

    url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "pinataContent": data,
        "pinataOptions": {"cidVersion": 1}
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            if response.status == 200:
                result = await response.json()
                return result['IpfsHash']
            else:
                raise Exception(f"Failed to upload to IPFS: {response.status}")

def ipfs_to_gateway_url(value: str | None) -> str | None:
    if not value:
        return None
    v = str(value).strip()
    if v.startswith("http://") or v.startswith("https://"):
        return v  # already a URL
    # support ipfs://CID as well
    if v.startswith("ipfs://"):
        v = v.replace("ipfs://", "")
    # bare CID
    return f"https://gateway.pinata.cloud/ipfs/{v}"
