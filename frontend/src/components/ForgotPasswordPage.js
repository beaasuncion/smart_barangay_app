import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPasswordPage.css";
import bg from "../assets/bg.jpg";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSend = (e) => {
    e.preventDefault();
    console.log("Send reset link to:", email);
  };

  const goBack = () => {
    navigate("/admin-login"); // <-- navigates to login page
  };

  return (
    <div
      className="forgot-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="forgot-card">
        <h2>RESET PASSWORD</h2>
        <p className="sub">Enter your registered email to receive a reset link.</p>

        <form onSubmit={handleSend}>
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">SEND RESET LINK</button>
        </form>

        <p className="back" onClick={goBack}>
          ← Back to Login
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
