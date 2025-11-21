import React from 'react';
import './FileTable.css';

const FileTable = ({ fileList, currentFolder, onFolderClick }) => {
  const handleItemClick = (item) => {
    // Only navigate if it's a folder
    if (item.Type === 'FOLDER' && onFolderClick) {
      onFolderClick(item.ItemId, item.Name);
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
                <td className={item.Type === 'FOLDER' ? 'name-cell folder-name' : 'name-cell'}>
                  {item.Name}
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
