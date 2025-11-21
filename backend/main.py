from fastapi import FastAPI, status, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Any
import uvicorn
import uuid
import traceback
from decimal import Decimal
from dynamo_service import get_dynamo_service

app = FastAPI(title="File System Management API", version="1.0.0", debug=True)
dynamo_service = get_dynamo_service()


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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to show stack traces."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "traceback": traceback.format_exc()
        }
    )


class FileSystemItem(BaseModel):
    ParentId: str
    Name: str
    ItemId: Optional[str] = None
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


class DeleteByPathRequest(BaseModel):
    UserId: str
    Path: str


@app.get("/")
def read_root():
    return {
        "message": "File System Management API",
        "version": "1.0.0",
        "endpoints": {
            "POST /users/{user_id}": "Initialize filesystem for a user",
            "GET /folders/{folder_id}": "List contents of a folder",
            "POST /folders": "Create a new item in a folder",
            "DELETE /item/{item_id}": "Delete an item by ID",
            "DELETE /folders": "Delete all items matching a path (requires UserId and Path in request body)"
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
    root_folder = dynamo_service.initialize_user_root(user_id)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=convert_decimals(root_folder)
    )


@app.get("/folders/{folder_id}", response_model=List[FileSystemItemResponse])
def get_folder_contents(folder_id: str):
    """
    List all contents of a folder.

    Returns all items (folders and files) within the specified folder.
    """
    items = dynamo_service.list_folder_contents(folder_id)

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
        content=convert_decimals(response_items)
    )


@app.post("/folders", response_model=FileSystemItemResponse)
def create_item_in_folder(item: FileSystemItem):
    """
    Create a new item (folder or file) in a folder.

    If ItemId is None, a new UUID will be generated automatically.
    The item is persisted to DynamoDB with hierarchical path structure.
    """
    item_id = item.ItemId if item.ItemId else str(uuid.uuid4())

    parent = dynamo_service.get_item_by_id(item.ParentId)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent folder with ID '{item.ParentId}' not found"
        )

    parent_path = parent.get("Path", "")
    parent_depth = parent.get("Depth", 0)

    depth = parent_depth + 1 if item.Type == "FOLDER" else parent_depth

    # Prevent creating items if depth exceeds 5
    if depth > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create item: maximum depth of 5 exceeded (attempted depth: {depth})"
        )

    path = f"{parent_path}/{item.Name}"

    created_item = dynamo_service.create_item(
        parent_id=item.ParentId,
        name=item.Name,
        depth=depth,
        path=path,
        item_type=item.Type,
        user_id=item.UserId,
        item_id=item_id
    )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=convert_decimals(created_item)
    )


@app.delete("/item/{item_id}")
def delete_item(item_id: str, user_id: str):
    """
    Delete an item by its ID.

    Removes the item from DynamoDB.
    """
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


@app.delete("/folders")
def delete_items_by_path(delete_request: DeleteByPathRequest):
    """
    Delete all items matching a specific UserId and Path.

    Uses the GSIPATH index to efficiently query and delete all matching items.

    Args:
        delete_request: Request body containing UserId and Path

    Returns:
        Dictionary containing deletion results including counts of deleted and failed items
    """
    result = dynamo_service.delete_all_in_path(
        delete_request.UserId, 
        delete_request.Path
    )

    if not result.get('success', False):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete items: {result.get('error', 'Unknown error')}"
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=convert_decimals(result)
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
