// src/citizen/PostIncidentPage.js - FIXED
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PostIncidentPage.css";
import defaultAvatar from "../assets/avatar.jpg";
import bg from "../assets/bg.jpg";

export default function PostIncidentPage({ posts, setPosts, currentUser, onPostCreated }) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // DEBUG: Check what data we have
  console.log("🔍 PostIncidentPage - currentUser:", currentUser);
  console.log("🔍 Available fields:", {
    first_name: currentUser?.first_name,
    name: currentUser?.name,
    firstName: currentUser?.firstName,
    fullName: currentUser?.fullName,
    id: currentUser?.id,
    allFields: Object.keys(currentUser || {})
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return alert("Please fill in the description!");

    // Get the ACTUAL user name - try multiple fields
    let actualUserName = "Citizen";
    
    if (currentUser) {
      // Try different possible name fields
      actualUserName = currentUser.first_name || 
                      currentUser.name || 
                      currentUser.firstName || 
                      currentUser.fullName || 
                      "Citizen";
      
      // If still no name, try to extract from email
      if (actualUserName === "Citizen" && currentUser.email) {
        const emailName = currentUser.email.split('@')[0];
        actualUserName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }

    console.log("✅ Using userName:", actualUserName);
    console.log("✅ User ID:", currentUser?.id);

    const newPost = {
      id: Date.now(),
      userName: actualUserName, // ACTUAL NAME HERE
      userId: currentUser?.id, // Store user ID
      location: currentUser?.location || currentUser?.address || "Barangay",
      phoneNumber: currentUser?.phone || currentUser?.phoneNumber || "N/A",
      content: description,
      date: new Date().toLocaleString(),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      avatar: defaultAvatar,
      postImage: imageFile ? URL.createObjectURL(imageFile) : null,
      alert: false,
      userType: "citizen",
      // Debug info
      _debug: {
        source: "PostIncidentPage",
        userFirstName: currentUser?.first_name,
        userName: currentUser?.name,
        userId: currentUser?.id,
        timestamp: new Date().toISOString()
      }
    };

    console.log("📝 NEW POST CREATED:", newPost);

    // Save to localStorage for backup
    const existingPosts = JSON.parse(localStorage.getItem("posts")) || [];
    const updatedPosts = [newPost, ...existingPosts];
    localStorage.setItem("posts", JSON.stringify(updatedPosts));
    console.log("💾 Saved to localStorage, total posts:", updatedPosts.length);

    // Call the callback if provided
    if (onPostCreated) {
      onPostCreated(newPost);
    } else if (setPosts) {
      // Fallback for old method
      setPosts([newPost, ...posts]);
    }
    
    alert(`Report successfully submitted as ${actualUserName}!`);
    navigate("/citizenhomepage");
  };

  return (
    <div
      className="post-incident-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div className="background-overlay" />
      <div className="post-incident-card">
        <h1>File a New Incident Report</h1>
        
        {/* User Info Display */}
        <div style={{
          background: "#e7f3ff",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          borderLeft: "5px solid #007bff"
        }}>
          <h3 style={{marginTop: 0}}>👤 Submitting as:</h3>
          <p><strong>Name:</strong> {currentUser?.first_name || currentUser?.name || "Citizen"}</p>
          <p><strong>Location:</strong> {currentUser?.location || currentUser?.address || "Not specified"}</p>
          <p><strong>Contact:</strong> {currentUser?.phone || currentUser?.phoneNumber || "Not specified"}</p>
          <p><small>This report will be posted under your name</small></p>
        </div>

        <form className="post-incident-form" onSubmit={handleSubmit}>
          <label htmlFor="description">Incident Details *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, when, and where..."
            required
            rows={6}
          />

          <label htmlFor="image">Attach Photo (Optional)</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <div className="post-incident-buttons">
            <button type="submit" className="submit-btn">
              📄 Submit Report as {currentUser?.first_name || currentUser?.name || "Citizen"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/citizenhomepage")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}