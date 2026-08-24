import React, { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaCommentDots,
  FaChevronDown,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaShieldAlt,
  FaLock,
  FaQuestionCircle,
  FaBug,
  FaBook,
  FaHeadset,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import "./HelpSupport.css";
import { useCounselorTranslation, useUserTranslation } from "../../i18n/LanguageContext";

const HelpSupport = ({ role = "user" }) => {
  const userTranslation = useUserTranslation();
  const counselorTranslation = useCounselorTranslation();
  const { t } = role === "counselor" || role === "counsellor" ? counselorTranslation : userTranslation;
  const [expandedSections, setExpandedSections] = useState({
    appointments: true,
    earnings: true,
    account: false,
    security: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const ExpandableSection = ({ icon, title, sectionKey, children }) => (
    <details
      className="help-support-expandable"
      open={expandedSections[sectionKey]}
      onToggle={() => toggleSection(sectionKey)}
    >
      <summary>
        <span className="help-support-expandable-header">
          <i>{icon}</i>
          {title}
        </span>
        <FaChevronDown />
      </summary>
      <div className="help-support-expandable-content">{children}</div>
    </details>
  );

  return (
    <section className="help-support">
      <header className="help-support-header">
        <div className="help-support-header-badge">
          <FaHeadset />
          <div>
            <h1>{t("help_support")}</h1>
            <p>
              Find answers, contact support, or explore helpful resources for your counselling practice.
            </p>
          </div>
        </div>
        {/* <div className="help-support-header-meta">
          <span className="help-support-updated">
            <FaCheckCircle /> We're here to help 
          </span>
        </div> */}
      </header>

      <div className="help-support-features">
        <article className="help-support-feature-card">
          <i className="help-support-feature-icon">
            <FaCalendarAlt />
          </i>
          <h3>{t("support.appointmentIssues")}</h3>
          <p>Reschedule, Cancel, Conflicts & Availability Management</p>
        </article>

        <article className="help-support-feature-card">
          <i className="help-support-feature-icon">
            <FaMoneyBillWave />
          </i>
          <h3>{t("support.earningsPayments")}</h3>
          <p>Wallet, Payout Status, Transactions & Commission Details</p>
        </article>

        <article className="help-support-feature-card">
          <i className="help-support-feature-icon">
            <FaShieldAlt />
          </i>
          <h3>{t("support.accountVerification")}</h3>
          <p>Update Profile, Upload Documents, Credentials</p>
        </article>

        <article className="help-support-feature-card">
          <i className="help-support-feature-icon">
            <FaLock />
          </i>
          <h3>{t("support.securityPassword")}</h3>
          <p>Login Issues, Password Reset, Two-Factor Authentication</p>
        </article>
      </div>

      <div className="help-support-content">
        <ExpandableSection
          icon={<FaCalendarAlt />}
          title={t("support.appointmentIssues")}
          sectionKey="appointments"
        >
          <p>
            Having trouble with your appointments? We can help with scheduling,
            rescheduling, and managing availability.
          </p>
          <h4>Common Questions:</h4>
          <ul>
            <li>
              <strong>How do I reschedule an appointment?</strong> Navigate to
              your calendar, select the appointment, and click reschedule to
              choose a new time.
            </li>
            <li>
              <strong>Can I cancel a scheduled appointment?</strong> Yes, you can
              cancel up to 24 hours before the scheduled time. Cancellations
              made within 24 hours may affect your rating.
            </li>
            <li>
              <strong>How do I manage my availability?</strong> Go to Settings →
              Account → Set your preferred working hours for each day of the
              week.
            </li>
            <li>
              <strong>What happens if a patient cancels?</strong> You'll receive
              a notification and the slot becomes available for other patients
              to book.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaMoneyBillWave />}
          title={t("support.earningsPayments")}
          sectionKey="earnings"
        >
          <p>
            Manage your earnings, payouts, and financial transactions securely.
          </p>
          <h4>Frequently Asked Questions:</h4>
          <ul>
            <li>
              <strong>When do I receive my payments?</strong> Payouts are
              processed weekly on Fridays. Minimum payout amount is $25. Funds
              are transferred to your linked bank account.
            </li>
            <li>
              <strong>How can I check my earnings?</strong> Visit Settings →
              Payout Account to see your earning summary, transaction history,
              and upcoming payouts.
            </li>
            <li>
              <strong>What are the commission rates?</strong> Commission rates
              vary based on your subscription tier. Standard tier: 15%, Premium
              tier: 10%, Elite tier: 5%.
            </li>
            <li>
              <strong>Can I withdraw before the scheduled payout date?</strong>{" "}
              Premium and Elite members can request early payouts (fees apply).
              Contact support for details.
            </li>
            <li>
              <strong>Why is my payout pending?</strong> Payouts may be pending
              due to bank processing time, payment verification, or compliance
              reviews. Contact support if delayed beyond 5 business days.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaShieldAlt />}
          title={t("support.accountVerification")}
          sectionKey="account"
        >
          <p>
            Keep your profile complete and verified to build trust with patients.
          </p>
          <h4>Profile & Verification Help:</h4>
          <ul>
            <li>
              <strong>How do I update my profile?</strong> Click Edit Profile in
              Settings. You can update your bio, specializations, fees, and
              availability.
            </li>
            <li>
              <strong>What documents do I need to upload?</strong> Medical
              license, degree certificate, DEA number (if applicable), and
              identity proof.
            </li>
            <li>
              <strong>Why is my verification pending?</strong> Our compliance
              team reviews all documents. This typically takes 2-3 business days.
              You'll get an email when approved.
            </li>
            <li>
              <strong>My verification was rejected. What now?</strong> Check your
              email for rejection details. Resubmit corrected documents or
              contact support for guidance.
            </li>
            <li>
              <strong>Can I update my specializations?</strong> Yes, go to
              Settings → Account and update your specializations. Changes take
              effect immediately.
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={<FaLock />}
          title={t("support.securityPassword")}
          sectionKey="security"
        >
          <p>
            Protect your account with strong security practices and proper authentication.
          </p>
          <h4>Security Tips & Help:</h4>
          <ul>
            <li>
              <strong>I forgot my password. How do I reset it?</strong> On the
              login page, click "Forgot Password?" and follow the instructions
              sent to your email.
            </li>
            <li>
              <strong>How do I set up Two-Factor Authentication?</strong> Go to
              Settings → Security → Enable Two-Factor Authentication. You'll
              receive a code via SMS or email for each login.
            </li>
            <li>
              <strong>My account seems compromised. What should I do?</strong>{" "}
              Immediately change your password, enable 2FA, and contact our
              security team.
            </li>
            <li>
              <strong>Can I use the same password across platforms?</strong> No,
              always use unique, strong passwords for each platform. Use a
              password manager for security.
            </li>
            <li>
              <strong>What should I do if I receive a suspicious email?</strong>{" "}
              Don't click links or provide information. Forward it to
              support@humaeli.com.
            </li>
          </ul>
        </ExpandableSection>
      </div>

      <section className="help-support-contact">
        <div className="help-support-contact-content">
          <div className="help-support-contact-main">
            <h2>{t("support.stillNeedHelp")}</h2>
            <p>
              Can't find the answer you're looking for? Our dedicated support
              team is available to assist you with any issues or questions.
            </p>
            <div className="help-support-contact-info">
              <div className="help-support-contact-item">
                <i className="help-support-contact-icon">
                  <FaPhone />
                </i>
                <div>
                  <h4>{t("support.callSupport")}</h4>
                  <p>Response time: 2-5 min</p>
                </div>
              </div>
              <div className="help-support-contact-item">
                <i className="help-support-contact-icon">
                  <FaCommentDots />
                </i>
                <div>
                  <h4>{t("support.liveChat")}</h4>
                  <p>Response time: 2-5 min</p>
                </div>
              </div>
              <div className="help-support-contact-item">
                <i className="help-support-contact-icon">
                  <FaEnvelope />
                </i>
                <div>
                  <h4>{t("support.emailSupport")}</h4>
                  <p>Available anytime • Response time: Within 24 hrs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-support-contact-emergency">
            <h3>
              <FaExclamationTriangle /> {t("crisis_resources")}
            </h3>
            <p>
              If a patient is in crisis or experiencing a mental health emergency,
              please direct them to appropriate crisis resources:
            </p>
            <ul>
              <li>National Suicide Prevention Lifeline: 988 (US)</li>
              <li>Crisis Text Line: Text HOME to 741741</li>
              <li>International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/</li>
            </ul>
            <button
              type="button"
              className="help-support-crisis-btn"
              onClick={() => {
                window.location.href = "tel:112";
              }}
              title="Call India's emergency response number 112"
            >
              <FaPhone /> {t("support.reportCrisis")}
            </button>
          </div>
        </div>

        <div className="help-support-action-buttons">
          <button type="button" className="support-action-btn support-action-btn--primary">
            <FaPhone /> {t("support.callSupport")}
          </button>
          <button
            type="button"
            className="support-action-btn support-action-btn--tertiary"
            onClick={() => {
              window.location.href = "mailto:support@humaeli.com?subject=Support%20Request";
            }}
          >
            <FaEnvelope /> {t("support.emailSupport")}
          </button>
        </div>
      </section>
    </section>
  );
};

export default HelpSupport;
