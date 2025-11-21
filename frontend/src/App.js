import React, { useState, useEffect } from 'react';
import FileTable from './components/FileTable';
import CreateFolderForm from './components/CreateFolderForm';
import { fetchFolderContents, createFolder } from './services/api';
import './App.css';

function App() {
  const [fileList, setFileList] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const loadInitialFolder = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: REAL ROOT FOLDER ID HASHED WITH USER ID FROM AUTH - didnt do this because not in scope
        const folderId = currentFolder || 'dfff71f9e6fd2cba4054b5f35683eafd8a03fbea6a7d01ec58bebf31fc05b9ed';
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
  }, [currentFolder]);

  const handleCreateFolder = async (folderData) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await createFolder(folderData);
      setSuccessMessage('Folder created successfully!');

      const folderId = currentFolder || 'dfff71f9e6fd2cba4054b5f35683eafd8a03fbea6a7d01ec58bebf31fc05b9ed';
      const contents = await fetchFolderContents(folderId);
      setFileList(contents);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create folder. Please try again.');
      console.error('Error creating folder:', err);
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
            <CreateFolderForm
              onCreateFolder={handleCreateFolder}
              currentFolder={currentFolder || 'ROOT'}
            />
            <FileTable
              fileList={fileList}
              currentFolder={currentFolder || 'ROOT'}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
