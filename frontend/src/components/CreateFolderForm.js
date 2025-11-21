import React, { useState } from 'react';
import './CreateFolderForm.css';

const CreateFolderForm = ({ onCreateFolder, currentFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    parent_name: '',
    name: '',
    parent_folder: currentFolder || 'ROOT',
    path: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateFolder(formData);
      setFormData({
        parent_name: '',
        name: '',
        parent_folder: currentFolder || 'ROOT',
        path: '',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      parent_name: '',
      name: '',
      parent_folder: currentFolder || 'ROOT',
      path: '',
    });
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
            <h3>Create New Folder</h3>

            <div className="form-group">
              <label htmlFor="parent_name">Parent Name:</label>
              <input
                type="text"
                id="parent_name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Folder Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="parent_folder">Parent Folder:</label>
              <input
                type="text"
                id="parent_folder"
                name="parent_folder"
                value={formData.parent_folder}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="path">Path:</label>
              <input
                type="text"
                id="path"
                name="path"
                value={formData.path}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
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
