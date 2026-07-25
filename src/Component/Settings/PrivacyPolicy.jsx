import React, { useState } from "react";
import {
  FaCloud,
  FaLock,
  FaComments,
  FaCreditCard,
  FaBriefcase,
  FaChevronDown,
  FaPhone,
  FaEnvelope,
  FaCommentDots,
  FaShieldAlt,
  FaEye,
  FaCheckCircle,
  FaGavel,
  FaUserShield,
  FaServer,
} from "react-icons/fa";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const [expandedSections, setExpandedSections] = useState({
    collect: true,
    use: true,
    professional: false,
    responsibilities: false,
    sharing: false,
    choices: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const ExpandableSection = ({ icon, title, sectionKey, children }) => (
    <details
      className="privacy-policy-expandable"
      open={expandedSections[sectionKey]}
      onToggle={() => toggleSection(sectionKey)}
    >
      <summary>
        <span className="privacy-policy-expandable-header">
          <i>{icon}</i>
          {title}
        </span>
        <FaChevronDown />
      </summary>
      <div className="privacy-policy-expandable-content">{children}</div>
    </details>
  );

  return (
    <section className="privacy-policy">
      <header className="privacy-policy-header">
        <div className="privacy-policy-header-badge">
          <FaShieldAlt />
          <div>
            <h1>Privacy & Security</h1>
            <p>
              Learn how MediConnect protects your professional information,
              patient conversations, appointments, earnings, and account data.
            </p>
          </div>
        </div>
        <div className="privacy-policy-header-meta">
          <span className="privacy-policy-updated">
            <FaCheckCircle /> Last Updated: 26 June 2024
          </span>
        </div>
      </header>

      <div className="privacy-policy-features">
        <article className="privacy-feature-card">
          <i className="privacy-feature-icon">
            <FaCloud />
          </i>
          <h3>Secure Data</h3>
          <p>
            Enterprise-grade encryption for all stored medical records and
            documents.
          </p>
        </article>

        <article className="privacy-feature-card">
          <i className="privacy-feature-icon">
            <FaComments />
          </i>
          <h3>Encrypted Chats</h3>
          <p>
            End-to-end encryption ensures your patient communications remain
            private.
          </p>
        </article>

        <article className="privacy-feature-card">
          <i className="privacy-feature-icon">
            <FaCreditCard />
          </i>
          <h3>Protected Payments</h3>
          <p>
            PCI-DSS compliant handling of all financial transactions and
            earnings.
          </p>
        </article>

        <article className="privacy-feature-card">
          <i className="privacy-feature-icon">
            <FaBriefcase />
          </i>
          <h3>Professional Privacy</h3>
          <p>
            Strict boundaries protecting your personal contact details from
            patients.
          </p>
        </article>
      </div>

      <div className="privacy-policy-content">
        <ExpandableSection
          icon={<FaServer />}
          title="Information We Collect"
          sectionKey="collect"
        >
          <p>
            When you register for MediConnect, we collect specific personal and
            professional information to verify your identity and medical
            credentials. This is necessary to maintain the integrity of our
            platform.
          </p>
          <ul>
            <li>
              <strong>Identity Data:</strong> Full name, date of birth,
              governmental ID.
            </li>
            <li>
              <strong>Professional Credentials:</strong> Medical license number,
              specializations, DEA number (if applicable).
            </li>
            <li>
              <strong>Technical Data:</strong> IP addresses, device identifiers,
              and platform usage logs for security auditing.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaEye />}
          title="How We Use Information"
          sectionKey="use"
        >
          <p>
            Your data is strictly utilized to provide, maintain, and improve the
            MediConnect service. We do not sell your personal data to
            third-party advertisers under any circumstances.
          </p>
          <h4>Primary use cases include:</h4>
          <ul>
            <li>Facilitating secure telehealth appointments and messaging.</li>
            <li>Processing payouts for completed sessions.</li>
            <li>Complying with legal obligations, including HIPAA regulations and reporting requirements.</li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaUserShield />}
          title="Professional Privacy"
          sectionKey="professional"
        >
          <p>
            We maintain strict professional boundaries to protect your privacy
            from patients. Your personal contact information, location data, and
            personal social media profiles are never shared or visible to
            patients.
          </p>
          <h4>Protected Information:</h4>
          <ul>
            <li>Personal phone numbers and email addresses</li>
            <li>Home address and location data</li>
            <li>Social media profiles and personal accounts</li>
            <li>Family information and personal relationships</li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaCheckCircle />}
          title="Your Responsibilities"
          sectionKey="responsibilities"
        >
          <p>
            As a healthcare provider using MediConnect, you have important
            responsibilities to maintain patient privacy and comply with
            applicable healthcare regulations.
          </p>
          <h4>Key Responsibilities:</h4>
          <ul>
            <li>
              Maintain HIPAA compliance in all patient communications and record
              handling.
            </li>
            <li>Keep your login credentials and passwords secure and confidential.</li>
            <li>
              Report any unauthorized access or suspected security breaches
              immediately.
            </li>
            <li>
              Use the platform only for legitimate healthcare consultation
              purposes.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaLock />}
          title="Sharing & Security"
          sectionKey="sharing"
        >
          <p>
            We implement comprehensive security measures to protect your data
            from unauthorized access, alteration, or disclosure. Your
            information is only shared as required by law or with your explicit
            consent.
          </p>
          <h4>Security Measures:</h4>
          <ul>
            <li>
              End-to-end encryption for all patient communications and sensitive
              data.
            </li>
            <li>
              Regular security audits and penetration testing by third-party
              experts.
            </li>
            <li>
              Secure data centers with physical access controls and 24/7
              monitoring.
            </li>
            <li>
              Automatic backups and disaster recovery protocols to prevent data
              loss.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaGavel />}
          title="Your Choices"
          sectionKey="choices"
        >
          <p>
            You have control over how your information is used and shared. You
            can update your privacy preferences at any time through your account
            settings.
          </p>
          <h4>Available Choices:</h4>
          <ul>
            <li>
              Manage communication preferences (notifications, newsletters, updates).
            </li>
            <li>
              Control data retention policies for your patient records and
              session history.
            </li>
            <li>
              Request data export in a standard, machine-readable format.
            </li>
            <li>
              Delete your account and associated data upon request (subject to
              legal retention requirements).
            </li>
          </ul>
        </ExpandableSection>
      </div>

      <section className="privacy-policy-support">
        <div className="privacy-policy-support-content">
          <h2>Need Privacy Assistance?</h2>
          <p>
            Our dedicated compliance and security team is here to help you with
            any privacy-related inquiries or data requests.
          </p>
        </div>
        <div className="privacy-policy-support-buttons">
          <button type="button" className="support-btn support-btn--primary">
            <FaEnvelope /> Email Support
          </button>
          <button type="button" className="support-btn support-btn--secondary">
            <FaPhone /> Call
          </button>
          <button type="button" className="support-btn support-btn--tertiary">
            <FaCommentDots /> Live Chat
          </button>
        </div>
      </section>
    </section>
  );
};

export default PrivacyPolicy;
