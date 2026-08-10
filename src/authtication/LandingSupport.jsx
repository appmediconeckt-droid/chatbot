import { Link } from "react-router-dom";
import { logoIcon } from "../assets/brandAssets";
import "./LandingSupport.css";

const SUPPORT_EMAIL = "support@humaeli.com";
const SUPPORT_PHONE_DISPLAY = "+91 91529 87821";
const SUPPORT_PHONE_LINK = "+919152987821";
const LEGAL_ADDRESS = "Saket Nagar, Indore, Madhya Pradesh 452018, India";

const LandingSupport = () => (
  <div className="landing-support-page">
    <header className="landing-support-nav">
      <Link to="/" className="landing-support-brand" aria-label="Humaeli home">
        <img src={logoIcon} alt="" aria-hidden="true" />
        <span>Humaeli</span>
      </Link>
      <Link to="/" className="landing-support-back">
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Back to home
      </Link>
    </header>

    <main className="landing-support-main">
      <section className="landing-support-hero">
        <p className="landing-support-kicker">Humaeli Support</p>
        <h1>Contact Support</h1>
        <p>
          Need help with Humaeli, your account, appointments, billing, privacy,
          or safety concerns? Use any contact option below and our team will
          help you as quickly as possible.
        </p>
      </section>

      <section className="landing-support-grid" aria-label="Support contact options">
        <article className="landing-support-card">
          <span className="material-symbols-outlined" aria-hidden="true">mail</span>
          <h2>Email Support</h2>
          <p>For app issues, account questions, privacy requests, billing, or general support.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Humaeli%20Support%20Request`}>
            {SUPPORT_EMAIL}
          </a>
          <small>Typical response: within 24 hours.</small>
        </article>

        <article className="landing-support-card">
          <span className="material-symbols-outlined" aria-hidden="true">call</span>
          <h2>Phone Support</h2>
          <p>Call us for urgent support requests or help accessing your account.</p>
          <a href={`tel:${SUPPORT_PHONE_LINK}`}>{SUPPORT_PHONE_DISPLAY}</a>
          <small>Available for India support requests.</small>
        </article>

        <article className="landing-support-card">
          <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
          <h2>Legal Address</h2>
          <p>Use this address for legal notices, postal communication, or formal requests.</p>
          <address>{LEGAL_ADDRESS}</address>
        </article>
      </section>

      <section className="landing-support-details">
        <div>
          <h2>What to include</h2>
          <p>
            Please include your registered email or phone number, device type,
            a short description of the issue, and any screenshots that can help
            us investigate.
          </p>
        </div>
        <div>
          <h2>Safety and crisis help</h2>
          <p>
            Humaeli support is not an emergency service. If you or someone else
            may be in immediate danger, contact local emergency services first.
            For mental health crisis support in India, you can also call{" "}
            <a href={`tel:${SUPPORT_PHONE_LINK}`}>{SUPPORT_PHONE_DISPLAY}</a>.
          </p>
        </div>
        <div>
          <h2>Privacy or legal requests</h2>
          <p>
            For data, privacy, grievance, or legal requests, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20or%20Legal%20Request`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            with the subject line that best describes your request.
          </p>
        </div>
      </section>
    </main>

    <footer className="landing-support-footer">
      <span>&copy; {new Date().getFullYear()} Humaeli. All rights reserved.</span>
      <nav aria-label="Support footer links">
        <Link to="/">Home</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>Email Support</a>
      </nav>
    </footer>
  </div>
);

export default LandingSupport;
