import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leanding.css';
import './LandingChatTheme.css';
import './LandingNavbarFix.css';
import './LandingDoctorCarousel.css';
import './LandingTestimonialCarousel.css';
import logo from '../assets/humaeli.png';
import logos from '../assets/humaeli logo (2).png';
import wellnessHero from '../assets/landing-page-hero.png';
import whyChooseHumaeli from '../assets/why-choose-humaeli.png';
import faqWellnessIllustration from '../assets/faq-wellness-illustration.png';
import { API_BASE_URL } from '../axiosConfig';
import { Link } from 'react-router-dom';
import { useSiteTranslation } from '../i18n/LanguageContext';
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
  const { t, lang } = useSiteTranslation();
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

  return (
    <div className="humaeli">
      <Header onLoginClick={() => navigate('/role-selector')} />
      <main>
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <DoctorsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
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
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['home', 'services', 'how-it-works', 'doctors', 'testimonials'];
      const marker = window.scrollY + 160;
      let currentSection = 'home';

      sections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section && section.offsetTop <= marker) currentSection = sectionId;
      });

      setActiveSection(currentSection);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '#home', label: t('landing_nav_home'), icon: 'home' },
    { href: '#services', label: t('landing_nav_services') },
    { href: '#how-it-works', label: t('landing_nav_how_it_works') },
    { href: '#doctors', label: t('landing_nav_professionals') },
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
          <div className="landing-logo-brand">
            <img src={logos} alt="Humaeli Logo" />
            <span>Mental Wellness</span>
          </div>
        </div>

        <nav
          id="landing-navigation"
          className={`nav-menu ${menuOpen ? 'active' : ''}`}
        >
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${activeSection === item.href.slice(1) ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(item.href.slice(1));
                setMenuOpen(false);
              }}
              aria-current={activeSection === item.href.slice(1) ? 'page' : undefined}
            >
              {item.icon && <i className={`fas fa-${item.icon}`}></i>}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="header-language">
            <LanguageSelector
              lang={lang}
              setLang={setLang}
              t={t}
              compact
              triggerLabel="Choose Language"
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={onLoginClick}>
            <i className="far fa-user"></i> {t('landing_login')}
          </button>
        </div>
      </div>
    </header>
  );
};

