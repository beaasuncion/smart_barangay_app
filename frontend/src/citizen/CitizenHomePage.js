// src/citizen/CitizenHomePage.js - UPDATED WITHOUT IDS
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CitizenHomePage.css";
import bg from "../assets/bg.jpg";
import defaultAvatar from "../assets/avatar.jpg";
import alertAvatar from "../assets/alert.jpg";
import BurgerMenu from "../components/BurgerMenu";

export default function CitizenHomePage({ posts = [], currentUser: propUser, onLogout }) {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Get current user
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        
        // Check user role
        const userRole = parsed.role || parsed.userType || "citizen";
        
        if (userRole === "admin") {
          navigate("/admin-home");
          return;
        }
        
        // Create citizen user object
        const citizenUser = {
          name: parsed.first_name || parsed.name || "Citizen",
          first_name: parsed.first_name || parsed.name || "Citizen",
          fullName: parsed.full_name || parsed.first_name || parsed.name || "Citizen",
          email: parsed.email || "",
          location: parsed.location || parsed.address || "",
          phone: parsed.phone || parsed.phoneNumber || "",
          avatar: parsed.avatar || defaultAvatar,
          role: userRole,
          id: parsed.id,
          ...parsed
        };
        
        setLoggedInUser(citizenUser);
        setDebugInfo(`✅ Logged in as: ${citizenUser.first_name}`);
        console.log("✅ Citizen logged in:", citizenUser);
        
      } catch (error) {
        console.error("Error parsing user:", error);
        navigate("/citizen-login");
      }
    } else if (propUser) {
      setLoggedInUser(propUser);
      setDebugInfo(`✅ Using prop user: ${propUser.first_name}`);
    } else {
      navigate("/citizen-login");
    }
  }, [navigate, propUser]);

  // Remove IDs from posts and transform them
  useEffect(() => {
    if (posts && posts.length > 0) {
      // Create posts without visible IDs
      const postsWithoutIds = posts.map((post, index) => {
        // Remove ID from display but keep for internal use
        return {
          ...post,
          displayId: `post-${index + 1}`, // Simple sequential display ID
          // Clean userName by removing any ID numbers
          cleanUserName: post.userName ? post.userName.replace(/\(ID: \d+\)/, '').trim() : post.userName
        };
      });
      setFilteredPosts(postsWithoutIds);
    } else {
      setFilteredPosts([]);
    }
  }, [posts]);

  // Function to get display name for posts - IMPROVED (without IDs)
  const getPostDisplayName = (post) => {
    // If it's an admin post, always show "Admin"
    if (post.userType === "admin" || post.userName === "Admin") {
      return "🏛️ Barangay Admin";
    }
    
    // If post has no userName, check if it's from current user
    if (!post.userName || post.userName === "No Name") {
      if (post.userId === loggedInUser?.id) {
        return "👤 You";
      }
      return "👤 Anonymous";
    }
    
    // Use clean userName (without ID numbers)
    const cleanUserName = post.cleanUserName || post.userName;
    
    // Check if this post belongs to the current logged-in citizen
    const currentUserName = loggedInUser?.first_name || loggedInUser?.name;
    const isCurrentUserPost = 
      cleanUserName === currentUserName ||
      post.userName === loggedInUser?.name ||
      (post.userId && post.userId === loggedInUser?.id);
    
    if (isCurrentUserPost) {
      return "👤 You";
    } else {
      // Show actual citizen name for other citizens' posts
      return `👤 ${cleanUserName}`;
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/";
    }
  };

  if (!loggedInUser) {
    return (
      <div className="Citizen-home-container" style={{ backgroundImage: `url(${bg})` }}>
        <div className="background-overlay" />
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Count post types for debug
  const adminPosts = filteredPosts.filter(p => p.userType === "admin" || p.userName === "Admin");
  const citizenPosts = filteredPosts.filter(p => !(p.userType === "admin" || p.userName === "Admin"));

  return (
    <div className="Citizen-home-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="background-overlay" />

      {/* Burger menu */}
      <BurgerMenu 
        currentUser={loggedInUser} 
        onProfileClick={() => setShowProfileModal(true)} 
      />

      {/* Main content */}
      <div className="content-wrapper">
        <div className="panel">
          {/* Welcome message */}
          <div className="welcome-section">
            <h1>Welcome, {loggedInUser.first_name}!</h1>
            <p className="welcome-subtitle">
              Barangay reporting and announcement system
            </p>
          </div>

          {/* DEBUG PANEL - Optional: You can remove this in production */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              background: "#e9ecef", 
              padding: "15px", 
              borderRadius: "8px", 
              marginBottom: "20px",
              border: "2px solid #6c757d",
              fontFamily: "monospace"
            }}>
              <h4 style={{marginTop: 0}}>🔍 DEBUG INFORMATION</h4>
              <p><strong>Current User:</strong> {loggedInUser.first_name}</p>
              <p><strong>Posts Count:</strong> Total: {filteredPosts.length} | Admin: {adminPosts.length} | Citizen: {citizenPosts.length}</p>
              <p><strong>Status:</strong> {debugInfo}</p>
            </div>
          )}

          <div className="top-buttons">
            <button className="main-btn" onClick={() => navigate("/post-incident")}>
              📄 FILE A REPORT
            </button>
            <button className="main-btn" onClick={() => navigate("/citizen-old-reports")}>
              📋 MY REPORTS
            </button>
          </div>

          <h2 className="recent-posts-label">📢 Recent Announcements & Reports</h2>

          {filteredPosts.length === 0 ? (
            <div className="empty-posts">
              <p>📭 No reports or announcements yet.</p>
              <p><small>Be the first to post a report!</small></p>
            </div>
          ) : (
            <div className="latest-posts">
              {filteredPosts.map((post, index) => {
                const isAdminPost = post.userType === "admin" || post.userName === "Admin";
                const displayName = getPostDisplayName(post);
                
                return (
                  <div key={post.id || index} className={`post-card ${post.alert || isAdminPost ? "alert" : ""}`}>
                    <img 
                      src={isAdminPost ? alertAvatar : (post.avatar || defaultAvatar)} 
                      alt="Avatar" 
                      className="post-image" 
                    />
                    <div className="post-content">
                      <div className="name-date">
                        <p className="post-name">
                          {displayName}
                          {isAdminPost && <span className="official-badge"> OFFICIAL</span>}
                          {post.alert && <span className="alert-badge"> URGENT</span>}
                          {/* Removed post-id span */}
                        </p>
                        <span className="post-date">{post.date || "Recently"}</span>
                      </div>
                      {post.title && <h4 className="post-title">{post.title}</h4>}
                      <p className="post-content-text">{post.content || ""}</p>
                      {post.location && <p className="post-location">📍 {post.location}</p>}
                      {post.postImage && (
                        <img src={post.postImage} alt="Post attachment" className="post-attachment" />
                      )}
                      
                      <div className="post-footer">
                        <span className="post-type">
                          {isAdminPost ? "📢 Barangay Announcement" : "📝 Citizen Report"}
                        </span>
                        {!isAdminPost && displayName === "👤 You" && (
                          <button 
                            className="delete-btn"
                            onClick={() => {
                              if (window.confirm("Delete your report?")) {
                                console.log("Deleting post:", post.id);
                                // Add delete functionality here
                              }
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-container">
              <img src={loggedInUser.avatar} alt="Avatar" className="profile-avatar" />
            </div>

            <div className="profile-info">
              <h3>{loggedInUser.fullName}</h3>
              <p><strong>Account Type:</strong> Citizen</p>
              <p><strong>Email:</strong> {loggedInUser.email}</p>
              <p><strong>Location:</strong> {loggedInUser.location}</p>
              <p><strong>Contact:</strong> {loggedInUser.phone}</p>

              <div className="profile-buttons">
                <button onClick={() => navigate("/edit-profile")}>✏️ Edit Profile</button>
                <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}