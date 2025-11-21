from typing import List, Dict, Any
from fastapi import WebSocket
from decimal import Decimal
import json
from logger_config import setup_logger

logger = setup_logger("websocket")


def convert_decimals(obj: Any) -> Any:
    """Convert Decimal types to int or float for JSON serialization."""
    if isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj


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
        logger.info(f"WebSocket connected for user '{user_id}' (total connections: {len(self.active_connections)})")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections = [
            conn for conn in self.active_connections
            if conn['websocket'] != websocket
        ]
        logger.info(f"WebSocket disconnected (total connections: {len(self.active_connections)})")

    def update_client_path(self, websocket: WebSocket, path: str):
        """Update the current path for a connected client"""
        for conn in self.active_connections:
            if conn['websocket'] == websocket:
                conn['current_path'] = path
                logger.info(f"Client subscribed to path: '{path}'")
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
        # Convert Decimals to JSON-serializable types
        serializable_data = convert_decimals(data)

        message = {
            'type': event_type,
            'path': path,
            'data': serializable_data,
            'user_id': user_id
        }

        # Send to all clients for the same user
        sent_count = 0
        disconnected = []
        for conn in self.active_connections:
            if conn['user_id'] == user_id:
                try:
                    await conn['websocket'].send_text(json.dumps(message))
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send message to client: {e}")
                    disconnected.append(conn['websocket'])

        if sent_count > 0:
            item_name = data.get('Name', 'unknown')
            logger.info(f"Broadcast {event_type} event for '{item_name}' at '{path}' to {sent_count} client(s)")

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
