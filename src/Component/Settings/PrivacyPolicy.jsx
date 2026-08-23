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
  FaServer,
  FaDatabase,
  FaUserClock,
  FaUserFriends,
  FaChild,
} from "react-icons/fa";
import "./PrivacyPolicy.css";

const SUPPORT_EMAIL = "support@humaeli.com";
const SUPPORT_PHONE = "9152987821";

const PrivacyPolicy = ({ variant = "dashboard" }) => {
  const isPublic = variant === "public";
  const [openSection, setOpenSection] = useState(isPublic ? null : 0);

  const sections = [
    {
      icon: <FaServer />,
      title: "Information We Collect",
      content: (
        <>
          <p>
            Humaeli collects only the information needed to create accounts,
            provide mental wellness and counselling services, keep sessions
            secure, and support users and counsellors.
          </p>
          <ul>
            <li>
              <strong>Account details:</strong> name, email, phone number,
              role, login activity, OTP verification status, and profile
              information you choose to provide.
            </li>
            <li>
              <strong>Care and communication data:</strong> chat messages,
              AI support conversations, counsellor requests, appointments,
              call history, ratings, feedback, and support messages.
            </li>
            <li>
              <strong>Technical and safety data:</strong> device information,
              browser type, IP address, approximate location when enabled,
              security logs, and usage events needed to protect your account.
            </li>
            <li>
              <strong>Payment information:</strong> wallet balance,
              transactions, payouts, invoices, and billing identifiers. Full
              card or bank details may be processed by trusted payment
              providers instead of being stored directly by Humaeli.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaEye />,
      title: "How We Use Information",
      content: (
        <>
          <p>
            We use information to operate Humaeli, connect users with
            counsellors, support AI wellness conversations, process bookings and
            payments, improve safety, and respond to support or privacy
            requests.
          </p>
          <ul>
            <li>Authenticate users and prevent unauthorized account access.</li>
            <li>Enable chat, voice/video calls, appointment booking, wallet, and support features.</li>
            <li>Personalize language, notifications, care context, and platform experience.</li>
            <li>Monitor abuse, fraud, technical issues, and service reliability.</li>
            <li>Meet legal, compliance, tax, accounting, and dispute-resolution obligations.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaCloud />,
      title: "Data Storage",
      content: (
        <>
          <p>
            Information is stored using secure application databases, hosting
            infrastructure, and service providers selected to support reliable
            delivery of Humaeli services.
          </p>
          <ul>
            <li>Access to production data is restricted to authorized personnel and systems.</li>
            <li>Sensitive data is protected with administrative, technical, and organizational safeguards.</li>
            <li>Backups may be maintained for business continuity and disaster recovery.</li>
            <li>Some service providers may process data in regions outside your country, subject to applicable safeguards.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaUserClock />,
      title: "Data Retention and Deletion",
      content: (
        <>
          <p>
            We keep information only as long as needed for the purposes
            described in this policy, unless a longer period is required for
            legal, safety, accounting, dispute, or service-continuity reasons.
          </p>
          <ul>
            <li>You may request deletion or correction of eligible personal information.</li>
            <li>Deleted data may remain in encrypted backups for a limited period before automatic removal.</li>
            <li>Records tied to payments, safety incidents, counselling obligations, or legal requirements may be retained where required.</li>
            <li>Account closure may limit access to your chats, appointments, reports, and wallet history.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaUserFriends />,
      title: "Information Sharing",
      content: (
        <>
          <p>
            We do not sell personal information. We share information only when
            needed to provide the service, comply with law, protect users, or
            complete a request you make.
          </p>
          <ul>
            <li>With counsellors or users where necessary to deliver booked sessions and conversations.</li>
            <li>With payment, communication, cloud, analytics, security, and support providers working on our behalf.</li>
            <li>With authorities, regulators, courts, or emergency responders if legally required or needed to prevent harm.</li>
            <li>During a business transfer such as merger, acquisition, financing, or restructuring, subject to privacy protections.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaLock />,
      title: "Security",
      content: (
        <>
          <p>
            Humaeli uses security controls designed to protect accounts,
            conversations, payments, and professional information from
            unauthorized access, misuse, alteration, or loss.
          </p>
          <ul>
            <li>OTP-based authentication, session controls, and protected routes.</li>
            <li>Encryption in transit and appropriate encryption or access controls for stored data.</li>
            <li>Role-based access for user and counsellor workflows.</li>
            <li>Monitoring, logging, and response processes for suspicious or unsafe activity.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaCheckCircle />,
      title: "User Privacy Choices / Rights",
      content: (
        <>
          <p>
            Depending on your location and applicable law, you may have rights
            to access, correct, export, restrict, object to, or delete personal
            information held by Humaeli.
          </p>
          <ul>
            <li>Update profile, language, notification, and account settings in the app where available.</li>
            <li>Request a copy of your personal information or ask us to correct inaccurate details.</li>
            <li>Opt out of non-essential communications where supported.</li>
            <li>Contact support for deletion, privacy, consent, or grievance requests.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaChild />,
      title: "Children's Privacy",
      content: (
        <>
          <p>
            Humaeli is not intended for children to use independently. If a
            minor uses Humaeli, a parent, guardian, or legally authorized adult
            must provide consent where required by law.
          </p>
          <ul>
            <li>We do not knowingly collect personal information from children without appropriate consent.</li>
            <li>If you believe a child provided information without consent, contact us so we can review and remove it where appropriate.</li>
            <li>Crisis, safety, or legal obligations may affect how certain records are handled.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaGavel />,
      title: "Changes to Privacy Policy",
      content: (
        <>
          <p>
            We may update this Privacy Policy as Humaeli changes, new features
            are released, or legal requirements evolve.
          </p>
          <ul>
            <li>The latest version will be posted on this page with an updated date.</li>
            <li>Material changes may be communicated through the app, website, or email where appropriate.</li>
            <li>Continued use of Humaeli after changes means the updated policy applies.</li>
          </ul>
        </>
      ),
    },
    {
      icon: <FaEnvelope />,
      title: "Contact / Privacy Assistance",
      content: (
        <>
          <p>
            For privacy questions, account data requests, legal requests, or
            grievance assistance, contact the Humaeli support team.
          </p>
          <ul>
            <li>
              Email: <a href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20Assistance`}>{SUPPORT_EMAIL}</a>
            </li>
            <li>Include the email or phone number linked to your account so we can verify and respond safely.</li>
            <li>For urgent mental health or safety emergencies, contact local emergency services immediately.</li>
          </ul>
        </>
      ),
    },
  ];

  const publicHighlights = [
    {
      icon: <FaCloud />,
      title: "Purpose-Limited Data",
      text: "We collect information needed to provide accounts, wellness conversations, appointments, support, payments, and app security.",
    },
    {
      icon: <FaComments />,
      title: "Chats & Appointments",
      text: "Chat, call, counsellor, and appointment details are used to deliver the services selected by the user.",
    },
    {
      icon: <FaCreditCard />,
      title: "Payments",
      text: "Payment and wallet information is used for bookings, billing, refunds, payouts, and transaction support.",
    },
    {
      icon: <FaBriefcase />,
      title: "Privacy Requests",
      text: "Users may request access, correction, export, or deletion of their account information through support.",
    },
  ];

  return (
    <section className={`privacy-policy privacy-policy--${variant}`}>
      {isPublic ? (
        <>
          <header className="privacy-policy-public-hero">
            <div className="privacy-policy-public-hero-icon">
              <FaShieldAlt />
            </div>
            <div>
              <h2>Privacy Policy</h2>
              <p>
                Learn how Humaeli Mental Wellness collects, uses, stores,
                shares, protects, retains, and deletes information for users
                and counsellors who use the app.
              </p>
              <span className="privacy-policy-public-updated">
                <FaCheckCircle /> Last Updated: 7 August 2026
              </span>
            </div>
          </header>

          <div className="privacy-policy-public-highlights">
            {publicHighlights.map((item) => (
              <article className="privacy-policy-public-card" key={item.title}>
                <i>{item.icon}</i>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <header className="privacy-policy-header">
            <div className="privacy-policy-header-badge">
              <FaShieldAlt />
              <div>
                <h1>Privacy & Security</h1>
                <p>
                  Learn how Humaeli protects your account information,
                  conversations, appointments, wallet activity, professional
                  records, and support requests.
                </p>
              </div>
            </div>
            <div className="privacy-policy-header-meta">
              <span className="privacy-policy-updated">
                <FaCheckCircle /> Last Updated: 08 August 2026
              </span>
            </div>
          </header>

          <div className="privacy-policy-features">
            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaDatabase />
              </i>
              <h3>Responsible Collection</h3>
              <p>We collect data needed to run accounts, care, support, and safety workflows.</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaComments />
              </i>
              <h3>Private Conversations</h3>
              <p>Chats, calls, and session records are handled with strong access controls.</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaCreditCard />
              </i>
              <h3>Protected Payments</h3>
              <p>Wallet, transaction, and payout data are used for billing and account records.</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaBriefcase />
              </i>
              <h3>Professional Privacy</h3>
              <p>Contact details and sensitive professional data are shared only when necessary.</p>
            </article>
          </div>
        </>
      )}

      <div className="privacy-policy-content">
        {sections.map((section, index) => (
          <details
            key={section.title}
            className="privacy-policy-expandable"
            open={openSection === index}
          >
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenSection(index);
              }}
            >
              <span className="privacy-policy-expandable-header">
                <i>{section.icon}</i>
                {section.title}
              </span>
              <FaChevronDown />
            </summary>
            <div className="privacy-policy-expandable-content">
              {section.content}
            </div>
          </details>
        ))}
      </div>

      {!isPublic && (
        <section className="privacy-policy-support">
          <div className="privacy-policy-support-content">
            <h2>Need Privacy Assistance?</h2>
            <p>
              Our support team can help with privacy questions, account data
              requests, corrections, deletion, or legal/grievance assistance.
            </p>
          </div>
          <div className="privacy-policy-support-buttons">
            <button
              type="button"
              className="support-btn support-btn--primary"
              onClick={() => {
                window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Privacy%20Support`;
              }}
            >
              <FaEnvelope /> Email Support
            </button>
            <button
              type="button"
              className="support-btn support-btn--secondary"
              onClick={() => {
                window.location.href = "tel:9152987821";
              }}
            >
              <FaPhone /> Call
            </button>
          </div>
        </section>
      )}

      {isPublic && (
        <section className="privacy-policy-public-support">
          <h2>Need Privacy Assistance?</h2>
          <p>
            Contact Humaeli Mental Wellness for privacy questions, data access,
            correction, export, deletion, or account deletion requests.
          </p>
          <div className="privacy-policy-public-support-actions">
            <a
              className="privacy-policy-public-action privacy-policy-public-action--primary"
              href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20Support`}
            >
              <FaEnvelope /> Email Support
            </a>
            <a
              className="privacy-policy-public-action"
              href={`tel:${SUPPORT_PHONE}`}
            >
              <FaPhone /> Call
            </a>
            <a
              className="privacy-policy-public-action privacy-policy-public-action--soft"
              href={`mailto:${SUPPORT_EMAIL}?subject=Privacy%20Request`}
            >
              <FaCommentDots /> Support Request
            </a>
          </div>
        </section>
      )}
    </section>
  );
};

export default PrivacyPolicy;
