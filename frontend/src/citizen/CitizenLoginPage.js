// src/citizen/CitizenLoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CitizenLoginPage.css";

export default function CitizenLoginPage() {
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
      const BACKEND_URL = "http://localhost:5000";
      const response = await fetch(`${BACKEND_URL}/citizen-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.error || "Login failed");
      }

      if (!data.citizen) {
        throw new Error("Invalid server response");
      }

      // ✅ ADD THIS CHECK: Verify the user is actually a citizen
      const userRole = data.citizen.role || data.citizen.userType || "";
      
      if (userRole.toLowerCase() === "admin") {
        throw new Error("This is an admin account. Please use the Admin Login page.");
      }
      
      if (userRole.toLowerCase() !== "citizen") {
        throw new Error("Unauthorized access. This account is not registered as a citizen.");
      }

      // Save user data to localStorage
      localStorage.setItem("currentUser", JSON.stringify({
        id: data.citizen.id,
        first_name: data.citizen.first_name,
        email: data.citizen.email,
        role: userRole.toLowerCase() || "citizen"
      }));
      
      localStorage.setItem("isLoggedIn", "true");

      // Show success message
      alert(`Welcome ${data.citizen.first_name}! Login successful.`);

      // Redirect to homepage
      navigate("/citizenhomepage");

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      alert(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-login-container">
      <div className="citizen-login-card">
        <h2>Citizen Login</h2>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form className="citizen-login-form" onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="citizen-login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-links">
          <p>
            Don't have an account?{" "}
            <span 
              onClick={() => navigate("/register")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Register here
            </span>
          </p>
          <p>
            Admin user?{" "}
            <span 
              onClick={() => navigate("/admin-login")} 
              className="link"
              style={{cursor: 'pointer', color: '#2196F3', textDecoration: 'underline'}}
            >
              Admin Login
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