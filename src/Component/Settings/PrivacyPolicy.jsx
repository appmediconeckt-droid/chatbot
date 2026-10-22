import { isProfessionalRole } from "../../authtication/authSession.js";
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
import { useCounselorTranslation, useUserTranslation } from "../../i18n/LanguageContext";

const SUPPORT_EMAIL = "support@humaeli.com";
const SUPPORT_PHONE = "9152987821";

const PrivacyPolicy = ({ variant = "dashboard", role = "user", aiOnly = false }) => {
  const isPublic = variant === "public";
  const isCounselor = role === "counselor" || isProfessionalRole(role);
  const userTranslation = useUserTranslation();
  const counselorTranslation = useCounselorTranslation();
  const { t } = isCounselor ? counselorTranslation : userTranslation;
  const [openSection, setOpenSection] = useState(null);

  const [consentNotice, setConsentNotice] = useState("");

  const sections = [
    {
      icon: <FaShieldAlt />,
      title: "AI Privacy & Data Sharing",
      content: (
        <div className="privacy-ai-sharing">
          <p><strong>AI Provider:</strong> OpenAI</p>
          <p><strong>Current Consent:</strong> Status unavailable</p>
          <p className="privacy-ai-note">Contact support to check or change your AI data sharing consent.</p>
          <div className="privacy-ai-actions">
            <button type="button" onClick={() => setConsentNotice("Consent status cannot currently be retrieved in this app. Please contact support@humaeli.com to confirm your status.")}>Refresh consent status</button>
            <a href="#privacy-ai-processing" onClick={() => setOpenSection(1)}>View Privacy Policy</a>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Withdraw%20AI%20Consent&body=I%20would%20like%20to%20withdraw%20my%20consent%20for%20AI%20data%20sharing.%20Please%20confirm%20when%20this%20request%20has%20been%20processed.`}>Withdraw AI Consent</a>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Chat%20or%20Account%20Data%20Deletion%20Request&body=I%20would%20like%20to%20request%20deletion%20of%20my%20chat%20or%20account%20data.%20Please%20help%20me%20verify%20my%20account%20and%20confirm%20the%20scope%20of%20deletion.`}>Request chat / account data deletion</a>
          </div>
          <p className="privacy-ai-note">Consent withdrawal and deletion links open an email request to Humaeli support. Changes take effect after your request is processed.</p>
          {consentNotice && <p role="status" className="privacy-ai-note">{consentNotice}</p>}
        </div>
      ),
    },
    {
      id: "privacy-ai-processing",
      icon: <FaComments />,
      title: "AI Assistant and OpenAI Data Processing",
      content: (
        <div className="privacy-ai-processing-copy">
          <h3>Information Shared with OpenAI</h3>
          <p>Your AI messages, up to 20 prior conversation messages, language, mood and safety context, anonymous handle, age, gender, city/location, surroundings and company may be sent through Humaeli?s backend to OpenAI. Counselor directory details may be included to suggest support. Messages may contain personal or mental-wellness information you choose to share.</p>
          <h3>Voice and photo features</h3>
          <p>AI voice calls send microphone audio directly to OpenAI after Humaeli creates the connection. OpenAI transcribes the audio and generates spoken replies. Voice sessions also include your account role and the profile and counselor context described above. Device speech recognition may process dictated text using Apple or Google services. AI photo avatars send your selected photo or avatar, appearance analysis (when enabled) and customization choices to OpenAI. Text selected for AI speech is sent to OpenAI.</p>
          <h3>Third-Party Provider</h3>
          <p>Provider: OpenAI. Purpose: AI response generation and processing of the text, audio and images you submit for AI features.</p>
          <h3>Data Privacy</h3>
          <p>Humaeli stores AI chat history in its backend database until you delete it; no automatic expiry is configured. Use AI Chat?s Fresh Chat control to clear saved AI history, or contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> for deletion requests. Consent records contain timestamps and policy versions, not chat text. OpenAI API data is not used for training by default unless the API customer opts in. OpenAI may retain abuse-monitoring data for up to 30 days, with legal/safety exceptions and endpoint-specific handling. Uploaded images may be retained for safety review when flagged. This is not zero retention.</p>
          <h3>Your choice</h3>
          <p>Declining does not prevent use of unrelated Humaeli features. Withdraw consent in Privacy ? AI Privacy &amp; Data Sharing to stop future AI processing and end active AI calls. Withdrawal does not automatically erase data already processed. Read the Privacy Policy for collection, sharing, retention and deletion details.</p>
        </div>
      ),
    },
    {
      icon: <FaServer />,
      title: t("privacy.sections.informationCollect"),
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
      title: t("privacy.sections.howWeUse"),
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
      title: t("privacy.sections.dataStorage"),
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
      title: t("privacy.sections.retentionDeletion"),
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
      title: t("privacy.sections.informationSharing"),
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
      title: t("security"),
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
      title: t("privacy.sections.choicesRights"),
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
      title: t("privacy.sections.childrenPrivacy"),
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
      title: t("privacy.sections.policyChanges"),
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
      title: t("privacy.sections.contactAssistance"),
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
    <section className={`privacy-policy privacy-policy--${variant}${aiOnly ? " privacy-policy--ai-only" : ""}`}>
      {!aiOnly && (isPublic ? (
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
                <h1>{t("privacy.securityTitle")}</h1>
                <p>{t("privacy.securityDescription")}</p>
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
              <h3>{t("privacy.responsibleCollection")}</h3>
              <p>{t("privacy.responsibleCollectionDescription")}</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaComments />
              </i>
              <h3>{t("privacy.privateConversations")}</h3>
              <p>{t("privacy.privateConversationsDescription")}</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaCreditCard />
              </i>
              <h3>{t("privacy.protectedPayments")}</h3>
              <p>{t("privacy.protectedPaymentsDescription")}</p>
            </article>

            <article className="privacy-feature-card">
              <i className="privacy-feature-icon">
                <FaBriefcase />
              </i>
              <h3>{t("privacy.professionalPrivacy")}</h3>
              <p>{t("privacy.professionalPrivacyDescription")}</p>
            </article>
          </div>
        </>
      ))}

      <div className="privacy-policy-content">
        {(aiOnly ? sections.slice(0, 2) : sections).map((section, index) => (
          <details
            key={section.title}
            id={section.id}
            className="privacy-policy-expandable"
            open={openSection === index}
          >
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenSection((current) => current === index ? null : index);
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

      {!isPublic && !aiOnly && (
        <section className="privacy-policy-support">
          <div className="privacy-policy-support-content">
            <h2>{t("privacy.needAssistance")}</h2>
            <p>{t("privacy.assistanceDescription")}</p>
          </div>
          <div className="privacy-policy-support-buttons">
            <button
              type="button"
              className="support-btn support-btn--primary"
              onClick={() => {
                window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Privacy%20Support`;
              }}
            >
              <FaEnvelope /> {t("privacy.emailSupport")}
            </button>
            <button
              type="button"
              className="support-btn support-btn--secondary"
              onClick={() => {
                window.location.href = "tel:9152987821";
              }}
            >
              <FaPhone /> {t("privacy.callSupport")}
            </button>
          </div>
        </section>
      )}

      {isPublic && !aiOnly && (
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
