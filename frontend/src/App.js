import React, { useState, useEffect, useCallback } from 'react';
import FileTable from './components/FileTable';
import CreateFolderForm from './components/CreateFolderForm';
import CreateFileForm from './components/CreateFileForm';
import DownloadModal from './components/DownloadModal';
import { fetchFolderContents, createFolder, createFile, renameFolder, deleteFile, deleteFolder } from './services/api';
import wsService from './services/websocket';
import './App.css';

function App() {
  const [fileList, setFileList] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('ROOT');
  const [currentFolderPath, setCurrentFolderPath] = useState(''); // Track current folder's path
  const [navigationStack, setNavigationStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('');

  // Root folder ID - TODO: Get from user auth
  const ROOT_FOLDER_ID = '9e105426-d861-4b5b-9f0d-ae5f30c41f33';

  // Hardcoded User ID - TODO: Get from user auth
  const USER_ID = 'userDanilo';

  // WebSocket event handlers
  const handleAddedEvent = useCallback((message) => {
    console.log('========== ADDED EVENT RECEIVED ==========');
    console.log('Full message:', JSON.stringify(message, null, 2));
    console.log('Event path:', message.path);
    console.log('Current folder path:', currentFolderPath);
    console.log('Paths match:', message.path === currentFolderPath);
    const newItem = message.data;
    setFileList(prevList => {
      // Check if item already exists
      const exists = prevList.some(item => item.ItemId === newItem.ItemId);
      if (!exists) {
        console.log('✓ Adding new item to list:', newItem);
        return [...prevList, newItem];
      }
      console.log('✗ Item already exists, skipping');
      return prevList;
    });
  }, [currentFolderPath]);

  const handleDeletedEvent = useCallback((message) => {
    console.log('DELETED event received:', message);
    const deletedItemId = message.data.ItemId;
    setFileList(prevList => prevList.filter(item => item.ItemId !== deletedItemId));
  }, []);

  const handleRenamedEvent = useCallback((message) => {
    console.log('RENAMED event received:', message);
    const updatedItem = message.data.item;
    setFileList(prevList => prevList.map(item =>
      item.ItemId === updatedItem.ItemId ? updatedItem : item
    ));
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect(USER_ID);

    // Register event handlers
    wsService.on('ADDED', handleAddedEvent);
    wsService.on('DELETED', handleDeletedEvent);
    wsService.on('RENAMED', handleRenamedEvent);

    // Cleanup on unmount
    return () => {
      wsService.off('ADDED', handleAddedEvent);
      wsService.off('DELETED', handleDeletedEvent);
      wsService.off('RENAMED', handleRenamedEvent);
    };
  }, [USER_ID, handleAddedEvent, handleDeletedEvent, handleRenamedEvent]);

  // Subscribe to path changes
  useEffect(() => {
    console.log('========== PATH SUBSCRIPTION ==========');
    console.log('Subscribing to path:', JSON.stringify(currentFolderPath));
    console.log('Path length:', currentFolderPath.length);
    console.log('Path is empty string:', currentFolderPath === '');
    wsService.subscribePath(currentFolderPath);
  }, [currentFolderPath]);

  useEffect(() => {
    const loadInitialFolder = async () => {
      try {
        setLoading(true);
        setError(null);

        const folderId = currentFolderId || ROOT_FOLDER_ID;
        const contents = await fetchFolderContents(folderId);

        setFileList(contents);

        // Compute current folder path from navigation stack
        if (navigationStack.length === 0 && currentFolderName === 'ROOT') {
          setCurrentFolderPath(''); // Root folder
        } else {
          // Build path: /folder1/folder2/currentFolder (excluding ROOT)
          const pathParts = navigationStack
            .filter(f => f.name !== 'ROOT')  // Filter out ROOT from path
            .map(f => f.name);
          if (currentFolderName !== 'ROOT') {
            pathParts.push(currentFolderName);
          }
          const path = '/' + pathParts.join('/');
          setCurrentFolderPath(path);
          console.log('Current folder path set to:', path); // Debug log
        }
      } catch (err) {
        setError('Failed to load folder contents. Please try again.');
        console.error('Error loading folder:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialFolder();
  }, [currentFolderId, navigationStack, currentFolderName]);

  const handleFolderClick = (folderId, folderName) => {
    // Add current folder to navigation stack
    setNavigationStack([...navigationStack, { id: currentFolderId || ROOT_FOLDER_ID, name: currentFolderName }]);

    // Navigate to the clicked folder
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName);
  };

  const handleGoBack = () => {
    if (navigationStack.length > 0) {
      // Pop the last folder from the stack
      const previousFolder = navigationStack[navigationStack.length - 1];
      const newStack = navigationStack.slice(0, -1);

      setNavigationStack(newStack);
      setCurrentFolderId(previousFolder.id);
      setCurrentFolderName(previousFolder.name);
    }
  };

  const handleGoToRoot = () => {
    setNavigationStack([]);
    setCurrentFolderId(null);
    setCurrentFolderName('ROOT');
  };

  const handleCreateFolder = async (folderName) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Get current folder ID (use ROOT if not set)
      const parentId = currentFolderId || ROOT_FOLDER_ID;

      // Call API to create folder
      await createFolder(parentId, folderName, USER_ID);

      setSuccessMessage('Folder created successfully!');

      // Refresh current folder contents
      const contents = await fetchFolderContents(parentId);
      setFileList(contents);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create folder. Please try again.');
      console.error('Error creating folder:', err);
    }
  };

  const handleCreateFile = async (fileName) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Get current folder ID (use ROOT if not set)
      const parentId = currentFolderId || ROOT_FOLDER_ID;

      // Call API to create file
      await createFile(parentId, fileName, USER_ID);

      setSuccessMessage('File created successfully!');

      // Refresh current folder contents
      const contents = await fetchFolderContents(parentId);
      setFileList(contents);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create file. Please try again.');
      console.error('Error creating file:', err);
    }
  };

  const handleFileClick = (fileId, fileName) => {
    setDownloadFileName(fileName);
    setShowDownloadModal(true);
    // Auto-close modal after 3 seconds
    setTimeout(() => {
      setShowDownloadModal(false);
    }, 3000);
  };

  const handleCloseModal = () => {
    setShowDownloadModal(false);
  };

  const handleRenameFolder = async (parentId, currentName, newName) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Call API to rename folder
      await renameFolder(parentId, currentName, newName);

      setSuccessMessage('Folder renamed successfully!');

      // Refresh current folder contents
      const contents = await fetchFolderContents(parentId);
      setFileList(contents);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to rename folder. Please try again.');
      console.error('Error renaming folder:', err);
    }
  };

  const handleDeleteItem = async (itemId, itemName, itemType) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Call appropriate API based on item type
      if (itemType === 'FOLDER') {
        const result = await deleteFolder(itemId, USER_ID);
        const deletedCount = result.deleted_count || 1;
        setSuccessMessage(`Folder "${itemName}" and ${deletedCount} item(s) deleted successfully!`);
      } else {
        await deleteFile(itemId);
        setSuccessMessage(`File "${itemName}" deleted successfully!`);
      }

      // Refresh current folder contents
      const folderId = currentFolderId || ROOT_FOLDER_ID;
      const contents = await fetchFolderContents(folderId);
      setFileList(contents);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete item. Please try again.');
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>File System Browser</h1>
      </header>

      <main className="App-main">
        {loading && (
          <div className="loading-message">Loading...</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {!loading && !error && (
          <>
            <div className="navigation-bar">
              <button
                className="nav-button"
                onClick={handleGoToRoot}
                disabled={navigationStack.length === 0}
              >
                🏠 Home
              </button>
              <button
                className="nav-button"
                onClick={handleGoBack}
                disabled={navigationStack.length === 0}
              >
                ⬅️ Back
              </button>
              <span className="breadcrumb">
                {navigationStack.length > 0 && (
                  <>
                    {navigationStack.map((folder, index) => (
                      <span key={index}>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-item">{folder.name}</span>
                      </span>
                    ))}
                    <span className="breadcrumb-separator">/</span>
                  </>
                )}
                <span className="breadcrumb-current">{currentFolderName}</span>
              </span>
            </div>

            <div className="create-actions-container">
              <CreateFolderForm
                onCreateFolder={handleCreateFolder}
                currentFolderName={currentFolderName}
              />
              <CreateFileForm
                onCreateFile={handleCreateFile}
                currentFolderName={currentFolderName}
              />
            </div>
            <FileTable
              fileList={fileList}
              currentFolder={currentFolderName}
              onFolderClick={handleFolderClick}
              onFileClick={handleFileClick}
              onRenameFolder={handleRenameFolder}
              onDeleteItem={handleDeleteItem}
            />
          </>
        )}
      </main>

      <DownloadModal
        isOpen={showDownloadModal}
        fileName={downloadFileName}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;
