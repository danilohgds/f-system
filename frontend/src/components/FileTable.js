import React, { useState } from 'react';
import './FileTable.css';

const FileTable = ({ fileList, currentFolder, onFolderClick, onFileClick, onRenameFolder, onDeleteItem }) => {
  const [renamingItemId, setRenamingItemId] = useState(null);
  const [newName, setNewName] = useState('');

  const handleItemClick = (item) => {
    if (item.Type === 'FOLDER' && onFolderClick) {
      onFolderClick(item.ItemId, item.Name);
    } else if (item.Type === 'FILE' && onFileClick) {
      onFileClick(item.ItemId, item.Name);
    }
  };

  const handleRenameClick = (e, item) => {
    e.stopPropagation();
    setRenamingItemId(item.ItemId);
    setNewName(item.Name);
  };

  const handleConfirmRename = async (e, item) => {
    e.stopPropagation();
    if (newName.trim() && onRenameFolder) {
      await onRenameFolder(item.ParentId, item.Name, newName.trim());
      setRenamingItemId(null);
      setNewName('');
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setRenamingItemId(null);
    setNewName('');
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    const itemTypeText = item.Type === 'FOLDER' ? 'folder' : 'file';
    const warningMessage = item.Type === 'FOLDER'
      ? `Are you sure you want to delete the folder "${item.Name}" and all its contents?`
      : `Are you sure you want to delete the file "${item.Name}"?`;

    if (window.confirm(warningMessage)) {
      if (onDeleteItem) {
        onDeleteItem(item.ItemId, item.Name, item.Type);
      }
    }
  };

  const getIcon = (type) => {
    return type === 'FOLDER' ? '📁' : '📄';
  };

  return (
    <div className="file-table-container">
      <h2>Current Folder: {currentFolder || 'ROOT'}</h2>
      <table className="file-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {fileList.length === 0 ? (
            <tr>
              <td colSpan="2" className="empty-message">
                No files or folders found
              </td>
            </tr>
          ) : (
            fileList.map((item, index) => (
              <tr
                key={item.ItemId || index}
                className={item.Type === 'FOLDER' ? 'folder-row' : 'file-row'}
                onClick={() => handleItemClick(item)}
              >
                <td className="type-cell">{getIcon(item.Type)}</td>
                <td className={item.Type === 'FOLDER' ? 'name-cell folder-name' : 'name-cell file-name'}>
                  {renamingItemId === item.ItemId ? (
                    <div className="rename-container" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className="rename-input"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleConfirmRename(e, item);
                          } else if (e.key === 'Escape') {
                            handleCancelRename(e);
                          }
                        }}
                      />
                      <button
                        className="rename-confirm-btn"
                        onClick={(e) => handleConfirmRename(e, item)}
                        title="Confirm"
                      >
                        ✓
                      </button>
                      <button
                        className="rename-cancel-btn"
                        onClick={(e) => handleCancelRename(e)}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="name-content">
                      <span>{item.Name}</span>
                      {item.Type === 'FOLDER' && (
                        <button
                          className="rename-icon-btn"
                          onClick={(e) => handleRenameClick(e, item)}
                          title="Rename folder"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        className="delete-icon-btn"
                        onClick={(e) => handleDeleteClick(e, item)}
                        title={`Delete ${item.Type === 'FOLDER' ? 'folder' : 'file'}`}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
