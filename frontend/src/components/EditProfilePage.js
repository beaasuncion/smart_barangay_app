// components/EditProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfilePage.css';
import defaultAvatar from '../assets/avatar.jpg';
import bg from '../assets/bg.jpg';

function EditProfilePage({ currentUser, onUpdateUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || currentUser.fullName || '',
        email: currentUser.email || '',
        address: currentUser.address || currentUser.location || '',
        phone: currentUser.phone || currentUser.phoneNumber || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Only address and phone are required validation
    if (!formData.address.trim()) {
      setError('Address is required');
      setLoading(false);
      return;
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\d\s\-\+\(\)]{7,15}$/.test(formData.phone)) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = {
        ...currentUser,
        address: formData.address,
        location: formData.address,
        phone: formData.phone,
        phoneNumber: formData.phone
      };

      // Update in localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Call parent update function if provided
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccess('Profile updated successfully!');
      
      // Redirect back to profile after 2 seconds
      setTimeout(() => {
        navigate('/citizenhomepage');
      }, 2000);

    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="edit-profile-container" style={{ backgroundImage: `url(${bg})` }}>
        <div className="background-overlay" />
        <div className="not-logged-in">
          <h2>Please Login</h2>
          <p>You need to be logged in to edit your profile.</p>
          <button onClick={() => navigate('/citizen-login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="background-overlay" />
      
      <div className="profile-modal edit-profile-modal">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        <div className="avatar-container">
          <img src={currentUser.avatar || defaultAvatar} alt="Profile" className="profile-avatar" />
        </div>

        <div className="profile-info">
          <h2 className="profile-name">Edit Profile</h2>
          
          {/* Display non-editable user info */}
          <div className="user-info-display">
            <div className="info-item">
              <strong>Full Name:</strong> {currentUser.name || currentUser.fullName}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {currentUser.email}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="edit-profile-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                required
                disabled={loading}
              />
            </div>

          <div className="form-group">
  <label>Phone Number *</label>
  <input
    type="tel"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    placeholder="Enter your phone number"
    required
    disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/citizenhomepage')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;