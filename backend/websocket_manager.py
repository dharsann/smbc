from typing import Dict, List
from fastapi import WebSocket
import secrets

class ConnectionManager:
    def __init__(self):
        # Support multiple connections per user for multi-device support
        self.active_connections: Dict[str, List[Dict]] = {}
        # Track connection IDs for cleanup
        self.connection_ids: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()

        # Generate unique connection ID
        connection_id = secrets.token_hex(8)

        # Initialize user connections list if not exists
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        # Add new connection
        connection_info = {
            'websocket': websocket,
            'connection_id': connection_id,
            'user_id': user_id
        }

        self.active_connections[user_id].append(connection_info)
        self.connection_ids[connection_id] = user_id

        print(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

        # Send device count update to all connections of this user
        await self._send_device_count_update(user_id)

        return connection_id

    async def disconnect(self, connection_id: str):
        if connection_id in self.connection_ids:
            user_id = self.connection_ids[connection_id]

            # Remove specific connection
            if user_id in self.active_connections:
                self.active_connections[user_id] = [
                    conn for conn in self.active_connections[user_id]
                    if conn['connection_id'] != connection_id
                ]

                # Clean up empty user lists
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]

            del self.connection_ids[connection_id]

            # Send device count update to remaining connections
            if user_id in self.active_connections and self.active_connections[user_id]:
                await self._send_device_count_update(user_id)

            print(f"Connection {connection_id} for user {user_id} disconnected")

    async def disconnect_user(self, user_id: str):
        """Disconnect all connections for a user"""
        if user_id in self.active_connections:
            # Close all websockets for this user
            for connection in self.active_connections[user_id]:
                try:
                    await connection['websocket'].close()
                except:
                    pass  # Connection might already be closed

            # Clean up
            for connection in self.active_connections[user_id]:
                conn_id = connection['connection_id']
                if conn_id in self.connection_ids:
                    del self.connection_ids[conn_id]

            del self.active_connections[user_id]
            print(f"All connections for user {user_id} disconnected")
            # No need to send device count update since all connections are gone

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to ALL devices of a user"""
        if user_id in self.active_connections:
            sent_count = 0
            for connection in self.active_connections[user_id]:
                try:
                    await connection['websocket'].send_json(message)
                    sent_count += 1
                except Exception as e:
                    print(f"Failed to send to connection {connection['connection_id']}: {e}")
                    # Remove failed connection
                    await self.disconnect(connection['connection_id'])

            print(f"📤 Message sent to {sent_count} device(s) for user {user_id}")

            # Send device count update to all connections of this user
            await self._send_device_count_update(user_id)

            return sent_count > 0

        return False

    async def _send_device_count_update(self, user_id: str):
        """Send device count update to all connections of a user"""
        if user_id in self.active_connections:
            device_count = len(self.active_connections[user_id])
            count_message = {
                "type": "device_count",
                "count": device_count,
                "user_id": user_id
            }

            for connection in self.active_connections[user_id]:
                try:
                    await connection['websocket'].send_json(count_message)
                except Exception as e:
                    print(f"Failed to send device count to {connection['connection_id']}: {e}")

    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of active connections for a user"""
        return len(self.active_connections.get(user_id, []))

manager = ConnectionManager()
