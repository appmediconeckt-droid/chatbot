import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leanding.css';
import logo from '../assets/humaeli.png';
import { API_BASE_URL } from '../axiosConfig';
import { Link } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, useSiteTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from '../Component/common/LanguageSelector';
import { translationService } from '../i18n/translationService';

const GUEST_CHAT_LIMIT_MS = 5 * 60 * 1000;

const containsNativeScript = (text) => /[^\u0000-\u024f\u2000-\u206f]/u.test(text);

const translateTypedMessage = async (text, targetLanguage) => {
  const targetBaseLanguage = String(targetLanguage || 'en-US').split('-')[0].toLowerCase();

  // Never alter text written with a language keyboard (Devanagari, Tamil,
  // Arabic, Chinese, etc.). English-typed text is translated to the selected
  // language, matching the behaviour used in the app's chat experience.
  if (targetBaseLanguage === 'en' || containsNativeScript(text)) return text;

  const translated = await translationService.translate(text, targetLanguage);
  return translated || text;
};

const Leanding = () => {
  const { t, lang, setLang } = useSiteTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(lang);
  const [guestChatStartedAt, setGuestChatStartedAt] = useState(null);
  const [guestChatExpired, setGuestChatExpired] = useState(false);
  // Echo this back to the backend so guest turns thread into one session
  // instead of every message looking like a brand-new first turn.
  const [aiSessionId, setAiSessionId] = useState(null);
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedLanguage(lang);
  }, [lang]);

  // The UI cutoff is paired with API enforcement, so guests cannot extend
  // the five-minute preview by changing client-side state.
  useEffect(() => {
    if (!chatOpen || !guestChatStartedAt || guestChatExpired) return undefined;
    const remaining = GUEST_CHAT_LIMIT_MS - (Date.now() - guestChatStartedAt);
    if (remaining <= 0) {
      setGuestChatExpired(true);
      return undefined;
    }
    const timeout = window.setTimeout(() => setGuestChatExpired(true), remaining);
    return () => window.clearTimeout(timeout);
  }, [chatOpen, guestChatStartedAt, guestChatExpired]);

  // Let the API create the opening reply. This makes the first message follow
  // the selected language too, instead of showing a fixed Hinglish greeting.
  useEffect(() => {
    if (!chatOpen || chatMessages.length > 0 || isLoading || guestChatExpired) return;

    const startChat = async () => {
      setIsLoading(true);
      try {
        const response = await sendMessageToAPI('hello');
        if (response?.success && response?.data) {
          if (response.data.sessionId) setAiSessionId(response.data.sessionId);
          setChatMessages([{
            id: Date.now(),
            text: response.data.aiResponse || response.data.message,
            sender: 'ai',
            quickReplies: response.data.quickReplies || null,
          }]);
        }
      } catch (error) {
        console.error('Error starting guest chat:', error);
        setChatMessages([{
          id: Date.now(),
          text: t('landing_chat_fallback_greeting'),
          sender: 'ai',
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    void startChat();
    // sendMessageToAPI is recreated on render; the state guards above make
    // this effect safe and avoid restarting an existing conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, chatMessages.length, isLoading, guestChatExpired, selectedLanguage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  // Handle viewport height for mobile
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Send message to API
  const sendMessageToAPI = async (message) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-chat/send-message`,
        {
          message: message,
          history: [], // Guest: server threads via sessionId, history is fallback
          sessionId: aiSessionId,
          language: selectedLanguage,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Shared send pipeline: handles both typed input and mood quick-reply taps.
  // Strips quickReplies off prior AI messages so old buttons can't fire twice.
  const sendChat = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || guestChatExpired) return;
    setIsLoading(true);
    let outgoingText = trimmed;
    try {
      outgoingText = await translateTypedMessage(trimmed, selectedLanguage);
    } catch (error) {
      console.warn('Outgoing message translation failed:', error);
    }
    const userMessage = { id: Date.now(), text: outgoingText, sender: 'user' };
    setChatMessages(prev => [
      ...prev.map(m => (m.sender === 'ai' && m.quickReplies ? { ...m, quickReplies: null } : m)),
      userMessage,
    ]);

    try {
      const response = await sendMessageToAPI(outgoingText);

      let aiResponseText = t('landing_chat_fallback_reply');
      let quickReplies = null;

      if (response && response.success && response.data) {
        aiResponseText = response.data.aiResponse || response.data.message || response.data.text;
        if (response.data.sessionId) {
          setAiSessionId(response.data.sessionId);
        }
        if (Array.isArray(response.data.quickReplies)) {
          quickReplies = response.data.quickReplies;
        }
      } else if (response && response.response) {
        aiResponseText = response.response;
      } else if (response && response.message) {
        aiResponseText = response.message;
      } else if (response && response.text) {
        aiResponseText = response.text;
      } else if (response && response.data) {
        aiResponseText = response.data;
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
        quickReplies,
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      if (error.response?.data?.code === 'GUEST_CHAT_LIMIT_REACHED') {
        setGuestChatExpired(true);
        return;
      }
      let errorMessageText = t('landing_chat_error_connection');

      if (error.response) {
        console.error('Server Error:', error.response.data);
        errorMessageText = t('landing_chat_error_server');
      } else if (error.request) {
        console.error('No response:', error.request);
        errorMessageText = t('landing_chat_error_network');
      } else {
        console.error('Error:', error.message);
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorMessageText,
        sender: 'ai',
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    await sendChat(text);
  };

  const sendQuickReply = async (text) => {
    if (isLoading) return;
    await sendChat(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openGuestChat = () => {
    if (!guestChatStartedAt) setGuestChatStartedAt(Date.now());
    setChatOpen(true);
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    setSelectedLanguage(nextLanguage);
    setLang(nextLanguage);
  };

  return (
    <div className="mediconeckt">
      <Header onLoginClick={() => navigate('/role-selector')} />
      <main>
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DoctorsSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
      
      {/* Chat Popup */}
      {chatOpen && (
        <ChatPopup
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isLoading={isLoading}
          onClose={() => setChatOpen(false)}
          chatBodyRef={chatBodyRef}
          sendQuickReply={sendQuickReply}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          guestChatExpired={guestChatExpired}
        />
      )}
      
      {/* Chat Button */}
      {!chatOpen && <ChatButton onClick={openGuestChat} />}
    </div>
  );
};

// ========== HEADER COMPONENT ==========
const Header = ({ onLoginClick }) => {
  const { t, lang, setLang } = useSiteTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '#services', label: t('landing_nav_services') },
    { href: '#how-it-works', label: t('landing_nav_how_it_works') },
    { href: '#features', label: t('landing_nav_features') },
    { href: '#doctors', label: t('landing_nav_doctors') },
    { href: '#testimonials', label: t('landing_nav_testimonials') }
  ];

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('landing_toggle_menu')}
            aria-expanded={menuOpen}
            aria-controls="landing-navigation"
          >
            <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`}></i>
          </button>
          <img src={logo} alt="Humaeli Logo" />
        </div>

        <nav
          id="landing-navigation"
          className={`nav-menu ${menuOpen ? 'active' : ''}`}
        >
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="header-language">
            <LanguageSelector lang={lang} setLang={setLang} t={t} compact />
          </div>
          <button type="button" className="btn btn-secondary" onClick={onLoginClick}>
            {t('landing_sign_in')}
          </button>
        </div>
      </div>
    </header>
  );
};

// ========== HERO SECTION ==========
const HeroSection = () => {
  const { t } = useSiteTranslation();

  return (
    <section className="section hero" id="home">
      <div className="container">
        <div className="hero-content">
          <span className="hero-badge">
            <i className="fas fa-shield-heart"></i>
            {t('landing_hero_badge')}
          </span>
          <h1 className="hero-title">
            {t('landing_hero_title')} <span className="text-highlight">{t('landing_hero_title_highlight')}</span>
          </h1>
          <p className="hero-description">
            {t('landing_hero_description')}
          </p>
          <div className="hero-actions">
            <Link to="/role-selector" className="btn btn-primary">
              {t('landing_get_started')}
              <i className="btn-icon fas fa-arrow-right"></i>
            </Link>
            <button className="btn btn-outline btn-large">
              <i className="btn-icon fas fa-play"></i>
              {t('landing_watch_demo')}
            </button>
          </div>
          <div className="hero-stats">
            <StatItem number="50,000+" label={t('landing_stat_patients_label')} />
            <StatItem number="500+" label={t('landing_stat_partners_label')} />
            <StatItem number="24/7" label={t('landing_stat_support_label')} />
            <StatItem number="98%" label={t('landing_stat_satisfaction_label')} />
          </div>
        </div>
        <div className="hero-visual">
          <div className="chat-preview">
            <div className="chat-preview-header">
              <div className="chat-preview-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="chat-preview-info">
                <div className="chat-preview-name">{t('landing_chat_preview_name')}</div>
                <div className="chat-preview-status">{t('landing_chat_preview_status')}</div>
              </div>
            </div>
            <div className="chat-preview-messages">
              <div className="chat-message chat-message-ai">
                {t('landing_chat_preview_msg1')}
              </div>
              <div className="chat-message chat-message-user">
                {t('landing_chat_preview_msg2')}
              </div>
              <div className="chat-message chat-message-ai">
                {t('landing_chat_preview_msg3')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ number, label }) => (
  <div className="stat-item">
    <div className="stat-number">{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ========== SERVICES SECTION ==========
const ServicesSection = () => {
  const { t } = useSiteTranslation();
  const icons = ["comments", "user-md", "chart-line", "mobile-alt", "users", "file-medical-alt"];

  return (
    <section className="section services" id="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_services_title')}</h2>
          <p className="section-description">
            {t('landing_services_description')}
          </p>
        </div>
        <div className="services-grid">
          {icons.map((icon, index) => (
            <div className="service-card" key={icon}>
              <div className="service-icon">
                <i className={`fas fa-${icon}`}></i>
              </div>
              <h3 className="service-title">{t(`landing_service_${index + 1}_title`)}</h3>
              <p className="service-description">{t(`landing_service_${index + 1}_description`)}</p>
              <button className="service-learn-more">
                {t('landing_learn_more')} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== HOW IT WORKS SECTION ==========
const HowItWorksSection = () => {
  const { t } = useSiteTranslation();
  const icons = ["user-plus", "robot", "chart-bar", "handshake"];

  return (
    <section className="section how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_how_title')}</h2>
          <p className="section-description">
            {t('landing_how_description')}
          </p>
        </div>
        <div className="steps-container">
          {icons.map((icon, index) => (
            <div className="step" key={icon}>
              <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="step-icon">
                <i className={`fas fa-${icon}`}></i>
              </div>
              <h3 className="step-title">{t(`landing_step_${index + 1}_title`)}</h3>
              <p className="step-description">{t(`landing_step_${index + 1}_description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== FEATURES SECTION ==========
const FeaturesSection = () => {
  const { t } = useSiteTranslation();
  const icons = ["shield-alt", "handshake", "file-medical", "clock", "brain", "mobile-alt"];

  return (
    <section className="section features" id="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_features_title')}</h2>
          <p className="section-description">
            {t('landing_features_description')}
          </p>
        </div>
        <div className="features-grid">
          {icons.map((icon, index) => (
            <div className="feature-card" key={`${icon}-${index}`}>
              <div className="feature-icon">
                <i className={`fas fa-${icon}`}></i>
              </div>
              <h3 className="feature-title">{t(`landing_feature_${index + 1}_title`)}</h3>
              <p className="feature-description">{t(`landing_feature_${index + 1}_description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== DOCTORS SECTION ==========
const DoctorsSection = () => {
  const { t } = useSiteTranslation();
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [doctorLoadError, setDoctorLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/counsellors`);
        const counselorList = response.data?.counsellors || response.data?.counselors || [];

        if (isMounted) {
          setDoctors(counselorList);
          setDoctorLoadError(false);
        }
      } catch (error) {
        console.error('Unable to load doctors for landing page:', error);
        if (isMounted) {
          setDoctors([]);
          setDoctorLoadError(true);
        }
      } finally {
        if (isMounted) setIsLoadingDoctors(false);
      }
    };

    void loadDoctors();
    return () => { isMounted = false; };
  }, []);

  const asList = (value) => Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
      ? [value.trim()]
      : [];

  const getPhotoUrl = (profilePhoto) => typeof profilePhoto === 'string'
    ? profilePhoto
    : profilePhoto?.url || null;

  const getInitials = (name) => String(name || 'Doctor')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <section className="section doctors" id="doctors">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_doctors_title')}</h2>
          <p className="section-description">
            {t('landing_doctors_description')}
          </p>
        </div>
        <div className="doctors-grid">
          {isLoadingDoctors && <p className="landing-doctors-state">{t('landing_doctors_loading')}</p>}
          {doctorLoadError && <p className="landing-doctors-state">{t('landing_doctors_error')}</p>}
          {!isLoadingDoctors && !doctorLoadError && doctors.map((doctor) => {
            const name = doctor.fullName || doctor.name || t('landing_doctor_default_name');
            const specializations = asList(doctor.specialization);
            const languages = asList(doctor.languages);
            const photoUrl = getPhotoUrl(doctor.profilePhoto);
            const consultationModes = asList(doctor.consultationMode);
            const experience = Number(doctor.experience) || 0;
            return (
            <div className="doctor-card" key={doctor._id || doctor.id}>
              <div className="doctor-header">
                <div className="doctor-image">
                  {photoUrl ? <img src={photoUrl} alt={name} /> : getInitials(name)}
                </div>
                <div>
                  <h3 className="doctor-name">{name}</h3>
                  <p className="doctor-specialization">{specializations[0] || doctor.qualification || t('landing_doctor_default_role')}</p>
                  <div className="doctor-rating">
                    <i className="fas fa-star"></i>
                    <span>{Number(doctor.rating || 0).toFixed(1)}</span>
                    <span className="doctor-patients">({doctor.totalSessions || 0} {t('landing_doctor_sessions')})</span>
                  </div>
                </div>
              </div>
              <div className="doctor-details">
                <div className="doctor-detail">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{doctor.qualification || t('landing_doctor_default_qualification')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-briefcase"></i>
                  <span>{experience} {t('landing_doctor_years_experience')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-hospital"></i>
                  <span>{consultationModes.join(', ') || t('landing_doctor_online_consultation')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{doctor.location || t('landing_doctor_location_default')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-clock"></i>
                  <span>{doctor.isOnline ? t('landing_doctor_available_now') : t('landing_doctor_view_availability')}</span>
                </div>
                <div className="doctor-languages">
                  {languages.slice(0, 5).map((lang, idx) => (
                    <span key={idx} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>
              <div className="doctor-actions">
                <Link to="/role-selector" className="btn btn-outline">
                  <i className="fas fa-calendar"></i> {t('landing_book_appointment')}
                </Link>
                <Link to="/role-selector" className="btn btn-primary">
                  <i className="fas fa-video"></i> {t('landing_consult_online')}
                </Link>
              </div>
            </div>
          );
          })}
          {!isLoadingDoctors && !doctorLoadError && doctors.length === 0 && (
            <p className="landing-doctors-state">{t('landing_doctors_empty')}</p>
          )}
        </div>
      </div>
    </section>
  );
};

// ========== TESTIMONIALS SECTION ==========
const TestimonialsSection = () => {
  const { t } = useSiteTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const TESTIMONIAL_COUNT = 4;
  const n = activeIndex + 1;

  return (
    <section className="section testimonials" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_testimonials_title')}</h2>
          <p className="section-description">
            {t('landing_testimonials_description')}
          </p>
        </div>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <i className="quote-icon fas fa-quote-left"></i>
            <p className="testimonial-text">{t(`landing_testimonial_${n}_quote`)}</p>
            <div className="testimonial-author">
              <div className="author-name">{t(`landing_testimonial_${n}_author`)}</div>
              <div className="author-role">{t(`landing_testimonial_${n}_role`)} • {t(`landing_testimonial_${n}_location`)}</div>
            </div>
            <div className="testimonial-rating">
              {[...Array(5)].map((_, i) => (
                <i key={i} className="fas fa-star filled"></i>
              ))}
            </div>
          </div>
          <div className="testimonial-dots">
            {[...Array(TESTIMONIAL_COUNT)].map((_, index) => (
              <button
                key={index}
                className={`dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`${t('landing_testimonial_view')} ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ========== FAQ SECTION ==========
const FAQSection = () => {
  const { t } = useSiteTranslation();
  const [openIndex, setOpenIndex] = useState(null);
  const FAQ_COUNT = 6;

  return (
    <section className="section faq" id="faq">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_faq_title')}</h2>
          <p className="section-description">
            {t('landing_faq_description')}
          </p>
        </div>
        <div className="faq-container">
          {[...Array(FAQ_COUNT)].map((_, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span>{t(`landing_faq_${index + 1}_question`)}</span>
                <i className={`fas fa-${openIndex === index ? 'minus' : 'plus'}`}></i>
              </button>
              <div className={`faq-answer ${openIndex === index ? 'active' : ''}`}>
                <p>{t(`landing_faq_${index + 1}_answer`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== FOOTER ==========
const Footer = () => {
  const { t } = useSiteTranslation();

  return (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-about">
          <div className="footer-logo">
            <img src={logo} alt="Humaeli Logo" />
          </div>
          <p className="footer-description">
            {t('landing_footer_description')}
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>{t('landing_footer_services_heading')}</h4>
            <a href="#features">{t('landing_footer_link_ai_support')}</a>
            <a href="#pricing">{t('landing_footer_link_pricing')}</a>
            <a href="#doctors">{t('landing_footer_link_doctors')}</a>
            <a href="#testimonials">{t('landing_footer_link_stories')}</a>
          </div>
          <div className="footer-column">
            <h4>{t('landing_footer_company_heading')}</h4>
            <a href="#">{t('landing_footer_link_about')}</a>
            <a href="#">{t('landing_footer_link_careers')}</a>
            <a href="#">{t('landing_footer_link_press')}</a>
            <a href="#">{t('landing_footer_link_hospital_partners')}</a>
          </div>
          <div className="footer-column">
            <h4>{t('landing_footer_resources_heading')}</h4>
            <a href="#">{t('landing_footer_link_blog')}</a>
            <a href="#">{t('landing_footer_link_help')}</a>
            <a href="#">{t('landing_footer_link_forum')}</a>
            <a href="#">{t('landing_footer_link_research')}</a>
          </div>
          <div className="footer-column">
            <h4>{t('landing_footer_contact_heading')}</h4>
            <a href="#">{t('landing_footer_link_support')}</a>
            <a href="#">{t('landing_footer_link_partner')}</a>
            <a href="#">{t('landing_footer_link_become_doctor')}</a>
            <a href="#">{t('landing_footer_link_corporate')}</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} {t('landing_footer_rights')}</p>
          <p className="emergency-notice">
            <i className="fas fa-exclamation-triangle"></i>
            <strong>{t('landing_footer_crisis_label')}</strong> {t('landing_footer_crisis_text')}
            <a href="tel:9152987821" style={{color: '#fff', marginLeft: '5px'}}> 9152987821</a> {t('landing_footer_toll_free')}
          </p>
          <p className="emergency-notice">
            <i className="fas fa-map-marker-alt"></i>
            <strong>{t('landing_footer_office_label')}</strong> {t('landing_footer_office_address')}
          </p>
        </div>
        <div className="footer-legal">
          <a href="#">{t('landing_footer_legal_privacy')}</a>
          <a href="#">{t('landing_footer_legal_terms')}</a>
          <a href="#">{t('landing_footer_legal_disclaimer')}</a>
          <a href="#">{t('landing_footer_legal_grievance')}</a>
        </div>
      </div>
    </div>
  </footer>
  );
};

// ========== CHAT POPUP COMPONENT ==========
const ChatPopup = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
  onClose,
  chatBodyRef,
  sendQuickReply,
  selectedLanguage,
  onLanguageChange,
  guestChatExpired,
}) => {
  const { t } = useSiteTranslation();
  const [speakingId, setSpeakingId] = useState(null);
  const [ttsLoadingId, setTtsLoadingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('landing_chat_voice_unsupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setNewMessage(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const speakMessage = async (messageId, text) => {
    if (speakingId === messageId) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }

    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setTtsLoadingId(messageId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-chat/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: selectedLanguage }),
      });
      if (!response.ok) throw new Error('TTS service unavailable');

      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      setSpeakingId(messageId);
      await audio.play();
      audio.onended = audio.onerror = () => {
        setSpeakingId(null);
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      // Browser speech is a reliable fallback when the server voice is
      // temporarily unavailable, and uses the language selected in the chat.
      if (window.speechSynthesis) {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = selectedLanguage || 'en-IN';
        speech.rate = 0.9;
        speech.onstart = () => setSpeakingId(messageId);
        speech.onend = speech.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(speech);
      }
    } finally {
      setTtsLoadingId(null);
    }
  };

  return (
  <div className="chat-popup">
    <div className="chat-popup-content">
      <div className="chat-popup-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3>{t('landing_chat_title')}</h3>
            <p className="chat-status">
              <span className="status-dot"></span>
              {t('landing_chat_available')}
            </p>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose} aria-label={t('landing_chat_close')}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="chat-popup-body" ref={chatBodyRef}>
        {messages.map(message => (
          <div key={message.id} className={`chat-message-wrapper ${message.sender}`}>
            {message.sender === 'ai' && (
              <div className="chat-avatar small">
                <i className="fas fa-robot"></i>
              </div>
            )}
            <div className="chat-bubble">
              {message.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              {message.sender === 'ai' && (
                <button
                  type="button"
                  className={`guest-chat-tts-btn ${speakingId === message.id ? 'guest-chat-tts-btn--playing' : ''}`}
                  onClick={() => speakMessage(message.id, message.text)}
                  disabled={ttsLoadingId === message.id}
                  title={speakingId === message.id ? t('landing_chat_stop_title') : t('landing_chat_listen_title')}
                  aria-label={speakingId === message.id ? t('landing_chat_stop_title') : t('landing_chat_listen_title')}
                >
                  <i className={`fas ${ttsLoadingId === message.id ? 'fa-spinner fa-spin' : speakingId === message.id ? 'fa-stop' : 'fa-volume-up'}`} />
                  <span>{speakingId === message.id ? t('landing_chat_stop') : t('landing_chat_listen')}</span>
                </button>
              )}
              {message.sender === 'ai' &&
                Array.isArray(message.quickReplies) &&
                message.quickReplies.length > 0 && (
                  <div className="chat-quick-replies">
                    {message.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        className="chat-quick-reply-btn"
                        disabled={isLoading || guestChatExpired}
                        onClick={() => sendQuickReply && sendQuickReply(qr)}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            {message.sender === 'user' && (
              <div className="chat-avatar small">
                <i className="fas fa-user"></i>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-message-wrapper ai">
            <div className="chat-avatar small">
              <i className="fas fa-robot"></i>
            </div>
            <div className="chat-bubble">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {guestChatExpired && (
          <div className="guest-chat-limit-card" role="status">
            <strong>{t('landing_chat_expired_title')}</strong>
            <span>{t('landing_chat_expired_text')}</span>
            <Link className="guest-chat-signup-btn" to="/user-signup">
              {t('landing_chat_expired_cta')}
            </Link>
          </div>
        )}
      </div>

      <div className="chat-popup-input">
        <select
          className="guest-chat-language-select"
          value={selectedLanguage}
          onChange={onLanguageChange}
          disabled={isLoading || guestChatExpired}
          aria-label={t('landing_chat_select_language')}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>{language.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={isRecording ? t('landing_chat_listening') : t('landing_chat_placeholder')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || guestChatExpired || isRecording}
          aria-label={t('landing_chat_input_label')}
        />
        <button
          type="button"
          className={`guest-chat-mic-btn ${isRecording ? 'guest-chat-mic-btn--recording' : ''}`}
          onClick={toggleRecording}
          disabled={isLoading || guestChatExpired}
          title={isRecording ? t('landing_chat_mic_stop') : t('landing_chat_mic_start')}
          aria-label={isRecording ? t('landing_chat_mic_stop') : t('landing_chat_mic_start')}
        >
          <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`} />
        </button>
        <button
          className="btn btn-primary send-btn"
          onClick={sendMessage}
          disabled={isLoading || guestChatExpired || !newMessage.trim()}
          aria-label={t('landing_chat_send')}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
  );
};

// ========== CHAT BUTTON COMPONENT ==========
const ChatButton = ({ onClick }) => {
  const { t } = useSiteTranslation();

  return (
  <button className="chat-button" onClick={onClick} aria-label={t('landing_chat_open')}>
    <span className="landing-chat-logo" aria-hidden="true">
      <span className="landing-chat-ring">
        <span className="landing-chat-bubble bubble-back" />
        <span className="landing-chat-bubble bubble-left" />
        <span className="landing-chat-bubble bubble-front" />
        <span className="landing-chat-bubble bubble-accent" />
      </span>
    </span>
    <span className="pulse-indicator"></span>
  </button>
  );
};

export default Leanding;
