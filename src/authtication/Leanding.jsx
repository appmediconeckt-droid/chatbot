import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leanding.css';
import logo from '../image/Mediconect Logo-3.png';

const Leanding = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      text: "Namaste! I'm your AI assistant. Main aapki kaise madad kar sakta hoon? (How can I help you today?)", 
      sender: 'ai' 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();

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
        'https://sdpd86vs-5000.inc1.devtunnels.ms/api/chat',
        {
          message: message
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

  // Send message handler
  const sendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = { 
        id: Date.now(), 
        text: newMessage, 
        sender: 'user' 
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);

      try {
        const response = await sendMessageToAPI(newMessage);
        
        // Extract AI response from the API response structure
        let aiResponseText = "I understand. Could you tell me more about how you're feeling?";
        
        if (response && response.success && response.data) {
          // New API response structure
          aiResponseText = response.data.aiResponse || response.data.message || response.data.text;
        } else if (response && response.response) {
          // Alternative response structure
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
          sender: 'ai'
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
        
      } catch (error) {
        // Handle error - show error message to user
        let errorMessageText = "I'm having trouble connecting. Please try again or call our crisis helpline at 9152987821 if you need immediate support.";
        
        if (error.response) {
          // Server responded with error
          console.error('Server Error:', error.response.data);
          errorMessageText = "Server is busy. Please try again in a moment.";
        } else if (error.request) {
          // Request made but no response
          console.error('No response:', error.request);
          errorMessageText = "Network issue. Please check your internet connection.";
        } else {
          // Something else happened
          console.error('Error:', error.message);
        }
        
        const errorMessage = {
          id: Date.now() + 1,
          text: errorMessageText,
          sender: 'ai'
        };
        
        setChatMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        />
      )}
      
      {/* Chat Button */}
      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} />}
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
          <button className="btn btn-primary btn-large">
            Start Free Trial
            <i className="btn-icon fas fa-arrow-right"></i>
          </button>
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
  const doctors = [
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
          {doctors.map(doctor => (
            <div className="doctor-card" key={doctor.id}>
              <div className="doctor-header">
                <div className="doctor-image">{doctor.image}</div>
                <div>
                  <h3 className="doctor-name">{doctor.name}</h3>
                  <p className="doctor-specialization">{doctor.specialization}</p>
                  <div className="doctor-rating">
                    <i className="fas fa-star"></i>
                    <span>{doctor.rating}</span>
                    <span className="doctor-patients">({doctor.patients} patients)</span>
                  </div>
                </div>
              </div>
              <div className="doctor-details">
                <div className="doctor-detail">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{doctor.education}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-briefcase"></i>
                  <span>{doctor.experience} experience</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-hospital"></i>
                  <span>{doctor.hospital}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{doctor.location}</span>
                </div>
                <div className="doctor-detail">
                  <i className="fas fa-clock"></i>
                  <span>{doctor.availability}</span>
                </div>
                <div className="doctor-languages">
                  {doctor.languages.map((lang, idx) => (
                    <span key={idx} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>
              <div className="doctor-actions">
                <button className="btn btn-outline">
                  <i className="fas fa-calendar"></i> Book Appointment
                </button>
                <button className="btn btn-primary">
                  <i className="fas fa-video"></i> Consult Online
                </button>
              </div>
            </div>
          ))}
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
  chatBodyRef 
}) => (
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
      </div>

      <div className="chat-popup-input">
        <input
          type="text"
          placeholder="Type your message in English or Hindi..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button 
          className="btn btn-primary send-btn"
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
          aria-label="Send message"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
);

// ========== CHAT BUTTON COMPONENT ==========
const ChatButton = ({ onClick }) => (
  <button className="chat-button" onClick={onClick} aria-label="Open chat">
    <i className="fas fa-comment-medical"></i>
    <span className="pulse-indicator"></span>
  </button>
);

export default Leanding;