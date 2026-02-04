// src/citizen/RegistrationAuth.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./RegistrationAuth.css";
import bg from "../assets/bg.jpg";

function RegistrationAuth() {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle registration
  const handleRegistration = async (e) => {
    e.preventDefault();

    // Check passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/signup", {
        full_name: fullName,
        email,
        password,
      });

      // Check if registration is pending
      if (res.data.message && res.data.message.toLowerCase().includes("pending")) {
        alert(res.data.message);
        setLoading(false);
        // Stay on the registration form, don't navigate
        // Optionally clear form or keep as is
        return;
      }

      alert(res.data.message);
      setLoading(false);

      // Only redirect if not pending
      navigate("/registration-complete");
    } catch (err) {
      console.error("API ERROR:", err.response?.data?.error || err.message);
      alert(err.response?.data?.error || "Cannot connect to server or registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-card">
        <h2>REGISTER</h2>

        <form className="registration-form" onSubmit={handleRegistration}>
          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Enter your full name"
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />

          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{" "}
            <span 
              onClick={() => navigate("/citizen-login")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Login
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

export default RegistrationAuth;