import React from "react";
import { useNavigate } from "react-router-dom";
import "./SwitchUI.css";

function SwitchUI({ current }) {
  const navigate = useNavigate();

  const handleSwitch = () => {
    if (current === "admin") {
      navigate("/"); // citizen landing page
    } else {
      navigate("/admin-login"); // admin login page
    }
  };

  return (
    <div className="switch-ui">
      <button onClick={handleSwitch}>
        Switch to {current === "admin" ? "Citizen" : "Admin"} UI
      </button>
    </div>
  );
}

export default SwitchUI;
