const API_BASE_URL = '/folders';

export const fetchFolderContents = async (folderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${folderId}/`);

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

export const createFolder = async (folderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent_name: folderData.parent_name,
        name: folderData.name,
        parent_folder: folderData.parent_folder,
        path: folderData.path,
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
