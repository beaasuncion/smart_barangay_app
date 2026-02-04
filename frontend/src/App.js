// src/App.js - FIXED
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// ===== CITIZEN PAGES =====
import SignUpButton from "./citizen/SignUpButton";
import RegistrationAuth from "./citizen/RegistrationAuth";
import CitizenLoginPage from "./citizen/CitizenLoginPage";
import CitizenHomePage from "./citizen/CitizenHomePage";
import PostIncidentPage from "./citizen/PostIncidentPage";
import CitizenOldReportsPage from "./citizen/CitizenOldReportsPage"; 

// ===== ADMIN PAGES =====
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminHomePage from "./admin/AdminHomePage";
import AdminPostPage from "./admin/AdminPostPage";
import AdminOldReportsPage from "./admin/AdminOldReportsPage";
import PendingAccountsPage from "./admin/PendingAccountsPage";

// ===== COMMON COMPONENTS =====
import ProfilePage from "./components/ProfilePage";
import EditProfilePage from "./components/EditProfilePage";
import SettingsPage from "./components/SettingsPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";

// Helper function to check if user is admin
const isAdmin = (user) => {
  if (!user) return false;
  return user.role === "admin" || user.userType === "admin";
};

function App() {
  const navigate = useNavigate();
  
  // State for current user
  const [currentUser, setCurrentUser] = useState(null);
  
  // State for ALL posts (citizen + admin) - SHARED
  const [allPosts, setAllPosts] = useState(() => {
    // Initialize from localStorage
    const storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
    const adminPosts = JSON.parse(localStorage.getItem("adminPosts")) || [];
    const combined = [...storedPosts, ...adminPosts];
    
    // Sort by date (newest first)
    return combined.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(a.id || 0);
      const dateB = b.date ? new Date(b.date) : new Date(b.id || 0);
      return dateB - dateA;
    });
  });

  // Handle admin post creation
  const handleAdminPost = (newPost) => {
    const adminPosts = JSON.parse(localStorage.getItem("adminPosts")) || [];
    const updatedAdminPosts = [newPost, ...adminPosts];
    localStorage.setItem("adminPosts", JSON.stringify(updatedAdminPosts));
    
    // Update allPosts state
    const updatedAllPosts = [newPost, ...allPosts];
    setAllPosts(updatedAllPosts.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(a.id || 0);
      const dateB = b.date ? new Date(b.date) : new Date(b.id || 0);
      return dateB - dateA;
    }));
  };

  // Handle citizen post creation
  const handleCitizenPost = (newPost) => {
    const citizenPosts = JSON.parse(localStorage.getItem("posts")) || [];
    const updatedCitizenPosts = [newPost, ...citizenPosts];
    localStorage.setItem("posts", JSON.stringify(updatedCitizenPosts));
    
    // Update allPosts state
    const updatedAllPosts = [newPost, ...allPosts];
    setAllPosts(updatedAllPosts.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(a.id || 0);
      const dateB = b.date ? new Date(b.date) : new Date(b.id || 0);
      return dateB - dateA;
    }));
  };

  // Update setPosts function for backward compatibility
  const setPosts = (newPosts) => {
    // Filter admin posts
    const citizenOnlyPosts = newPosts.filter(post => 
      !(post.userType === "admin" || post.userName === "Admin")
    );
    
    // Update localStorage
    localStorage.setItem("posts", JSON.stringify(citizenOnlyPosts));
    
    // Get admin posts
    const adminPosts = JSON.parse(localStorage.getItem("adminPosts")) || [];
    
    // Combine and update allPosts
    const combined = [...citizenOnlyPosts, ...adminPosts];
    const sorted = combined.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(a.id || 0);
      const dateB = b.date ? new Date(b.date) : new Date(b.id || 0);
      return dateB - dateA;
    });
    
    setAllPosts(sorted);
  };

  // Get posts for backward compatibility
  const getPosts = () => {
    // Return citizen posts only for old components
    return JSON.parse(localStorage.getItem("posts")) || [];
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleLogin = (userData) => {
    const normalizedUser = {
      ...userData,
      userType: userData.userType || userData.role || "citizen",
      role: userData.role || userData.userType || "citizen"
    };
    
    setCurrentUser(normalizedUser);
    localStorage.setItem("currentUser", JSON.stringify(normalizedUser));
    
    if (isAdmin(normalizedUser)) {
      navigate("/admin-home");
    } else {
      navigate("/citizenhomepage");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const handleRegister = (userData) => {
    handleLogin(userData);
  };

  return (
    <>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<SignUpButton />} />
        <Route path="/register" element={<RegistrationAuth onRegister={handleRegister} />} />
        <Route path="/citizen-login" element={<CitizenLoginPage onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* ===== PENDING ACCOUNTS ROUTE ===== */}
        <Route
          path="/pending-accounts-page"
          element={
            isAdmin(currentUser) ? (
              <PendingAccountsPage />
            ) : (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                minHeight: "100vh", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center" 
              }}>
                <div>
                  <h2>Admin Access Required</h2>
                  <p>Please <a href="/admin-login">login as admin</a> to access this page.</p>
                  <p><small>Your role: {currentUser?.role || currentUser?.userType || 'citizen'}</small></p>
                </div>
              </div>
            )
          }
        />

        {/* ===== CITIZEN PROTECTED ROUTES ===== */}
        <Route
          path="/citizenhomepage"
          element={
            currentUser ? (
              <CitizenHomePage 
                posts={allPosts}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                minHeight: "100vh", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center" 
              }}>
                <div>
                  <h2>Please Login</h2>
                  <p>You need to <a href="/citizen-login">login</a> first.</p>
                </div>
              </div>
            )
          }
        />
        
        <Route
          path="/citizen-home"
          element={
            currentUser ? (
              <CitizenHomePage 
                posts={allPosts}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> first.</p>
              </div>
            )
          }
        />
        
        <Route
          path="/post-incident"
          element={
            currentUser ? (
              <PostIncidentPage 
                posts={getPosts()}
                setPosts={setPosts} 
                currentUser={currentUser}
                onPostCreated={handleCitizenPost}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> first.</p>
              </div>
            )
          }
        />
        
        <Route
          path="/citizen-old-reports"
          element={
            currentUser ? (
              <CitizenOldReportsPage 
                posts={allPosts}
                currentUser={currentUser} 
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> first.</p>
              </div>
            )
          }
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin-login" element={<AdminLoginPage onLogin={handleLogin} />} />
        
        <Route
          path="/admin-homepage"
          element={
            isAdmin(currentUser) ? (
              <AdminHomePage 
                posts={allPosts}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Admin Access Required</h2>
                <p>Please <a href="/admin-login">login as admin</a>.</p>
                <p><small>Your role: {currentUser?.role || currentUser?.userType || 'citizen'}</small></p>
              </div>
            )
          }
        />
        
        <Route
          path="/admin-home"
          element={
            isAdmin(currentUser) ? (
              <AdminHomePage 
                posts={allPosts}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Admin Access Required</h2>
                <p>Please <a href="/admin-login">login as admin</a>.</p>
              </div>
            )
          }
        />
        
        <Route
          path="/admin-post-page"
          element={
            isAdmin(currentUser) ? (
              <AdminPostPage 
                posts={allPosts}
                currentUser={currentUser}
                onPostCreated={handleAdminPost}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Admin Access Required</h2>
                <p>Please login as administrator.</p>
              </div>
            )
          }
        />
        
        <Route
          path="/admin-old-reports"
          element={
            isAdmin(currentUser) ? (
              <AdminOldReportsPage 
                posts={allPosts}
                currentUser={currentUser} 
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Admin Access Required</h2>
                <p>Please login as administrator.</p>
              </div>
            )
          }
        />

        {/* ===== COMMON COMPONENTS ===== */}
        <Route 
          path="/profile" 
          element={
            currentUser ? (
              <ProfilePage currentUser={currentUser} />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> to view your profile.</p>
              </div>
            )
          } 
        />
        
        <Route 
          path="/edit-profile" 
          element={
            currentUser ? (
              <EditProfilePage 
                currentUser={currentUser}
                onUpdateUser={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                }}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> to edit your profile.</p>
              </div>
            )
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            currentUser ? (
              <SettingsPage 
                currentUser={currentUser}
                onUpdateUser={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                }}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Please Login</h2>
                <p>You need to <a href="/citizen-login">login</a> to access settings.</p>
              </div>
            )
          } 
        />
      </Routes>
    </>
  );
}

export default App;