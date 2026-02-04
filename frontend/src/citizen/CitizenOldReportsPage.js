// src/citizen/CitizenOldReportsPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./CitizenOldReportsPage.css";
import bg from "../assets/bg.jpg";
import BurgerMenu from "../components/BurgerMenu";

export default function CitizenOldReportsPage({ posts, currentUser }) {
  const navigate = useNavigate();

  // Optional: show only current user's posts
  const userPosts = currentUser
    ? posts.filter((post) => post.userName === currentUser.name)
    : posts;

  return (
    <div
      className="Citizen-home-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="background-overlay" />
      <BurgerMenu currentUser={currentUser} />

      <div className="content-wrapper">
        <div className="panel">
          <h2 className="recent-posts-label">Old Reports</h2>

          <div className="latest-posts">
            {userPosts.length === 0 ? (
              <p className="no-posts">No old reports yet.</p>
            ) : (
              userPosts.map((post) => (
                <div
                  key={post.id}
                  className={`post-card ${post.alert ? "alert" : ""}`}
                >
                  <img
                    src={post.avatar || "https://via.placeholder.com/80"}
                    alt="Avatar"
                    className="post-image"
                  />

                  <div className="post-content">
                    <div className="name-date">
                      <p className="post-name">
                        {post.userName}
                        <span className="hover-details">
                          Location: {post.location} | Phone: {post.phoneNumber}
                          {post.alert && " ⚠️ ALERT"}
                        </span>
                      </p>
                      <span className="post-date">{post.date}</span>
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
              ))
            )}
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              className="main-btn"
              onClick={() => navigate("/citizen-home")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
