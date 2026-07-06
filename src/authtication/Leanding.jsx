import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leanding.css';
import logo from '../image/Mediconect Logo-3.png';
import { API_BASE_URL } from '../axiosConfig';
import { Link } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, useUserTranslation } from '../i18n/LanguageContext';
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
  const { lang, setLang } = useUserTranslation();
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
          text: 'Hello! How can I help you today?',
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

      let aiResponseText = "I understand. Could you tell me more about how you're feeling?";
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
      let errorMessageText = "I'm having trouble connecting. Please try again or call our crisis helpline at 9152987821 if you need immediate support.";

      if (error.response) {
        console.error('Server Error:', error.response.data);
        errorMessageText = 'Server is busy. Please try again in a moment.';
      } else if (error.request) {
        console.error('No response:', error.request);
        errorMessageText = 'Network issue. Please check your internet connection.';
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
    { href: '#services', label: 'Services' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#features', label: 'Features' },
    { href: '#doctors', label: 'Our Doctors' },
    { href: '#testimonials', label: 'Testimonials' }
  ];

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`}></i>
          </button>
          <img src={logo} height={30} alt="MediConeckt Logo" />
          <span className="logo-text">Medi<span className="logo-highlight">Coneckt</span></span>
        </div>

        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
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
          <button className="btn btn-secondary" onClick={onLoginClick}>
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

// ========== HERO SECTION ==========
const HeroSection = () => (
  <section className="section hero" id="home">
    <div className="container">
      <div className="hero-content">
        <h1 className="hero-title">
          Human Empower <span className="text-highlight">Mental Health</span> 
        </h1>
        <p className="hero-description">
          Connect with top Indian psychiatrists and therapists. Get 24/7 AI support in Hindi, English, and regional languages. Emergency crisis support across all major Indian cities.
        </p>
        <div className="hero-actions">
          <Link to="/role-selector" className="btn btn-primary">
            Get Started
            <i className="btn-icon fas fa-arrow-right"></i>
          </Link>
          <button className="btn btn-outline btn-large">
            <i className="btn-icon fas fa-play"></i>
            Watch Demo
          </button>
        </div>
        <div className="hero-stats">
          <StatItem number="50,000+" label="Indian Patients Helped" />
          <StatItem number="500+" label="Indian Medical Partners" />
          <StatItem number="24/7" label="Support in 8 Languages" />
          <StatItem number="98%" label="Patient Satisfaction" />
        </div>
      </div>
      <div className="hero-visual">
        <div className="chat-preview">
          <div className="chat-preview-header">
            <div className="chat-preview-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="chat-preview-info">
              <div className="chat-preview-name">MediConeckt Assistant</div>
              <div className="chat-preview-status">Online • Hindi/English Support</div>
            </div>
          </div>
          <div className="chat-preview-messages">
            <div className="chat-message chat-message-ai">
              Namaste! I'm here to listen. How are you feeling today?
            </div>
            <div className="chat-message chat-message-user">
              I've been feeling really anxious about my job interview.
            </div>
            <div className="chat-message chat-message-ai">
              I understand interview anxiety. Would you like to try some breathing exercises?
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const StatItem = ({ number, label }) => (
  <div className="stat-item">
    <div className="stat-number">{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ========== SERVICES SECTION ==========
const ServicesSection = () => {
  const services = [
    {
      icon: "comments",
      title: "24/7 AI Chat Support",
      description: "Round-the-clock empathetic AI conversations in English, Hindi, Tamil, Telugu, Bengali, and Marathi with real-time mood analysis."
    },
    {
      icon: "user-md",
      title: "Top Indian Psychiatrists",
      description: "Connect with India's best mental health professionals from AIIMS, NIMHANS, and top medical institutions across the country."
    },
    {
      icon: "chart-line",
      title: "Mood Tracking",
      description: "Advanced mood tracking with insights tailored to Indian lifestyle, work culture, and family dynamics."
    },
    {
      icon: "mobile-alt",
      title: "Crisis Support",
      description: "Immediate crisis intervention with connections to local helplines in Delhi, Mumbai, Bangalore, Chennai, Kolkata, and other cities."
    },
    {
      icon: "users",
      title: "Support Community",
      description: "Safe, moderated community spaces for Indians to share experiences and support each other."
    },
    {
      icon: "file-medical-alt",
      title: "Health Reports",
      description: "Comprehensive health reports compatible with Indian healthcare systems and insurance providers."
    }
  ];

  return (
    <section className="section services" id="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Services for India</h2>
          <p className="section-description">
            Comprehensive mental health solutions designed specifically for the Indian population.
          </p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div className="service-card" key={index}>
              <div className="service-icon">
                <i className={`fas fa-${service.icon}`}></i>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <button className="service-learn-more">
                Learn More <i className="fas fa-arrow-right"></i>
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
  const steps = [
    {
      number: "01",
      title: "Sign Up in Your Language",
      description: "Complete a confidential assessment in English, Hindi, or your preferred regional language.",
      icon: "user-plus"
    },
    {
      number: "02",
      title: "AI Companion",
      description: "Start conversations with our empathetic AI that understands Indian cultural contexts.",
      icon: "robot"
    },
    {
      number: "03",
      title: "Track Your Progress",
      description: "Use mood tracking to identify triggers related to Indian lifestyle and family pressures.",
      icon: "chart-bar"
    },
    {
      number: "04",
      title: "Expert Medical Help",
      description: "Get connected to licensed Indian professionals from top institutions when needed.",
      icon: "handshake"
    }
  ];

  return (
    <section className="section how-it-works" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works for You</h2>
          <p className="section-description">
            Simple 4-step process designed for the Indian healthcare ecosystem.
          </p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div className="step" key={index}>
              <div className="step-number">{step.number}</div>
              <div className="step-icon">
                <i className={`fas fa-${step.icon}`}></i>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== FEATURES SECTION ==========
const FeaturesSection = () => {
  const features = [
    {
      icon: "shield-alt",
      title: "Data Privacy",
      description: "Your data is protected with Indian data protection laws and enterprise-grade security."
    },
    {
      icon: "handshake",
      title: "Doctor Network",
      description: "Direct connections to psychiatrists and therapists from AIIMS, NIMHANS, PGI Chandigarh, and other top Indian institutions."
    },
    {
      icon: "file-medical",
      title: "Insurance Ready",
      description: "Progress reports and prescriptions accepted by all major Indian health insurance providers."
    },
    {
      icon: "clock",
      title: "24/7 Support",
      description: "Round-the-clock AI support in 8 Indian languages with emergency protocols for immediate assistance."
    },
    {
      icon: "brain",
      title: "Cultural Context",
      description: "AI algorithms trained on Indian emotional patterns, family dynamics, and social pressures."
    },
    {
      icon: "mobile-alt",
      title: "Works on Any Phone",
      description: "Optimized for all smartphones used in India, works on 2G/3G/4G networks across the country."
    }
  ];

  return (
    <section className="section features" id="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Indian-First Features</h2>
          <p className="section-description">
            Bridging AI support with professional Indian medical care for comprehensive mental wellness.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">
                <i className={`fas fa-${feature.icon}`}></i>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== DOCTORS SECTION ==========
const DoctorsSection = () => {
  const doctorExamples = [
    {
      id: 1,
      name: "Dr. Anjali Mehta",
      specialization: "Clinical Psychologist",
      experience: "15+ years",
      rating: 4.9,
      patients: "2,500+",
      education: "MBBS, MD Psychiatry - AIIMS Delhi",
      approach: "Cognitive Behavioral Therapy",
      image: "👩‍⚕️",
      availability: "Mon-Fri, 9AM-5PM",
      location: "Mumbai, Maharashtra",
      languages: ["English", "Hindi", "Marathi"],
      hospital: "Jaslok Hospital, Mumbai"
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      specialization: "Psychiatrist",
      experience: "12+ years",
      rating: 4.8,
      patients: "1,800+",
      education: "MBBS, MD Psychiatry - NIMHANS Bangalore",
      approach: "Medication Management & Therapy",
      image: "👨‍⚕️",
      availability: "Tue-Sat, 10AM-6PM",
      location: "Bangalore, Karnataka",
      languages: ["English", "Hindi", "Kannada"],
      hospital: "Manipal Hospital, Bangalore"
    },
    {
      id: 3,
      name: "Dr. Priya Sharma",
      specialization: "Child Psychologist",
      experience: "18+ years",
      rating: 4.9,
      patients: "3,000+",
      education: "PhD Clinical Psychology - Delhi University",
      approach: "Child & Adolescent Therapy",
      image: "👩‍⚕️",
      availability: "Mon-Thu, 8AM-4PM",
      location: "Delhi NCR",
      languages: ["English", "Hindi", "Punjabi"],
      hospital: "Fortis Hospital, Delhi"
    },
  ];

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
          <h2 className="section-title">India's Top Mental Health Experts</h2>
          <p className="section-description">
            Licensed professionals from premier Indian institutions dedicated to providing compassionate care.
          </p>
        </div>
        <div className="doctors-grid">
          {isLoadingDoctors && <p className="landing-doctors-state">Loading doctors...</p>}
          {doctorLoadError && <p className="landing-doctors-state">Doctors are unavailable right now. Please try again shortly.</p>}
          {!isLoadingDoctors && !doctorLoadError && doctors.map((doctor) => {
            const name = doctor.fullName || doctor.name || 'Mental Health Expert';
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
                  <p className="doctor-specialization">{specializations[0] || doctor.qualification || 'Counselor'}</p>
                  <div className="doctor-rating">
                    <i className="fas fa-star"></i>
                    <span>{Number(doctor.rating || 0).toFixed(1)}</span>
                    <span className="doctor-patients">({doctor.totalSessions || 0} sessions)</span>
                  </div>
                </div>
              </div>
              <div className="doctor-details">
                <div className="doctor-detail">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{doctor.qualification || 'Qualified mental health professional'}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-briefcase"></i>
                  <span>{experience} years experience</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-hospital"></i>
                  <span>{consultationModes.join(', ') || 'Online consultation available'}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{doctor.location || 'India'}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-clock"></i>
                  <span>{doctor.isOnline ? 'Available now' : 'View availability after sign in'}</span>
                </div>
                <div className="doctor-languages">
                  {languages.slice(0, 5).map((lang, idx) => (
                    <span key={idx} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>
              <div className="doctor-actions">
                <Link to="/role-selector" className="btn btn-outline">
                  <i className="fas fa-calendar"></i> Book Appointment
                </Link>
                <Link to="/role-selector" className="btn btn-primary">
                  <i className="fas fa-video"></i> Consult Online
                </Link>
              </div>
            </div>
          );
          })}
          {!isLoadingDoctors && !doctorLoadError && doctors.length === 0 && (
            <p className="landing-doctors-state">No doctors are available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

// ========== TESTIMONIALS SECTION ==========
const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonials = [
    {
      quote: "MediConeckt helped me through my depression during COVID lockdown in Mumbai. The AI understood my cultural context and connected me with an amazing therapist from AIIMS within 24 hours.",
      author: "Rahul Sharma",
      role: "Software Engineer, Mumbai",
      location: "Maharashtra",
      rating: 5
    },
    {
      quote: "As a psychiatrist practicing in Bangalore, I appreciate how MediConeckt bridges the gap between technology and Indian mental health care. Their referral system is seamless and culturally sensitive.",
      author: "Dr. Lakshmi Narayan",
      role: "Consultant Psychiatrist, NIMHANS",
      location: "Bangalore",
      rating: 5
    },
    {
      quote: "The mood tracking feature helped me identify patterns related to work pressure in IT industry. Combined with the AI support, it's been a game-changer for managing my anxiety.",
      author: "Priya Patel",
      role: "Tech Professional, Pune",
      location: "Maharashtra",
      rating: 5
    },
    {
      quote: "My teenage son was struggling with academic pressure. The child psychologist from Delhi and the AI support helped him tremendously. Thank you MediConeckt!",
      author: "Amit Singh",
      role: "Parent, Delhi NCR",
      location: "Delhi",
      rating: 5
    }
  ];

  return (
    <section className="section testimonials" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Stories from Across India</h2>
          <p className="section-description">
            Real stories from people across India who found support and healing through MediConeckt.
          </p>
        </div>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <i className="quote-icon fas fa-quote-left"></i>
            <p className="testimonial-text">{testimonials[activeIndex].quote}</p>
            <div className="testimonial-author">
              <div className="author-name">{testimonials[activeIndex].author}</div>
              <div className="author-role">{testimonials[activeIndex].role} • {testimonials[activeIndex].location}</div>
            </div>
            <div className="testimonial-rating">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < testimonials[activeIndex].rating ? 'filled' : ''}`}></i>
              ))}
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`View testimonial ${index + 1}`}
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
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    {
      question: "Is MediConeckt available in Indian languages?",
      answer: "Yes! We currently support English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and Kannada. More languages coming soon."
    },
    {
      question: "Are the doctors qualified in India?",
      answer: "All our doctors are licensed medical professionals in India, with degrees from top institutions like AIIMS, NIMHANS, CMC Vellore, and are registered with the Medical Council of India."
    },
    {
      question: "Is my data protected under Indian laws?",
      answer: "Absolutely! We comply with Indian data protection laws and IT Act 2000. Your conversations are confidential and encrypted."
    },
    {
      question: "Do you accept Indian health insurance?",
      answer: "Yes, we work with all major Indian insurance providers including ICICI Lombard, Star Health, New India Assurance, and others. We provide documentation for insurance claims."
    },
    {
      question: "Can I consult doctors from my city?",
      answer: "Yes, we have doctors available in all major Indian cities including Mumbai, Delhi, Bangalore, Chennai, Kolkata, Pune, Hyderabad, and Ahmedabad."
    },
    {
      question: "What about emergency support in India?",
      answer: "We have 24/7 crisis support with connections to local helplines. In case of emergency, we can connect you to immediate support in your city."
    }
  ];

  return (
    <section className="section faq" id="faq">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-description">
            Get answers to common questions about MediConeckt services in India.
          </p>
        </div>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
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

// ========== FOOTER ==========
const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-content">
        <div className="footer-about">
          <div className="footer-logo">
            <img src={logo} height={30} alt="MediConeckt Logo" />
            <span>Medi<span className="logo-highlight">Coneckt</span></span>
          </div>
          <p className="footer-description">
            India's most trusted AI-powered mental health platform with connections to top medical professionals across the country. Available 24/7 in multiple Indian languages.
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
            <h4>Our Services</h4>
            <a href="#features">AI Support in 8 Languages</a>
            <a href="#pricing">Affordable Plans (INR)</a>
            <a href="#doctors">Indian Doctors Network</a>
            <a href="#testimonials">Patient Stories</a>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers in India</a>
            <a href="#">Press (India)</a>
            <a href="#">Hospital Partners</a>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#">Mental Health Blog</a>
            <a href="#">Help Center</a>
            <a href="#">Community Forum</a>
            <a href="#">Research & Studies</a>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <a href="#">Support</a>
            <a href="#">Partner with Us</a>
            <a href="#">Become a Doctor</a>
            <a href="#">Corporate Wellness</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} MediConeckt India. All rights reserved.</p>
          <p className="emergency-notice">
            <i className="fas fa-exclamation-triangle"></i>
            <strong>24/7 Crisis Support:</strong> Call +91-9152987821 (India) or 
            <a href="tel:9152987821" style={{color: '#fff', marginLeft: '5px'}}> 9152987821</a> (Toll-Free)
          </p>
          <p className="emergency-notice">
            <i className="fas fa-map-marker-alt"></i>
            <strong>Corporate Office:</strong> Saket Nagar, Indore, Madhya Pradesh 452018, India
          </p>
        </div>
        <div className="footer-legal">
          <a href="#">Privacy Policy (India)</a>
          <a href="#">Terms of Service</a>
          <a href="#">Medical Disclaimer</a>
          <a href="#">Grievance Redressal</a>
        </div>
      </div>
    </div>
  </footer>
);

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
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
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
            <h3>MediConeckt AI Assistant</h3>
            <p className="chat-status">
              <span className="status-dot"></span>
              Available in English, हिन्दी, தமிழ், తెలుగు
            </p>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
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
                  title={speakingId === message.id ? 'Stop speaking' : 'Listen to response'}
                  aria-label={speakingId === message.id ? 'Stop speaking' : 'Listen to response'}
                >
                  <i className={`fas ${ttsLoadingId === message.id ? 'fa-spinner fa-spin' : speakingId === message.id ? 'fa-stop' : 'fa-volume-up'}`} />
                  <span>{speakingId === message.id ? 'Stop' : 'Listen'}</span>
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
            <strong>Your 5-minute free chat has ended.</strong>
            <span>Sign up to continue talking with the AI assistant.</span>
            <Link className="guest-chat-signup-btn" to="/user-signup">
              Sign up to continue
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
          aria-label="Select chat language"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>{language.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={isRecording ? 'Listening...' : 'Type your message...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || guestChatExpired || isRecording}
          aria-label="Chat message input"
        />
        <button
          type="button"
          className={`guest-chat-mic-btn ${isRecording ? 'guest-chat-mic-btn--recording' : ''}`}
          onClick={toggleRecording}
          disabled={isLoading || guestChatExpired}
          title={isRecording ? 'Stop listening' : 'Speak your message'}
          aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
        >
          <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`} />
        </button>
        <button 
          className="btn btn-primary send-btn"
          onClick={sendMessage}
          disabled={isLoading || guestChatExpired || !newMessage.trim()}
          aria-label="Send message"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
  );
};

// ========== CHAT BUTTON COMPONENT ==========
const ChatButton = ({ onClick }) => (
  <button className="chat-button" onClick={onClick} aria-label="Open chat">
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

export default Leanding;
