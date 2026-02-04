// src/admin/AdminLoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLoginPage.css";
import bg from "../assets/bg.jpg";

export default function AdminLoginPage({ onLogin }) {  // ✅ ADD onLogin prop
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Admin login response:", data);

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Admin login failed");
      }

      // ✅ FIXED: Save as currentUser NOT currentAdmin
      const adminData = {
        id: data.admin.id,
        _id: data.admin.id,
        first_name: data.admin.first_name,
        name: data.admin.first_name,  // ✅ ADD name property
        fullName: data.admin.first_name,
        email: data.admin.email,
        role: "admin",  // ✅ SET AS ADMIN
        userType: "admin",  // ✅ ADD userType
        ...data.admin
      };

      console.log("Saving admin data:", adminData);
      
      // ✅ FIXED: Save to currentUser
      localStorage.setItem("currentUser", JSON.stringify(adminData));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userType", "admin");

      // ✅ If onLogin prop exists, call it
      if (onLogin) {
        onLogin(adminData);  // ✅ This updates App.js state
      } else {
        // Fallback: redirect directly
        navigate("/admin-homepage");
      }

    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message);
      alert(`Admin login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-login-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          👑 Administrator Access Only 👑
        </p>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>Admin Email</label>
          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label>Admin Password</label>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Login as Admin"}
          </button>
        </form>

        <div className="login-links">
          <p>
            Not an admin?{" "}
            <span 
              onClick={() => navigate("/citizen-login")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Citizen Login
            </span>
          </p>
          <p>
            <span 
              onClick={() => navigate("/")} 
              className="link"
              style={{cursor: 'pointer', color: '#666', fontSize: '14px'}}
            >
              ← Back to Home
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}