// ========== HERO SECTION ==========
const HeroSection = () => {
  const { t } = useSiteTranslation();
  const [landingStats, setLandingStats] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadLandingStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/landing-stats`);
        if (isMounted && response.data?.success) {
          setLandingStats(response.data.data);
        }
      } catch (error) {
        console.error('Unable to load landing statistics:', error);
      }
    };

    loadLandingStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatCount = (value) => (
    Number.isFinite(Number(value))
      ? new Intl.NumberFormat().format(Number(value))
      : '—'
  );

  return (
    <section className="section hero" id="home">
      <div className="container">
        <div className="hero-content">
          <span className="hero-badge">
            {t('landing_ui_hero_badge')}
          </span>
          <h1 className="hero-title">
            {t('landing_ui_hero_title_1')}<br />{t('landing_ui_hero_title_2')}<br />{t('landing_ui_hero_title_3')}
          </h1>
          <p className="hero-description">
            {t('landing_ui_hero_description')}
          </p>
          <div className="hero-actions">
            <Link to="/role-selector" className="btn btn-primary">
              {t('landing_get_started')}
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img className="hero-wellness-image" src={wellnessHero} alt="" aria-hidden="true" />
          <div className="chat-preview">
            <div className="chat-preview-header">
              <div className="chat-preview-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="chat-preview-info">
                <div className="chat-preview-name">{t('landing_ui_ai_name')}</div>
                <div className="chat-preview-status">{t('landing_ui_ai_status')}</div>
              </div>
            </div>
            <div className="chat-preview-messages">
              <div className="chat-message chat-message-ai">
                {t('landing_ui_chat_message_1')}
              </div>
              <div className="chat-message chat-message-user">
                {t('landing_ui_chat_message_2')}
              </div>
              <div className="chat-message chat-message-ai">
                {t('landing_ui_chat_message_3')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-stats" aria-label="Humaeli impact statistics">
        <StatItem number={formatCount(landingStats?.patientsHelped)} label={t('landing_ui_stat_patients')} />
        <StatItem number={formatCount(landingStats?.medicalPartners)} label={t('landing_ui_stat_partners')} />
        <StatItem number="24/7" label={t('landing_ui_stat_supports')} />
        <StatItem
          number={landingStats ? `${landingStats.satisfactionRate}%` : '—'}
          label={t('landing_ui_stat_satisfied')}
        />
      </div>
    </section>
  );
};

const StatItem = ({ number, label }) => (
  <div className="stat-item">
    <div className="stat-label">{label}</div>
    <div className="stat-number">{number}</div>
  </div>
);

// ========== SERVICES SECTION ==========
const ServicesSection = () => {
  const { t } = useSiteTranslation();
  const services = [
    {
      icon: 'comments',
      title: t('landing_ui_service_1_title'),
      description: t('landing_ui_service_1_description'),
      action: t('landing_ui_service_1_action'),
    },
    {
      icon: 'headset',
      title: t('landing_ui_service_2_title'),
      description: t('landing_ui_service_2_description'),
      action: t('landing_ui_service_2_action'),
    },
    {
      icon: 'book-open',
      title: t('landing_ui_service_3_title'),
      description: t('landing_ui_service_3_description'),
      action: t('landing_ui_service_3_action'),
    },
    {
      icon: 'lock',
      title: t('landing_ui_service_4_title'),
      description: t('landing_ui_service_4_description'),
      action: t('landing_get_started'),
    },
  ];

  return (
    <section className="section services" id="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_ui_services_title')}</h2>
          <p className="section-description">
            {t('landing_ui_services_description')}
          </p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.title}>
              <div className="service-icon">
                <i className={`fas fa-${service.icon}`}></i>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <button className="service-learn-more">
                <Link to="/role-selector" >
                {service.action}
                </Link>
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
  const steps = [
    {
      id: 'login',
      icon: 'clipboard-user',
      title: t('landing_ui_step_1_title'),
      description: t('landing_ui_step_1_description'),
      action: t('landing_ui_step_1_action'),
    },
    {
      id: 'ai-chat',
      icon: 'robot',
      title: t('landing_ui_step_2_title'),
      description: t('landing_ui_step_2_description'),
      action: t('landing_ui_step_2_action'),
    },
    {
      id: 'experts',
      icon: 'hands-helping',
      title: t('landing_ui_step_3_title'),
      description: t('landing_ui_step_3_description'),
      action: t('landing_ui_step_3_action'),
    },
    {
      id: 'progress',
      icon: 'chart-line',
      title: t('landing_ui_step_4_title'),
      description: t('landing_ui_step_4_description'),
      action: t('landing_ui_step_4_action'),
    },
  ];

  return (
    <section className="section how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_ui_how_title')}</h2>
          <p className="section-description">
            {t('landing_ui_how_description')}
          </p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div className="step" key={step.id}>
              <div className="step-top">
                <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="step-icon">
                  <i className={`fas fa-${step.icon}`}></i>
                </div>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <Link to="/role-selector" className="step-action">
                {step.action} <i className="fas fa-arrow-right"></i>
              </Link>
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
  const features = [
    {
      icon: 'universal-access',
      title: t('landing_ui_feature_1_title'),
      description: t('landing_ui_feature_1_description'),
    },
    {
      icon: 'question',
      title: t('landing_ui_feature_2_title'),
      description: t('landing_ui_feature_2_description'),
    },
    {
      icon: 'comment-alt',
      title: t('landing_ui_feature_3_title'),
      description: t('landing_ui_feature_3_description'),
    },
    {
      icon: 'wave-square',
      title: t('landing_ui_feature_4_title'),
      description: t('landing_ui_feature_4_description'),
    },
  ];

  return (
    <section className="section features" id="features">
      <div className="container">
        <div className="features-showcase">
          <div className="features-image-wrap">
            <img
              src={whyChooseHumaeli}
              alt="A counsellor having a comfortable conversation with a client"
            />
          </div>
          <div className="features-content">
            <div className="section-header">
              <h2 className="section-title">{t('landing_ui_features_title')}</h2>
              <p className="section-description">
                {t('landing_ui_features_description')}
              </p>
            </div>
            <div className="features-grid">
              {features.map((feature) => (
                <div className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <i className={`fas fa-${feature.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/role-selector" className="btn btn-primary features-cta">
              {t('landing_ui_features_action')}
            </Link>
          </div>
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
  const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);
  const [isDoctorCarouselPaused, setIsDoctorCarouselPaused] = useState(false);

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

  const rankedDoctors = [...doctors]
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 8);

  useEffect(() => {
    if (rankedDoctors.length < 2 || isDoctorCarouselPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveDoctorIndex((current) => (current + 1) % rankedDoctors.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [rankedDoctors.length, isDoctorCarouselPaused]);

  useEffect(() => {
    if (activeDoctorIndex >= rankedDoctors.length) setActiveDoctorIndex(0);
  }, [activeDoctorIndex, rankedDoctors.length]);

  const displayedDoctors = rankedDoctors.length > 2
    ? [
        rankedDoctors[(activeDoctorIndex - 1 + rankedDoctors.length) % rankedDoctors.length],
        rankedDoctors[activeDoctorIndex],
        rankedDoctors[(activeDoctorIndex + 1) % rankedDoctors.length],
      ]
    : rankedDoctors;

  return (
    <section className="section doctors" id="doctors">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('landing_ui_doctors_title')}</h2>
          <p className="section-description">
            {t('landing_ui_doctors_description')}
          </p>
        </div>
        <div
          className="doctors-carousel"
          onMouseEnter={() => setIsDoctorCarouselPaused(true)}
          onMouseLeave={() => setIsDoctorCarouselPaused(false)}
          onFocusCapture={() => setIsDoctorCarouselPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsDoctorCarouselPaused(false);
            }
          }}
          aria-roledescription="carousel"
          aria-label="Our professionals"
        >
        <div className="doctors-grid" key={`doctor-slide-${activeDoctorIndex}`} aria-live="polite">
          {isLoadingDoctors && <p className="landing-doctors-state">{t('landing_doctors_loading')}</p>}
          {doctorLoadError && <p className="landing-doctors-state">{t('landing_doctors_error')}</p>}
          {!isLoadingDoctors && !doctorLoadError && displayedDoctors.map((doctor, index) => {
            const name = doctor.fullName || doctor.name || t('landing_doctor_default_name');
            const specializations = asList(doctor.specialization);
            const photoUrl = getPhotoUrl(doctor.profilePhoto);
            const consultationModes = asList(doctor.consultationMode);
            const rating = Number(doctor.rating || 0);
            const description = doctor.bio || doctor.about ||
              `${doctor.qualification || t('landing_doctor_default_qualification')} with experience providing personalised mental wellness support.`;
            return (
            <div className={`doctor-card doctor-slide doctor-slide-${index}`} key={doctor._id || doctor.id}>
              {index === 1 && <span className="doctor-featured-badge">{t('landing_ui_highly_rated')}</span>}
              <div className="doctor-header">
                <div className="doctor-image">
                  {photoUrl ? <img src={photoUrl} alt={name} /> : getInitials(name)}
                </div>
                <div>
                  <h3 className="doctor-name">{name}</h3>
                  <p className="doctor-specialization">{specializations[0] || doctor.qualification || t('landing_doctor_default_role')}</p>
                  <div className="doctor-rating">
                    <span className="doctor-stars" aria-label={`${rating.toFixed(1)} rating`}>
                      {[0, 1, 2, 3, 4].map((star) => <i className="fas fa-star" key={star}></i>)}
                    </span>
                    <span>{rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="doctor-details">
                <div className="doctor-detail">
                  <i className="fas fa-head-side-virus"></i>
                  <span>{specializations[1] || specializations[0] || doctor.qualification || t('landing_doctor_default_role')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-globe"></i>
                  <span>{consultationModes.join(', ') || t('landing_doctor_online_consultation')}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{doctor.location || t('landing_doctor_location_default')}</span>
                </div>
              </div>
              <p className="doctor-bio">{description}</p>
              <div className="doctor-actions">
                <Link to="/role-selector" className="btn btn-primary doctor-book-button">
                  {t('landing_ui_book_consultation')}
                </Link>
                <Link to="/role-selector" className="doctor-profile-link">
                  {index === 1 ? t('landing_ui_view_full_profile') : t('landing_ui_view_profile')}
                </Link>
              </div>
            </div>
          );
          })}
          {!isLoadingDoctors && !doctorLoadError && doctors.length === 0 && (
            <p className="landing-doctors-state">{t('landing_doctors_empty')}</p>
          )}
        </div>
        {!isLoadingDoctors && !doctorLoadError && rankedDoctors.length > 1 && (
          <div className="doctor-carousel-dots" role="tablist" aria-label="Choose a professional">
            {rankedDoctors.map((doctor, index) => (
              <button
                key={doctor._id || doctor.id || index}
                type="button"
                className={`doctor-carousel-dot ${activeDoctorIndex === index ? "active" : ""}`}
                onClick={() => setActiveDoctorIndex(index)}
                aria-label={`Show professional ${index + 1}`}
                aria-selected={activeDoctorIndex === index}
                role="tab"
              />
            ))}
          </div>
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
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const testimonials = [
    {
      quote: t('landing_ui_testimonial_quote'),
      author: t('landing_ui_testimonial_author'),
      role: t('landing_ui_testimonial_role'),
    },
    ...[2, 3, 4].map((n) => ({
      quote: t(`landing_testimonial_${n}_quote`),
      author: t(`landing_testimonial_${n}_author`),
      role: `${t(`landing_testimonial_${n}_role`)} • ${t(`landing_testimonial_${n}_location`)}`,
    })),
  ];
  const testimonial = testimonials[activeIndex];
  const TESTIMONIAL_COUNT = testimonials.length;
  const n = activeIndex + 1;

  useEffect(() => {
    if (isTestimonialPaused || TESTIMONIAL_COUNT < 2) return undefined;

    const autoplayTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % TESTIMONIAL_COUNT);
    }, 5000);

    return () => window.clearInterval(autoplayTimer);
  }, [isTestimonialPaused, TESTIMONIAL_COUNT]);

  return (
    <section className="section testimonials" id="testimonials">
      <div
        className="testimonial-stage"
        onMouseEnter={() => setIsTestimonialPaused(true)}
        onMouseLeave={() => setIsTestimonialPaused(false)}
        onFocusCapture={() => setIsTestimonialPaused(true)}
        onBlurCapture={() => setIsTestimonialPaused(false)}
        aria-roledescription="carousel"
        aria-label="Client testimonials"
      >
        <span className="testimonial-label">{t('landing_ui_testimonial_label')}</span>
        <div className="testimonial-slide" key={activeIndex} aria-live="polite">
          <blockquote className="testimonial-display-text">"{testimonial.quote}"</blockquote>
          <div className="testimonial-footer">
          <div className="testimonial-display-author">
            <img src={whyChooseHumaeli} alt="" className="testimonial-avatar" />
            <div>
              <div className="author-name">{testimonial.author}</div>
              <div className="author-role">{testimonial.role}</div>
            </div>
          </div>
          </div>
        </div>
        <div className="testimonial-stage-dots" role="tablist" aria-label="Choose testimonial">
          {testimonials.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`testimonial-stage-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`${t('landing_testimonial_view')} ${index + 1}`}
              aria-selected={index === activeIndex}
              role="tab"
            />
          ))}
        </div>
      </div>
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
  const faqs = [1, 2, 3, 4, 5, 6].map((number) => ({
    question: t(`landing_ui_faq_${number}_question`),
    answer: t(`landing_ui_faq_${number}_answer`),
  }));

  return (
    <section className="section faq" id="faq">
      <div className="container">
        <div className="faq-intro">
          <span className="faq-kicker">{t('landing_ui_faq_kicker')}</span>
          <h2 className="section-title">{t('landing_faq_title')}</h2>
          <p className="section-description">
            {t('landing_ui_faq_description')}
          </p>
          <img
            src={faqWellnessIllustration}
            alt="A cheerful green wellness character with growing leaves"
            className="faq-illustration"
          />
        </div>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <i className={`fas fa-${openIndex === index ? 'minus' : 'plus'}`}></i>
              </button>
              <div className={`faq-answer ${openIndex === index ? 'active' : ''}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const { t } = useSiteTranslation();
  return (
    <section className="section landing-cta">
      <div className="container">
        <div className="landing-cta-card">
          <div className="landing-cta-content">
            <h2>{t('landing_ui_cta_title')}</h2>
            <Link to="/role-selector" className="btn landing-cta-button">
              {t('landing_ui_cta_action')}
            </Link>
          </div>
          <div className="landing-cta-decoration" aria-hidden="true">
            <span className="cta-rainbow"></span>
            <span className="cta-flower cta-flower-large"></span>
            <span className="cta-flower cta-flower-small"></span>
            <span className="cta-flower cta-flower-gold"></span>
            <span className="cta-star cta-star-large">✱</span>
            <span className="cta-star cta-star-small">✦</span>
          </div>
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
            <i className="fas fa-seedling"></i>
            <span>Humaeli</span>
          </div>
          <p className="footer-description">
            {t('landing_footer_description')}
          </p>
          <div className="social-links">
            <a href="#" aria-label="Website"><i className="fas fa-globe"></i></a>
            <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="Work"><i className="fas fa-briefcase"></i></a>
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
            <a href="tel:9152987821"> 9152987821</a> {t('landing_footer_toll_free')}
          </p>
          <p className="emergency-notice">
            <i className="fas fa-map-marker-alt"></i>
            <strong>{t('landing_footer_office_label')}</strong> {t('landing_footer_office_address')}
          </p>
        </div>
        <div className="footer-legal">
          <Link to="/privacy-policy">{t('landing_footer_legal_privacy')}</Link>
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
