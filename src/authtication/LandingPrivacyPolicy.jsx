import { Link } from "react-router-dom";
import { useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import PrivacyPolicy from "../Component/Settings/PrivacyPolicy";
import { logoIconCompact } from "../assets/brandAssets";
import "./LandingPrivacyPolicy.css";   // updated styles applied

const LandingPrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Humaeli";
  }, []);

  return (
    <div className="landing-privacy-page">
      <header className="landing-privacy-nav">
        <Link to="/" className="landing-privacy-brand" aria-label="Humaeli home">
          <img
            src={logoIconCompact}
            alt="Humaeli Logo"
            className="landing-privacy-logo"
          />
          {/* optional: <span>Humaeli</span> if you want text next to logo */}
        </Link>
        <Link to="/" className="landing-privacy-back">
          <FaArrowLeft aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <main className="landing-privacy-main">
        <h1 className="landing-privacy-title">Privacy Policy</h1>
        <PrivacyPolicy variant="public" />
      </main>
    </div>
  );
};

export default LandingPrivacyPolicy;