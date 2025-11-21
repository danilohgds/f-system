import React, { useState } from 'react';
import './CreateFileForm.css';

const CreateFileForm = ({ onCreateFile, currentFolderName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateFile(fileName);
      setFileName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating file:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFileName('');
  };

  return (
    <div className="create-file-container">
      {!isOpen ? (
        <button className="create-file-btn" onClick={() => setIsOpen(true)}>
          + Create File
        </button>
      ) : (
        <div className="create-file-form-wrapper">
          <form className="create-file-form" onSubmit={handleSubmit}>
            <h3>Create New File in "{currentFolderName}"</h3>

            <div className="form-group">
              <label htmlFor="file_name">File Name:</label>
              <input
                type="text"
                id="file_name"
                name="file_name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                required
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !fileName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateFileForm;
