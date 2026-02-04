import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BurgerMenu.css";

export default function BurgerMenu({ currentUser, onProfileClick }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    // Clear ALL authentication data
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isLoggedIn");
    
    // Show logout message
    alert("Successfully logged out!");
    
    // Redirect to landing page
    window.location.href = "/";
  };

  return (
    <>
      <div className="burger-menu-container">
        <button className="burger-btn" onClick={toggleMenu}>☰</button>
        {isOpen && (
          <div className="dropdown-menu">
            {/* My Profile Button */}
            <button onClick={() => { 
              if (onProfileClick) {
                onProfileClick(); // Call parent function to open profile modal
              } else {
                alert("Profile modal not available");
              }
              setIsOpen(false); 
            }}>
              👤 My Profile
            </button>
            
            {/* Change Password Button */}
            <button onClick={() => { 
              setShowChangePassModal(true); 
              setIsOpen(false); 
            }}>
              🔒 Change Password
            </button>
            
            {/* Logout Button */}
            <button onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassModal && (
        <div className="modal-overlay" onClick={() => setShowChangePassModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <ChangePasswordForm closeModal={() => setShowChangePassModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function ChangePasswordForm({ closeModal }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) return alert("Please fill all fields!");
    if (newPass !== confirmPass) return alert("Passwords do not match!");
    alert("Password changed successfully!");
    closeModal();
  };

  return (
    <form className="change-password-form" onSubmit={handleSubmit}>
      <label>Current Password</label>
      <input 
        type="password" 
        value={currentPass} 
        onChange={e => setCurrentPass(e.target.value)} 
        placeholder="Enter current password"
      />
      <label>New Password</label>
      <input 
        type="password" 
        value={newPass} 
        onChange={e => setNewPass(e.target.value)} 
        placeholder="Enter new password"
      />
      <label>Confirm New Password</label>
      <input 
        type="password" 
        value={confirmPass} 
        onChange={e => setConfirmPass(e.target.value)} 
        placeholder="Confirm new password"
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button type="submit" style={{ flex: 1, backgroundColor: '#4CAF50', color: 'white' }}>
          Change Password
        </button>
        <button type="button" onClick={closeModal} style={{ flex: 1, backgroundColor: '#f44336', color: 'white' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}