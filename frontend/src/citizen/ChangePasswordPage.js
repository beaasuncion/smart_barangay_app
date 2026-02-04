import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/bg.jpg";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ITO ANG BAGONG handleSave FUNCTION NA NASA QUESTION MO
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match!");
      return;
    }

    try {
      setLoading(true);
      
      // Kunin ang userId at token mula sa localStorage
      // IMPORTANT: Siguraduhin na naka-store ang 'userId' at 'token' sa localStorage
      // pagkatapos mag-login
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      // Kung wala ang userId o token, mag-error
      if (!userId || !token) {
        setError("Please login again.");
        navigate("/login");
        return;
      }

      // I-send ang request sa backend API
      const response = await fetch("http://localhost:5000/api/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password updated successfully!");
        
        // Optional: Clear the form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Balik sa dashboard
        navigate("/citizen-home");
      } else {
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        width: "100%",
        padding: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/citizen-home")}
        style={{
          position: "absolute",
          top: "30px",
          left: "30px",
          padding: "12px 25px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          fontSize: "1.2rem",
          fontWeight: "bold",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 1000,
        }}
        disabled={loading}
      >
        ← Back to Dashboard
      </button>

      {/* Card */}
      <div
        className="change-password-card"
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          maxWidth: "450px",
          width: "100%",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#333",
          }}
        >
          Change Password
        </h1>

        {/* Error Message Display */}
        {error && (
          <div style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form className="change-password-form" onSubmit={handleSave}>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button
            type="submit"
            className="change-password-btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>  
    </div>
  );
}