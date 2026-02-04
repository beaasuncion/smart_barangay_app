import React from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";
import BurgerMenu from "./BurgerMenu";
import bg from "../assets/bg.jpg";

function SettingsPage() {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-home");       // Back to dashboard
  const goToForgotPassword = () => navigate("/forgot-password"); // Redirect

  return (
    <div className="settings-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="overlay" />

      <BurgerMenu />

      <div className="settings-panel">
        <h2>Settings</h2>
        <form className="settings-form" onSubmit={(e) => { 
            e.preventDefault(); 
            goToForgotPassword(); 
        }}>
          <input type="password" placeholder="Current Password" />
          <input type="password" placeholder="New Password" />
          <input type="password" placeholder="Confirm New Password" />
          <button type="submit">Change Password</button>
        </form>
        <button className="back-btn" onClick={goBack}>← Back to Dashboard</button>
      </div>
    </div>
  );
}

export default SettingsPage;
