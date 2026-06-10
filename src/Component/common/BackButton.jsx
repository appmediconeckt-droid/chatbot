import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

const BackButton = ({ to = null, onClick = null, label = "Back" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <button
      className="back-button"
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <span className="back-button-icon">&lt;</span>
    </button>
  );
};

export default BackButton;
