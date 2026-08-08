import { Link } from "react-router-dom";
import PrivacyPolicy from "../Component/Settings/PrivacyPolicy";
import { logoIcon } from "../assets/brandAssets";
import "./LandingPrivacyPolicy.css";

const LandingPrivacyPolicy = () => (
  <div className="landing-privacy-page">
    <header className="landing-privacy-nav">
      <Link to="/" className="landing-privacy-brand" aria-label="Humaeli home">
        <img src={logoIcon} alt="" aria-hidden="true" />
        <span>Humaeli</span>
      </Link>
      <Link to="/" className="landing-privacy-back">
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to home
      </Link>
    </header>

    <main className="landing-privacy-main">
      <PrivacyPolicy />
    </main>

    <footer className="landing-privacy-footer">
      <span>&copy; {new Date().getFullYear()} Humaeli. All rights reserved.</span>
      <Link to="/">Home</Link>
    </footer>
  </div>
);

export default LandingPrivacyPolicy;
