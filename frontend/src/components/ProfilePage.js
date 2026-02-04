// components/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

function ProfilePage({ currentUser }) {
  const [userData, setUserData] = useState(currentUser);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/citizen-login');
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/${currentUser._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          
          const postsResponse = await fetch(`http://localhost:5000/api/posts/user/${currentUser._id}`);
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            setUserPosts(postsData);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser, navigate]);

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!userData) {
    return (
      <div className="profile-not-found">
        <h2>User not found</h2>
        <p>Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src={userData.avatar || '/default-avatar.png'} 
            alt={userData.name} 
          />
        </div>
        <h1>{userData.name}</h1>
        <p className="user-email">{userData.email}</p>
        <p className="user-type-badge">
          {userData.userType === 'citizen' ? 'Citizen User' : 'Administrator'}
        </p>
      </div>

      <div className="profile-details">
        <h2>Personal Information</h2>
        
        <div className="detail-row">
          <span className="detail-label">Full Name:</span>
          <span className="detail-value">{userData.name}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{userData.email}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span className="detail-value">{userData.address || 'Not provided'}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Phone:</span>
          <span className="detail-value">{userData.phone || 'Not provided'}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Account Created:</span>
          <span className="detail-value">
            {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      <div className="user-statistics">
        <h2>Activity Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{userPosts.length}</h3>
            <p>Reports Submitted</p>
          </div>
          <div className="stat-card">
            <h3>
              {userPosts.filter(post => post.status === 'resolved').length}
            </h3>
            <p>Resolved Reports</p>
          </div>
          <div className="stat-card">
            <h3>
              {userPosts.filter(post => post.status === 'pending').length}
            </h3>
            <p>Pending Reports</p>
          </div>
        </div>
      </div>

      <div className="recent-posts">
        <h2>Recent Reports</h2>
        {userPosts.length === 0 ? (
          <p className="no-posts">No reports submitted yet.</p>
        ) : (
          <div className="posts-list">
            {userPosts.slice(0, 5).map((post, index) => (
              <div key={post._id || `post-${index}`} className="post-item">
                <h4>{post.title}</h4>
                <p>{post.description?.substring(0, 100)}...</p>
                <span className={`post-status ${post.status}`}>
                  {post.status}
                </span>
                <span className="post-date">
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;