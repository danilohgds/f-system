import React from 'react';
import './FileTable.css';

const FileTable = ({ fileList, currentFolder }) => {
  return (
    <div className="file-table-container">
      <h2>Current Folder: {currentFolder || 'ROOT'}</h2>
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Depth</th>
            <th>Parent Folder</th>
          </tr>
        </thead>
        <tbody>
          {fileList.length === 0 ? (
            <tr>
              <td colSpan="4" className="empty-message">
                No files or folders found
              </td>
            </tr>
          ) : (
            fileList.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.path}</td>
                <td>{item.depth}</td>
                <td>{item.parent_folder}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
