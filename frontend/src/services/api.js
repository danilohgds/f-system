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
