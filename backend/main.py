from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="File System Management API", version="1.0.0")


class FileSystemItem(BaseModel):
    ParentId: str
    Name: str
    Depth: int
    ItemId: str
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
            "GET /folder/{folder_id}": "List contents of a folder",
            "POST /folder/{folder_id}": "Create a new item in a folder",
            "DELETE /item/{item_id}": "Delete an item by ID"
        }
    }


@app.get("/folder/{folder_id}", response_model=List[FileSystemItemResponse])
def get_folder_contents(folder_id: str):
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=[]
    )


@app.post("/folder/{folder_id}", response_model=FileSystemItemResponse)
def create_item_in_folder(folder_id: str, item: FileSystemItem):
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "ParentId": item.ParentId,
            "Name": item.Name,
            "Depth": item.Depth,
            "ItemId": item.ItemId,
            "Path": item.Path,
            "Type": item.Type,
            "UserId": item.UserId
        }
    )


@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Item deleted successfully",
            "item_id": item_id
        }
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
