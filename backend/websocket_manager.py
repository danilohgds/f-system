from typing import List, Dict
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        # Store active connections with their current path
        self.active_connections: List[Dict[str, any]] = []

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append({
            'websocket': websocket,
            'user_id': user_id,
            'current_path': None  # Will be set by client
        })
        print(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections = [
            conn for conn in self.active_connections
            if conn['websocket'] != websocket
        ]
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")

    def update_client_path(self, websocket: WebSocket, path: str):
        """Update the current path for a connected client"""
        for conn in self.active_connections:
            if conn['websocket'] == websocket:
                conn['current_path'] = path
                print(f"Client path updated to: {path}")
                break

    async def broadcast_event(self, event_type: str, path: str, data: dict, user_id: str):
        """
        Broadcast an event to all connected clients viewing the same path.

        Args:
            event_type: Type of event (ADDED, DELETED, RENAMED)
            path: The path where the event occurred
            data: Additional event data (item details)
            user_id: User ID who triggered the event
        """
        message = {
            'type': event_type,
            'path': path,
            'data': data,
            'user_id': user_id
        }

        print(f"Broadcasting {event_type} event to path: '{path}' for user: {user_id}")
        print(f"Active connections: {len(self.active_connections)}")

        # Send to all clients viewing the same path for the same user
        sent_count = 0
        disconnected = []
        for conn in self.active_connections:
            print(f"Checking connection - user_id: {conn['user_id']}, current_path: '{conn['current_path']}'")
            if conn['user_id'] == user_id and conn['current_path'] == path:
                try:
                    await conn['websocket'].send_text(json.dumps(message))
                    sent_count += 1
                    print(f"Sent message to client #{sent_count}")
                except Exception as e:
                    print(f"Error sending message to client: {e}")
                    disconnected.append(conn['websocket'])

        print(f"Broadcast complete. Sent to {sent_count} client(s)")

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client"""
        await websocket.send_text(message)


# Singleton instance
manager = ConnectionManager()


def get_websocket_manager() -> ConnectionManager:
    """Get the WebSocket manager instance"""
    return manager
