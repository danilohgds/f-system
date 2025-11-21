const API_BASE_URL = '/folders';

export const fetchFolderContents = async (folderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${folderId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    throw error;
  }
};

export const createFolder = async (parentId, folderName, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ParentId: parentId,
        Name: folderName,
        Type: 'FOLDER',
        UserId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const createFile = async (parentId, fileName, userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ParentId: parentId,
        Name: fileName,
        Type: 'FILE',
        UserId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

export const renameFolder = async (parentId, currentName, newName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(parentId)}/${encodeURIComponent(currentName)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Name: newName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error renaming folder:', error);
    throw error;
  }
};

export const deleteFile = async (itemId) => {
  try {
    const response = await fetch(`/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const deleteFolder = async (folderId, userId) => {
  try {
    const response = await fetch(`/folders/${encodeURIComponent(folderId)}?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};
