from fastapi import FastAPI, status, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import uuid
from dynamo_service import get_dynamo_service

app = FastAPI(title="File System Management API", version="1.0.0")
dynamo_service = get_dynamo_service()


class FileSystemItem(BaseModel):
    ParentId: str
    Name: str
    Depth: int
    ItemId: Optional[str] = None
    Path: str
    Type: str
    UserId: str


class FileSystemItemResponse(BaseModel):
    ParentId: str
    Name: str
    Depth: int
    ItemId: str
    Path: str
    Type: str
    UserId: str


@app.get("/")
def read_root():
    return {
        "message": "File System Management API",
        "version": "1.0.0",
        "endpoints": {
            "POST /users/{user_id}": "Initialize filesystem for a user",
            "GET /folder/{folder_id}": "List contents of a folder",
            "POST /folders/{folder_id}": "Create a new item in a folder",
            "DELETE /item/{item_id}": "Delete an item by ID"
        }
    }


@app.post("/users/{user_id}", response_model=FileSystemItemResponse)
def initialize_user_filesystem(user_id: str):
    """
    Initialize the filesystem for a user.

    Creates a ROOT folder for the user at depth 0.
    This should be the first operation for any new user.

    Returns:
        The created ROOT folder information
    """
    try:
        root_folder = dynamo_service.initialize_user_root(user_id)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=root_folder
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize user filesystem: {str(e)}"
        )


@app.get("/folder/{folder_id}", response_model=List[FileSystemItemResponse])
def get_folder_contents(folder_id: str):
    """
    List all contents of a folder.

    Returns all items (folders and files) within the specified folder.
    """
    try:
        items = dynamo_service.list_folder_contents(folder_id)

        # Convert DynamoDB items to response format
        response_items = []
        for item in items:
            response_items.append({
                "ParentId": item.get("ParentId"),
                "Name": item.get("Name"),
                "Depth": item.get("Depth"),
                "ItemId": item.get("ItemId"),
                "Path": item.get("Path"),
                "Type": item.get("Type"),
                "UserId": item.get("UserId")
            })

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response_items
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list folder contents: {str(e)}"
        )


@app.post("/folders", response_model=FileSystemItemResponse)
def create_item_in_folder(item: FileSystemItem):
    """
    Create a new item (folder or file) in a folder.

    If ItemId is None, a new UUID will be generated automatically.
    The item is persisted to DynamoDB with hierarchical path structure.
    """
    try:
        # Generate UUID if ItemId is not provided
        item_id = item.ItemId if item.ItemId else str(uuid.uuid4())

        # Create item in DynamoDB
        created_item = dynamo_service.create_item(
            parent_id=item.ParentId,
            name=item.Name,
            depth=item.Depth,
            path=item.Path,
            item_type=item.Type,
            user_id=item.UserId,
            item_id=item_id
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=created_item
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}"
        )


@app.delete("/item/{item_id}")
def delete_item(item_id: str, user_id: str):
    """
    Delete an item by its ID.

    Removes the item from DynamoDB.
    """
    try:
        success = dynamo_service.delete_item(item_id, user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item '{item_id}' not found"
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Item deleted successfully",
                "item_id": item_id
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete item: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
