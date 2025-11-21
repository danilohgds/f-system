import boto3
import uuid
import os
from datetime import datetime
from typing import Optional, Dict
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()


class DynamoService:
    """Service for DynamoDB operations"""

    def __init__(self):
        self.table_name = os.getenv("DYNAMODB_TABLE_NAME", "FileSystem")
        self.region = os.getenv("AWS_REGION", "us-east-1")

        # Initialize DynamoDB resource
        if os.getenv("USE_LOCAL_DYNAMODB", "false").lower() == "true":
            endpoint_url = os.getenv("DYNAMODB_ENDPOINT", "http://localhost:8000")
            self.dynamodb = boto3.resource(
                'dynamodb',
                endpoint_url=endpoint_url,
                region_name=self.region,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "dummy"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "dummy")
            )
        else:
            self.dynamodb = boto3.resource('dynamodb', region_name=self.region)

        self.table = self.dynamodb.Table(self.table_name)

    def create_item(
        self,
        parent_id: str,
        name: str,
        depth: int,
        path: str,
        item_type: str,
        user_id: str,
        item_id: Optional[str] = None
    ) -> Dict:
        """
        Create a new file system item in DynamoDB.

        Args:
            parent_id: Parent folder ID
            name: Item name
            depth: Depth level (0-5)
            path: Full path
            item_type: "FOLDER" or "FILE"
            user_id: User ID
            item_id: Optional item ID (generates UUID if None)

        Returns:
            Created item dictionary
        """
        # Generate UUID if not provided
        if not item_id:
            item_id = str(uuid.uuid4())

        # Build the hierarchical sort key (SK)
        # Format: parent_path#item_id for hierarchical queries
        if parent_id and parent_id != "ROOT":
            # Get parent to build proper SK path
            parent = self.get_item_by_id(parent_id)
            if parent:
                parent_sk = parent.get('SK', parent_id)
                sk = f"{parent_sk}#{item_id}"
            else:
                sk = item_id
        else:
            sk = item_id

        # Create timestamp
        now = datetime.utcnow().isoformat()

        # Build item
        item = {
            'PK': user_id,                    # Partition key: UserId
            'SK': sk,                          # Sort key: Hierarchical path
            'ItemId': item_id,                 # Unique item ID
            'ParentId': parent_id,             # Parent folder ID
            'Name': name,                      # Display name
            'Type': item_type,                 # FOLDER or FILE
            'Path': path,                      # Human-readable path
            'Depth': depth,                    # Depth level (0-5)
            'UserId': user_id,                 # User ID
            'TypeName': f"{item_type}#{name}", # For GSI sorting
            'CreatedAt': now,
            'UpdatedAt': now
        }

        try:
            # Write to DynamoDB
            self.table.put_item(Item=item)

            # Return the created item
            return {
                'ParentId': parent_id,
                'Name': name,
                'Depth': depth,
                'ItemId': item_id,
                'Path': path,
                'Type': item_type,
                'UserId': user_id
            }

        except ClientError as e:
            print(f"Error creating item in DynamoDB: {e}")
            raise Exception(f"Failed to create item: {str(e)}")

    def get_item_by_id(self, item_id: str) -> Optional[Dict]:
        """Get an item by its ItemId using GSI"""
        try:
            response = self.table.query(
                IndexName='ItemIdIndex',
                KeyConditionExpression='ItemId = :item_id',
                ExpressionAttributeValues={':item_id': item_id}
            )
            items = response.get('Items', [])
            return items[0] if items else None
        except ClientError as e:
            print(f"Error querying item by ID: {e}")
            return None

    def list_folder_contents(self, parent_id: str) -> list:
        """List all items in a folder using GSI"""
        try:
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression='ParentId = :parent_id',
                ExpressionAttributeValues={':parent_id': parent_id}
            )
            return response.get('Items', [])
        except ClientError as e:
            print(f"Error listing folder contents: {e}")
            return []

    def delete_item(self, item_id: str, user_id: str) -> bool:
        """Delete an item by ID"""
        try:
            # Get the item first to find its PK and SK
            item = self.get_item_by_id(item_id)
            if not item:
                return False

            # Delete the item
            self.table.delete_item(
                Key={
                    'PK': user_id,
                    'SK': item['SK']
                }
            )
            return True

        except ClientError as e:
            print(f"Error deleting item: {e}")
            return False

    def initialize_user_root(self, user_id: str) -> Dict:
        """
        Initialize the filesystem for a user by creating their ROOT folder.

        Args:
            user_id: User ID

        Returns:
            Created ROOT folder item
        """
        # Check if root folder already exists
        root_id = str(uuid.uuid4())

        # Try to get existing root
        existing_root = self.get_item_by_id(root_id)
        if existing_root:
            return {
                'ParentId': 'ROOT',
                'Name': 'Root',
                'Depth': 0,
                'ItemId': root_id,
                'Path': '',
                'Type': 'FOLDER',
                'UserId': user_id
            }

        # Create timestamp
        now = datetime.utcnow().isoformat()

        # Create ROOT folder
        root_item = {
            'PK': user_id,                      # Partition key: UserId
            'SK': root_id,                       # Sort key: ROOT_userId
            'ItemId': root_id,                   # Unique item ID
            'ParentId': 'ROOT',                  # No parent (special marker)
            'Name': 'Root',                      # Display name
            'Type': 'FOLDER',                    # Always a folder
            'Path': '',                          # Empty path for root
            'Depth': 0,                          # Root is always depth 0
            'UserId': user_id,                   # User ID
            'TypeName': 'FOLDER#Root',           # For GSI sorting
            'CreatedAt': now,
            'UpdatedAt': now
        }

        try:
            # Write to DynamoDB
            self.table.put_item(Item=root_item)

            # Return the created root folder
            return {
                'ParentId': 'ROOT',
                'Name': 'Root',
                'Depth': 0,
                'ItemId': root_id,
                'Path': '',
                'Type': 'FOLDER',
                'UserId': user_id
            }

        except ClientError as e:
            print(f"Error creating root folder in DynamoDB: {e}")
            raise Exception(f"Failed to initialize user filesystem: {str(e)}")


# Singleton instance
_dynamo_service = None


def get_dynamo_service() -> DynamoService:
    """Get or create DynamoService instance"""
    global _dynamo_service
    if _dynamo_service is None:
        _dynamo_service = DynamoService()
    return _dynamo_service
