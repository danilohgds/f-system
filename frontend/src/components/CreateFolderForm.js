import React, { useState } from 'react';
import './CreateFolderForm.css';

const CreateFolderForm = ({ onCreateFolder, currentFolderName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateFolder(folderName);
      setFolderName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFolderName('');
  };

  return (
    <div className="create-folder-container">
      {!isOpen ? (
        <button className="create-folder-btn" onClick={() => setIsOpen(true)}>
          + Create Folder
        </button>
      ) : (
        <div className="create-folder-form-wrapper">
          <form className="create-folder-form" onSubmit={handleSubmit}>
            <h3>Create New Folder in "{currentFolderName}"</h3>

            <div className="form-group">
              <label htmlFor="folder_name">Folder Name:</label>
              <input
                type="text"
                id="folder_name"
                name="folder_name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !folderName.trim()}
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

export default CreateFolderForm;
