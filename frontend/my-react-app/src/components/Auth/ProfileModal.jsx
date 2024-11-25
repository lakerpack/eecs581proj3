/*
Artifact(s): User interface
Description: React component that provides user profile customization functionality. 
Name: Anil Thapa
Date: 11/24/2024
Preconditions: Valid authentication token and AuthProvider context
Postconditions: Updates user profile information in both frontend and backend
Error and exception conditions: Image upload failures, network errors, invalid image formats
Side effects: Updates localStorage user data, triggers page reload on successful updates
*/

import React, { useState } from 'react'
import { useAuth } from './Auth'
import './ProfileModal.css'
import editButton from '../../assets/editbutton.svg'
import defaultProfile from "../../assets/defaultProfile.svg"


/*
When creating the ProfileModal component, we define the necessary variables to manage profile updates.
These variables handle both the UI state and profile data modifications.
name/description -- form values for profile updates
isUpdating -- tracks ongoing API requests
error/successMessage -- feedback for user actions
useDefaultImage -- manages profile image fallback state
*/
export function ProfileModal({ isOpen, onClose }) {
  const { user, token } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState(user?.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [useDefaultImage, setUseDefaultImage] = useState(false);

  if (!isOpen) return null;

  /*
  Handle profile information updates through the backend API.
  Updates name and description --> stores in localStorage --> refreshes page
  Manages loading states and error handling during the update process
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://127.0.0.1:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Profile updated successfully!');
        const updatedUser = { ...user, name, description };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsUpdating(false);
    }
  };

  /*
  Handle profile image uploads and updates.
  Upload new image --> fetch updated profile --> update localStorage
  Manages file upload states and provides user feedback during the process
  */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUpdating(true);
      setError('');
      const response = await fetch('http://127.0.0.1:5000/api/upload_profile_image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        const profileResponse = await fetch('http://127.0.0.1:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const profileData = await profileResponse.json();

        localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
        setSuccessMessage('Profile image updated successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsUpdating(false);
    }
  };

  /*
  Format and validate profile image URLs.
  Handles both local and remote image paths
  Provides fallback to placeholder when image is unavailable
  Returns properly formatted URL for profile image display
  */
  function getProfileImageUrl(imagePath) {
    if (!imagePath) return '/api/placeholder/100/100';

    if (imagePath.startsWith('http')) return imagePath;

    const filename = imagePath.split('\\').pop().split('/').pop();
    return `http://127.0.0.1:5000/profile_images/${filename}`;
  }

  /*
  Return the modal interface with all necessary form elements and handlers.
  Includes profile image upload, name/description fields, and action buttons
  Provides visual feedback for form submission and error states
  Handles click events to prevent modal closure when clicking inside
  */
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="profile-image-container">
          <div className="profile-image-wrapper">
            <img src={useDefaultImage ? defaultProfile : getProfileImageUrl(user?.profile_image)}
              className="profile-image" onError={() => setUseDefaultImage(true)} />
            <label className="image-upload-button">
              <img src={editButton} id="edit-logo" />
              <input type="file" className="image-upload-input"
                accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-field">
            <label className="field-label">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="field-input" placeholder="Your name" />
          </div>
          <div className="form-field">
            <label className="field-label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="field-input field-textarea" placeholder="Tell us about yourself"
            />
          </div>
          {error && (
            <div className="status-message error-message">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="status-message success-message">
              {successMessage}
            </div>
          )}
          <div className="form-footer">
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
            <button type="submit" disabled={isUpdating} className="save-button">{isUpdating ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}