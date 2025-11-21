import React, { useState, useEffect } from 'react';
import FileTable from './components/FileTable';
import CreateFolderForm from './components/CreateFolderForm';
import CreateFileForm from './components/CreateFileForm';
import DownloadModal from './components/DownloadModal';
import { fetchFolderContents, createFolder, createFile, renameFolder } from './services/api';
import './App.css';

function App() {
  const [fileList, setFileList] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('ROOT');
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

  useEffect(() => {
    const loadInitialFolder = async () => {
      try {
        setLoading(true);
        setError(null);

        const folderId = currentFolderId || ROOT_FOLDER_ID;
        const contents = await fetchFolderContents(folderId);

        setFileList(contents);
      } catch (err) {
        setError('Failed to load folder contents. Please try again.');
        console.error('Error loading folder:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialFolder();
  }, [currentFolderId]);

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
