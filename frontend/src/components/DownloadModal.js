import React from 'react';
import './DownloadModal.css';

const DownloadModal = ({ isOpen, fileName, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Downloading File</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="download-icon">📥</div>
          <p className="download-message">DOWNLOADING FILE</p>
          {fileName && <p className="file-name-display">{fileName}</p>}
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
