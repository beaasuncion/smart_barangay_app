// src/admin/AdminOldReportsPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminOldReportsPage.css";
import bg from "../assets/bg.jpg";
import BurgerMenu from "../components/BurgerMenu";

export default function AdminOldReportsPage({ posts, currentUser }) {
  const navigate = useNavigate();

  // Admin sees all posts
  const allPosts = posts || [];

  return (
    <div
      className="admin-home-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="background-overlay" />
      {currentUser && <BurgerMenu currentUser={currentUser} />}

      <div className="content-wrapper">
        <div className="panel">
          <h2 className="recent-posts-label">Old Reports & Announcements</h2>

          <div className="latest-posts">
            {allPosts.length === 0 ? (
              <p className="no-posts">No reports or announcements yet.</p>
            ) : (
              allPosts.map((post) => {
                const isAdminPost = post.userType === "admin";

                return (
                  <div
                    key={post.id}
                    className={`post-card ${
                      post.alert || isAdminPost ? "alert" : ""
                    }`}
                  >
                    <img
                      src={
                        isAdminPost
                          ? "/assets/alert.png" // admin special avatar
                          : post.avatar || "https://via.placeholder.com/80"
                      }
                      alt="Avatar"
                      className="post-image"
                    />

                    <div className="post-content">
                      <div className="name-date">
                        <p className="post-name">
                          {post.userName || (isAdminPost ? "Admin" : "Anonymous")}
                          <span className="hover-details">
                            Location: {post.location || "-"} | Phone:{" "}
                            {post.phoneNumber || "-"}
                            {post.alert && " ⚠️ ALERT"}
                            {isAdminPost && " 🔔 ADMIN"}
                          </span>
                        </p>
                        <span className="post-date">{post.date || "-"}</span>
                      </div>

                      <p>{post.content}</p>

                      {post.postImage && (
                        <img
                          src={post.postImage}
                          alt="Post attachment"
                          className="post-attachment"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="main-btn"
              onClick={() => navigate("/admin-home")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
