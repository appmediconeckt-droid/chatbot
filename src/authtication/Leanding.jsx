// Landing.js - Professional Navbar & Working Testimonial Carousel
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple Icon component using emoji
const Icon = ({ name, size, color, style }) => {
  const getIcon = () => {
    const icons = {
      'bars': '☰', 'times': '✕', 'arrow-right': '→', 'play': '▶',
      'comments': '💬', 'user-md': '👨‍⚕️', 'chart-line': '📈', 'mobile-alt': '📱',
      'users': '👥', 'file-medical-alt': '📋', 'user-plus': '👤', 'robot': '🤖',
      'chart-bar': '📊', 'handshake': '🤝', 'shield-alt': '🛡️', 'file-medical': '📄',
      'clock': '⏰', 'brain': '🧠', 'graduation-cap': '🎓', 'briefcase': '💼',
      'hospital': '🏥', 'map-marker-alt': '📍', 'calendar': '📅', 'video': '🎥',
      'star': '⭐', 'quote-left': '"', 'facebook-f': 'f', 'twitter': '🐦',
      'instagram': '📷', 'linkedin-in': 'in', 'exclamation-triangle': '⚠️',
      'paper-plane': '✈️', 'comment-medical': '💬', 'user': '👤', 'plus': '+',
      'minus': '−', 'chevron-up': '▲', 'chevron-down': '▼', 'home': '🏠',
      'info-circle': 'ℹ️', 'envelope': '✉️', 'phone': '📞'
    };
    return icons[name] || '●';
  };
  return <Text style={[{ fontSize: size || 20, color: color || '#000' }, style]}>{getIcon()}</Text>;
};

// All data
const SERVICES_DATA = [
  { icon: 'comments', title: '24/7 AI Chat Support', description: 'Round-the-clock empathetic AI conversations in English, Hindi, Tamil, Telugu, Bengali, and Marathi with real-time mood analysis.' },
  { icon: 'user-md', title: 'Top Indian Psychiatrists', description: "Connect with India's best mental health professionals from AIIMS, NIMHANS, and top medical institutions across the country." },
  { icon: 'chart-line', title: 'Mood Tracking', description: 'Advanced mood tracking with insights tailored to Indian lifestyle, work culture, and family dynamics.' },
  { icon: 'mobile-alt', title: 'Crisis Support', description: 'Immediate crisis intervention with connections to local helplines in Delhi, Mumbai, Bangalore, Chennai, Kolkata, and other cities.' },
  { icon: 'users', title: 'Support Community', description: 'Safe, moderated community spaces for Indians to share experiences and support each other.' },
  { icon: 'file-medical-alt', title: 'Health Reports', description: 'Comprehensive health reports compatible with Indian healthcare systems and insurance providers.' }
];

const STEPS_DATA = [
  { number: '01', title: 'Sign Up in Your Language', description: 'Complete a confidential assessment in English, Hindi, or your preferred regional language.', icon: 'user-plus' },
  { number: '02', title: 'AI Companion', description: 'Start conversations with our empathetic AI that understands Indian cultural contexts.', icon: 'robot' },
  { number: '03', title: 'Track Your Progress', description: 'Use mood tracking to identify triggers related to Indian lifestyle and family pressures.', icon: 'chart-bar' },
  { number: '04', title: 'Expert Medical Help', description: 'Get connected to licensed Indian professionals from top institutions when needed.', icon: 'handshake' }
];

const FEATURES_DATA = [
  { icon: 'shield-alt', title: 'Data Privacy', description: 'Your data is protected with Indian data protection laws and enterprise-grade security.' },
  { icon: 'handshake', title: 'Doctor Network', description: 'Direct connections to psychiatrists and therapists from AIIMS, NIMHANS, PGI Chandigarh, and other top Indian institutions.' },
  { icon: 'file-medical', title: 'Insurance Ready', description: 'Progress reports and prescriptions accepted by all major Indian health insurance providers.' },
  { icon: 'clock', title: '24/7 Support', description: 'Round-the-clock AI support in 8 Indian languages with emergency protocols for immediate assistance.' },
  { icon: 'brain', title: 'Cultural Context', description: 'AI algorithms trained on Indian emotional patterns, family dynamics, and social pressures.' },
  { icon: 'mobile-alt', title: 'Works on Any Phone', description: 'Optimized for all smartphones used in India, works on 2G/3G/4G networks across the country.' }
];

const DOCTORS_DATA = [
  { id: 1, name: 'Dr. Anjali Mehta', specialization: 'Clinical Psychologist', experience: '15+ years', rating: 4.9, patients: '2,500+', education: 'MBBS, MD Psychiatry - AIIMS Delhi', availability: 'Mon-Fri, 9AM-5PM', location: 'Mumbai, Maharashtra', languages: ['English', 'Hindi', 'Marathi'], hospital: 'Jaslok Hospital, Mumbai' },
  { id: 2, name: 'Dr. Rajesh Kumar', specialization: 'Psychiatrist', experience: '12+ years', rating: 4.8, patients: '1,800+', education: 'MBBS, MD Psychiatry - NIMHANS Bangalore', availability: 'Tue-Sat, 10AM-6PM', location: 'Bangalore, Karnataka', languages: ['English', 'Hindi', 'Kannada'], hospital: 'Manipal Hospital, Bangalore' },
  { id: 3, name: 'Dr. Priya Sharma', specialization: 'Child Psychologist', experience: '18+ years', rating: 4.9, patients: '3,000+', education: 'PhD Clinical Psychology - Delhi University', availability: 'Mon-Thu, 8AM-4PM', location: 'Delhi NCR', languages: ['English', 'Hindi', 'Punjabi'], hospital: 'Fortis Hospital, Delhi' }
];

const TESTIMONIALS_DATA = [
  { id: 1, quote: "MediConeckt helped me through my depression during COVID lockdown in Mumbai. The AI understood my cultural context and connected me with an amazing therapist from AIIMS within 24 hours.", author: "Rahul Sharma", role: "Software Engineer, Mumbai", rating: 5 },
  { id: 2, quote: "As a psychiatrist practicing in Bangalore, I appreciate how MediConeckt bridges the gap between technology and Indian mental health care. Their referral system is seamless and culturally sensitive.", author: "Dr. Lakshmi Narayan", role: "Consultant Psychiatrist, NIMHANS", rating: 5 },
  { id: 3, quote: "The mood tracking feature helped me identify patterns related to work pressure in IT industry. Combined with the AI support, it's been a game-changer for managing my anxiety.", author: "Priya Patel", role: "Tech Professional, Pune", rating: 5 },
  { id: 4, quote: "My teenage son was struggling with academic pressure. The child psychologist from Delhi and the AI support helped him tremendously. Thank you MediConeckt!", author: "Amit Singh", role: "Parent, Delhi NCR", rating: 5 }
];

const FAQS_DATA = [
  { q: 'Is MediConeckt available in Indian languages?', a: 'Yes! We currently support English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, and Kannada. More languages coming soon.' },
  { q: 'Are the doctors qualified in India?', a: 'All our doctors are licensed medical professionals in India, with degrees from top institutions like AIIMS, NIMHANS, CMC Vellore, and are registered with the Medical Council of India.' },
  { q: 'Is my data protected under Indian laws?', a: 'Absolutely! We comply with Indian data protection laws and IT Act 2000. Your conversations are confidential and encrypted.' },
  { q: 'Do you accept Indian health insurance?', a: 'Yes, we work with all major Indian insurance providers including ICICI Lombard, Star Health, New India Assurance, and others.' },
  { q: 'Can I consult doctors from my city?', a: 'Yes, we have doctors available in all major Indian cities including Mumbai, Delhi, Bangalore, Chennai, Kolkata, Pune, Hyderabad, and Ahmedabad.' },
  { q: 'What about emergency support in India?', a: 'We have 24/7 crisis support with connections to local helplines. In case of emergency, we can connect you to immediate support in your city.' }
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'services', label: 'Services', icon: 'info-circle' },
  { id: 'howItWorks', label: 'How It Works', icon: 'chart-bar' },
  { id: 'features', label: 'Features', icon: 'star' },
  { id: 'doctors', label: 'Doctors', icon: 'user-md' },
  { id: 'testimonials', label: 'Stories', icon: 'comments' }
];

const Landing = ({ navigation }) => {
  // State hooks
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ id: 1, text: "Namaste! I'm your AI assistant. Main aapki kaise madad kar sakta hoon? (How can I help you today?)", sender: 'ai' }]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openFaqs, setOpenFaqs] = useState({});
  
  // Refs
  const scrollViewRef = useRef(null);
  const chatBodyRef = useRef(null);
  const carouselRef = useRef(null);
  const autoScrollTimer = useRef(null);
  
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const doctorsRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Effects
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      setTimeout(() => chatBodyRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages, isLoading]);

  // Auto-scroll carousel effect
  useEffect(() => {
    if (TESTIMONIALS_DATA.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        setActiveIndex(prev => {
          const next = (prev + 1) % TESTIMONIALS_DATA.length;
          if (carouselRef.current) {
            carouselRef.current.scrollToIndex({ index: next, animated: true });
          }
          return next;
        });
      }, 5000);
    }
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrolled(offsetY > 50);
  };

  const scrollToSection = (sectionName) => {
    setMenuOpen(false);
    const refMap = {
      home: homeRef, services: servicesRef, howItWorks: howItWorksRef,
      features: featuresRef, doctors: doctorsRef, testimonials: testimonialsRef
    };
    const targetRef = refMap[sectionName];
    if (targetRef?.current && scrollViewRef?.current) {
      targetRef.current.measureLayout(scrollViewRef.current, (x, y) => {
        scrollViewRef.current.scrollTo({ y: y - 70, animated: true });
      }, () => {});
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const userMsg = { id: Date.now(), text: newMessage, sender: 'user' };
    setChatMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setIsLoading(true);
    
    setTimeout(() => {
      const replies = [
        "I understand how you're feeling. Would you like to try some breathing exercises?",
        "Thank you for sharing. How long have you been feeling this way?",
        "I'm here to listen. Would you like me to suggest some coping strategies?",
        "Would you like me to connect you with one of our mental health professionals?"
      ];
      const aiMsg = { id: Date.now(), text: replies[Math.floor(Math.random() * replies.length)], sender: 'ai' };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1000);
  };

  const toggleFaq = (index) => {
    setOpenFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<Icon key={i} name="star" size={14} color={i <= rating ? "#FFD700" : "#DDD"} />);
    }
    return stars;
  };

  const renderTestimonial = ({ item }) => (
    <View style={[styles.testimonialCard, { width: width - 60 }]}>
      <Icon name="quote-left" size={32} color="#2e86ab" style={styles.quoteIcon} />
      <Text style={styles.testimonialText}>{item.quote}</Text>
      <View style={styles.testimonialAuthor}>
        <Text style={styles.authorName}>{item.author}</Text>
        <Text style={styles.authorRole}>{item.role}</Text>
      </View>
      <View style={styles.testimonialRating}>{renderStars(item.rating)}</View>
    </View>
  );

  const pulseScale = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [1, 1.1],
  });
  
  const isHeaderSolid = scrolled || menuOpen;
  const headerBackgroundColor = isHeaderSolid ? 'rgba(255, 255, 255, 0.98)' : 'transparent';
  const headerTextColor = isHeaderSolid ? '#1a3a4a' : '#ffffff';
  const headerAccentColor = isHeaderSolid ? '#2e86ab' : '#ffd166';
  const headerButtonBorderColor = isHeaderSolid ? '#2e86ab' : '#ffffff';
  const headerButtonTextColor = isHeaderSolid ? '#2e86ab' : '#ffffff';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={scrolled ? 'dark-content' : 'light-content'} backgroundColor="transparent" translucent />
      
      {/* Professional Header */}
      <Animated.View style={[styles.header, isHeaderSolid && styles.headerShadow, { backgroundColor: headerBackgroundColor }]}>
        <View style={styles.headerContainer}>
          <View style={styles.logo}>
            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.mobileMenuBtn}>
              <Text style={[styles.menuIcon, { color: headerTextColor }]}>{menuOpen ? '✕' : '☰'}</Text>
            </TouchableOpacity>
            <Text style={[styles.logoText, { color: headerTextColor }]}>
              Medi<Text style={[styles.logoHighlight, { color: headerAccentColor }]}>Coneckt</Text>
            </Text>
          </View>
          
          {/* Professional Desktop Navigation */}
          <View style={styles.desktopNav}>
            {NAV_ITEMS.map(item => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => scrollToSection(item.id)} 
                style={styles.navLink}
                activeOpacity={0.7}
              >
                <Icon name={item.icon} size={16} color={headerTextColor} style={styles.navIcon} />
                <Text style={[styles.navLinkText, { color: headerTextColor }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Mobile Navigation Menu */}
          {menuOpen && (
            <View style={styles.mobileNav}>
              {NAV_ITEMS.map(item => (
                <TouchableOpacity key={item.id} onPress={() => scrollToSection(item.id)} style={styles.mobileNavLink}>
                  <Icon name={item.icon} size={18} color="#2e86ab" style={styles.mobileNavIcon} />
                  <Text style={styles.mobileNavLinkText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.btn, styles.headerActionBtn, { borderColor: headerButtonBorderColor }]} 
            onPress={() => navigation?.navigate('RoleSelector')}
          >
            <Text style={[styles.btnText, { color: headerButtonTextColor }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View ref={homeRef} style={styles.hero}>
          <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.heroTitle}>Human Empower <Text style={styles.textHighlight}>Mental Health</Text></Text>
              <Text style={styles.heroDescription}>Connect with top Indian psychiatrists and therapists. Get 24/7 AI support in Hindi, English, and regional languages. Emergency crisis support across all major Indian cities.</Text>
              
              <View style={styles.heroActions}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.btnLarge]}>
                  <Text style={[styles.btnText, styles.btnPrimaryText]}>Start Free Trial</Text>
                  <Icon name="arrow-right" size={14} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutlineLight, styles.btnLarge]}>
                  <Icon name="play" size={14} color="#FFF" />
                  <Text style={[styles.btnText, { color: '#FFF' }]}>Watch Demo</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.heroStats}>
                <View style={styles.statItem}><Text style={styles.statNumber}>50,000+</Text><Text style={styles.statLabel}>Indian Patients Helped</Text></View>
                <View style={styles.statItem}><Text style={styles.statNumber}>500+</Text><Text style={styles.statLabel}>Indian Medical Partners</Text></View>
                <View style={styles.statItem}><Text style={styles.statNumber}>24/7</Text><Text style={styles.statLabel}>Support in 8 Languages</Text></View>
                <View style={styles.statItem}><Text style={styles.statNumber}>98%</Text><Text style={styles.statLabel}>Patient Satisfaction</Text></View>
              </View>
            </Animated.View>
            
            <View style={styles.heroVisual}>
              <View style={styles.chatPreview}>
                <View style={styles.chatPreviewHeader}>
                  <View style={styles.chatPreviewAvatar}><Icon name="robot" size={20} color="#2e86ab" /></View>
                  <View><Text style={styles.chatPreviewName}>MediConeckt Assistant</Text><Text style={styles.chatPreviewStatus}>Online • Hindi/English Support</Text></View>
                </View>
                <View style={styles.chatPreviewMessages}>
                  <View style={[styles.chatMessage, styles.chatMessageAI]}><Text>Namaste! I'm here to listen. How are you feeling today?</Text></View>
                  <View style={[styles.chatMessage, styles.chatMessageUser]}><Text style={{ color: '#FFF' }}>I've been feeling really anxious about my job interview.</Text></View>
                  <View style={[styles.chatMessage, styles.chatMessageAI]}><Text>I understand interview anxiety. Would you like to try some breathing exercises?</Text></View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View ref={servicesRef} style={styles.section}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Our Services for India</Text>
              <Text style={styles.sectionDescription}>Comprehensive mental health solutions designed specifically for the Indian population.</Text>
            </View>
            <View style={styles.servicesGrid}>
              {SERVICES_DATA.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <View style={styles.serviceIcon}><Icon name={service.icon} size={32} color="#FFF" /></View>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <TouchableOpacity style={styles.serviceLearnMore}><Text style={styles.serviceLearnMoreText}>Learn More</Text><Icon name="arrow-right" size={12} color="#2e86ab" /></TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* How It Works Section */}
        <View ref={howItWorksRef} style={[styles.section, styles.howItWorksBg]}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>How It Works for You</Text>
              <Text style={styles.sectionDescription}>Simple 4-step process designed for the Indian healthcare ecosystem.</Text>
            </View>
            <View style={styles.stepsContainer}>
              {STEPS_DATA.map((step, index) => (
                <View key={index} style={styles.step}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                  <View style={styles.stepIcon}><Icon name={step.icon} size={28} color="#2e86ab" /></View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View ref={featuresRef} style={styles.section}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Indian-First Features</Text>
              <Text style={styles.sectionDescription}>Bridging AI support with professional Indian medical care for comprehensive mental wellness.</Text>
            </View>
            <View style={styles.featuresGrid}>
              {FEATURES_DATA.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <Icon name={feature.icon} size={32} color="#2e86ab" />
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Doctors Section */}
        <View ref={doctorsRef} style={[styles.section, styles.doctorsBg]}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>India's Top Mental Health Experts</Text>
              <Text style={styles.sectionDescription}>Licensed professionals from premier Indian institutions dedicated to providing compassionate care.</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorsList}>
              {DOCTORS_DATA.map(doctor => (
                <View key={doctor.id} style={styles.doctorCard}>
                  <View style={styles.doctorHeader}>
                    <View style={styles.doctorImage}><Icon name="user-md" size={40} color="#FFF" /></View>
                    <View>
                      <Text style={styles.doctorName}>{doctor.name}</Text>
                      <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
                      <View style={styles.doctorRating}>
                        <Icon name="star" size={12} color="#FFD700" />
                        <Text style={styles.doctorRatingText}>{doctor.rating}</Text>
                        <Text style={styles.doctorPatients}>({doctor.patients} patients)</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.doctorDetails}>
                    <View style={styles.doctorDetail}><Icon name="graduation-cap" size={12} color="#2e86ab" /><Text style={styles.doctorDetailText}>{doctor.education}</Text></View>
                    <View style={styles.doctorDetail}><Icon name="briefcase" size={12} color="#2e86ab" /><Text style={styles.doctorDetailText}>{doctor.experience} experience</Text></View>
                    <View style={styles.doctorDetail}><Icon name="hospital" size={12} color="#2e86ab" /><Text style={styles.doctorDetailText}>{doctor.hospital}</Text></View>
                    <View style={styles.doctorDetail}><Icon name="map-marker-alt" size={12} color="#2e86ab" /><Text style={styles.doctorDetailText}>{doctor.location}</Text></View>
                    <View style={styles.doctorDetail}><Icon name="clock" size={12} color="#2e86ab" /><Text style={styles.doctorDetailText}>{doctor.availability}</Text></View>
                    <View style={styles.doctorLanguages}>{doctor.languages.map((lang, idx) => (<View key={idx} style={styles.languageTag}><Text style={styles.languageTagText}>{lang}</Text></View>))}</View>
                  </View>
                  <View style={styles.doctorActions}>
                    <TouchableOpacity style={[styles.btn, styles.btnOutline, styles.doctorActionBtn]}><Icon name="calendar" size={12} color="#2e86ab" /><Text style={styles.btnOutlineText}>Book Appointment</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.doctorActionBtn]}><Icon name="video" size={12} color="#FFF" /><Text style={styles.btnPrimaryText}>Consult Online</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Testimonials Section with Working Carousel */}
        <View ref={testimonialsRef} style={[styles.section, styles.testimonialsBg]}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Stories from Across India</Text>
              <Text style={styles.sectionDescription}>Real stories from people across India who found support and healing through MediConeckt.</Text>
            </View>
            <View style={styles.testimonialsContainer}>
              <FlatList
                ref={carouselRef}
                data={TESTIMONIALS_DATA}
                renderItem={renderTestimonial}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                contentContainerStyle={styles.carouselContent}
                snapToAlignment="center"
                decelerationRate="fast"
              />
              <View style={styles.testimonialDots}>
                {TESTIMONIALS_DATA.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dot, index === activeIndex && styles.dotActive]}
                    onPress={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollToIndex({ index: index, animated: true });
                      }
                      setActiveIndex(index);
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionDescription}>Get answers to common questions about MediConeckt services in India.</Text>
            </View>
            <View style={styles.faqContainer}>
              {FAQS_DATA.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity style={styles.faqQuestion} onPress={() => toggleFaq(index)}>
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <Icon name={openFaqs[index] ? 'minus' : 'plus'} size={16} color="#2e86ab" />
                  </TouchableOpacity>
                  {openFaqs[index] && <View style={styles.faqAnswer}><Text style={styles.faqAnswerText}>{faq.a}</Text></View>}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.container}>
            <View style={styles.footerContent}>
              <View style={styles.footerAbout}>
                <View style={styles.footerLogo}>
                  <Text style={styles.footerLogoText}>Medi<Text style={styles.footerLogoHighlight}>Coneckt</Text></Text>
                </View>
                <Text style={styles.footerDescription}>India's most trusted AI-powered mental health platform with connections to top medical professionals across the country. Available 24/7 in multiple Indian languages.</Text>
                <View style={styles.socialLinks}>
                  <TouchableOpacity style={styles.socialLink}><Icon name="facebook-f" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}><Icon name="twitter" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}><Icon name="instagram" size={16} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}><Icon name="linkedin-in" size={16} color="#FFF" /></TouchableOpacity>
                </View>
              </View>
              <View style={styles.footerLinks}>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Our Services</Text>
                  <TouchableOpacity><Text style={styles.footerLink}>AI Support in 8 Languages</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Affordable Plans (INR)</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Indian Doctors Network</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Patient Stories</Text></TouchableOpacity>
                </View>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Company</Text>
                  <TouchableOpacity><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Careers in India</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Press (India)</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Hospital Partners</Text></TouchableOpacity>
                </View>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Resources</Text>
                  <TouchableOpacity><Text style={styles.footerLink}>Mental Health Blog</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Community Forum</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Research & Studies</Text></TouchableOpacity>
                </View>
                <View style={styles.footerColumn}>
                  <Text style={styles.footerColumnTitle}>Contact</Text>
                  <TouchableOpacity><Text style={styles.footerLink}>Support</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Partner with Us</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Become a Doctor</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.footerLink}>Corporate Wellness</Text></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.footerBottom}>
              <Text style={styles.copyrightText}>© {new Date().getFullYear()} MediConeckt India. All rights reserved.</Text>
              <View style={styles.emergencyNotice}>
                <Icon name="exclamation-triangle" size={14} color="#FF9800" />
                <Text style={styles.emergencyText}><Text style={styles.emergencyBold}>24/7 Crisis Support:</Text> Call +91-9152987821 (India)</Text>
              </View>
              <View style={styles.emergencyNotice}>
                <Icon name="map-marker-alt" size={14} color="#FF9800" />
                <Text style={styles.emergencyText}><Text style={styles.emergencyBold}>Corporate Office:</Text> Saket Nagar, Indore, Madhya Pradesh 452018, India</Text>
              </View>
              <View style={styles.footerLegal}>
                <TouchableOpacity><Text style={styles.legalLink}>Privacy Policy (India)</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.legalLink}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.legalLink}>Medical Disclaimer</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.legalLink}>Grievance Redressal</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={chatOpen} animationType="slide" transparent onRequestClose={() => setChatOpen(false)}>
        <View style={styles.chatPopup}>
          <View style={styles.chatPopupContent}>
            <View style={styles.chatPopupHeader}>
              <View style={styles.chatHeaderInfo}>
                <View style={styles.chatAvatar}><Icon name="robot" size={20} color="#FFF" /></View>
                <View><Text style={styles.chatHeaderTitle}>MediConeckt AI Assistant</Text><Text style={styles.chatHeaderStatus}>Available in English, हिन्दी, தமிழ், తెలుగు</Text></View>
              </View>
              <TouchableOpacity onPress={() => setChatOpen(false)}><Icon name="times" size={20} color="#FFF" /></TouchableOpacity>
            </View>
            <ScrollView ref={chatBodyRef} style={styles.chatPopupBody} contentContainerStyle={styles.chatMessagesContainer}>
              {chatMessages.map(msg => (
                <View key={msg.id} style={[styles.chatMessageWrapper, msg.sender === 'ai' ? styles.chatMessageAI : styles.chatMessageUser]}>
                  {msg.sender === 'ai' && <View style={styles.chatAvatarSmall}><Icon name="robot" size={12} color="#FFF" /></View>}
                  <View style={[styles.chatBubble, msg.sender === 'ai' ? styles.chatBubbleAI : styles.chatBubbleUser]}>
                    <Text style={[styles.chatBubbleText, msg.sender === 'user' && styles.chatBubbleUserText]}>{msg.text}</Text>
                  </View>
                  {msg.sender === 'user' && <View style={[styles.chatAvatarSmall, styles.chatAvatarUser]}><Icon name="user" size={12} color="#FFF" /></View>}
                </View>
              ))}
              {isLoading && <ActivityIndicator size="small" color="#2e86ab" style={styles.loader} />}
            </ScrollView>
            <View style={styles.chatPopupInput}>
              <TextInput style={styles.chatInput} placeholder="Type your message in English or Hindi..." value={newMessage} onChangeText={setNewMessage} onSubmitEditing={sendMessage} multiline />
              <TouchableOpacity style={[styles.sendBtn, (!newMessage.trim() || isLoading) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!newMessage.trim() || isLoading}>
                <Icon name="paper-plane" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Button */}
      <Animated.View style={[styles.chatButtonContainer, { transform: [{ scale: pulseScale }] }]}>
        <TouchableOpacity style={styles.chatButton} onPress={() => setChatOpen(true)}>
          <Icon name="comment-medical" size={28} color="#FFF" />
          <View style={styles.pulseIndicator} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
  container: { paddingHorizontal: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  
  // Professional Header
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, height: Platform.OS === 'ios' ? 90 : 70, justifyContent: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 40 : 0 },
  headerShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { flexDirection: 'row', alignItems: 'center' },
  mobileMenuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', display: width < 768 ? 'flex' : 'none' },
  menuIcon: { fontSize: 24, fontWeight: '600' },
  logoText: { fontSize: 22, fontWeight: '800' },
  logoHighlight: { color: '#2e86ab' },
  
  // Professional Desktop Navigation
  desktopNav: { flexDirection: 'row', gap: 8, display: width < 768 ? 'none' : 'flex' },
  navLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  navIcon: { marginRight: 4 },
  navLinkText: { fontSize: 14, fontWeight: '500' },
  
  // Mobile Navigation
  mobileNav: { position: 'absolute', top: Platform.OS === 'ios' ? 90 : 70, left: 0, right: 0, backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 999 },
  mobileNavLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  mobileNavIcon: { width: 24 },
  mobileNavLinkText: { fontSize: 16, fontWeight: '500', color: '#1a3a4a' },
  
  // Buttons
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
  btnPrimary: { backgroundColor: '#2e86ab' },
  btnPrimaryText: { color: '#FFF', fontWeight: '600' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2e86ab' },
  btnOutlineLight: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FFF' },
  btnOutlineText: { color: '#2e86ab', fontWeight: '600' },
  headerActionBtn: { backgroundColor: 'transparent', borderWidth: 2 },
  btnLarge: { paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { fontSize: 14, fontWeight: '600' },
  
  // Hero
  hero: { backgroundColor: '#2e86ab', paddingTop: 80, paddingBottom: 60, borderBottomRightRadius: 60 },
  heroTitle: { fontSize: width < 480 ? 32 : 44, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 16 },
  textHighlight: { color: '#FFD700' },
  heroDescription: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 24 },
  heroActions: { flexDirection: width < 480 ? 'column' : 'row', justifyContent: 'center', gap: 16, marginBottom: 40 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  statItem: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, minWidth: 110 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  heroVisual: { marginTop: 40, alignItems: 'center' },
  chatPreview: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  chatPreviewHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#2e86ab' },
  chatPreviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatPreviewName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  chatPreviewStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  chatPreviewMessages: { padding: 16, backgroundColor: '#f8f9fa', gap: 12 },
  chatMessage: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  chatMessageAI: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderLeftWidth: 4, borderLeftColor: '#2e86ab' },
  chatMessageUser: { backgroundColor: '#2e86ab', alignSelf: 'flex-end' },
  
  // Sections
  section: { paddingVertical: 60, backgroundColor: '#FFF' },
  howItWorksBg: { backgroundColor: '#f0f9ff' },
  doctorsBg: { backgroundColor: '#f0f9ff' },
  testimonialsBg: { backgroundColor: '#f0f9ff' },
  sectionHeader: { marginBottom: 40 },
  sectionTitle: { fontSize: width <= 576 ? 28 : 36, fontWeight: '700', color: '#1a3a4a', textAlign: 'center', marginBottom: 12 },
  sectionDescription: { fontSize: 16, color: '#666', textAlign: 'center', maxWidth: 600, alignSelf: 'center', lineHeight: 24 },
  
  // Services Grid
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  serviceCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: width <= 576 ? '100%' : width <= 992 ? '45%' : '30%', minWidth: 260, alignItems: 'center' },
  serviceIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2e86ab', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  serviceTitle: { fontSize: 18, fontWeight: '600', color: '#1a3a4a', marginBottom: 12, textAlign: 'center' },
  serviceDescription: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  serviceLearnMore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceLearnMoreText: { fontSize: 14, fontWeight: '600', color: '#2e86ab' },
  
  // Steps
  stepsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  step: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: width <= 768 ? '100%' : '22%', minWidth: 230, alignItems: 'center', position: 'relative' },
  stepNumber: { fontSize: 48, fontWeight: '800', color: 'rgba(46,134,171,0.15)', position: 'absolute', top: 10, right: 20 },
  stepIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(46,134,171,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#1a3a4a', marginBottom: 8, textAlign: 'center' },
  stepDescription: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
  
  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  featureCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: width <= 576 ? '100%' : width <= 992 ? '45%' : '30%', minWidth: 260, alignItems: 'center' },
  featureTitle: { fontSize: 18, fontWeight: '600', color: '#1a3a4a', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  featureDescription: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  
  // Doctors
  doctorsList: { paddingHorizontal: 20, gap: 20 },
  doctorCard: { backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: width - 80, marginRight: 20, overflow: 'hidden' },
  doctorHeader: { backgroundColor: '#2e86ab', padding: 20, flexDirection: 'row', gap: 16 },
  doctorImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  doctorName: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  doctorSpecialization: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  doctorRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doctorRatingText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  doctorPatients: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  doctorDetails: { padding: 20, gap: 12 },
  doctorDetail: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  doctorDetailText: { fontSize: 12, color: '#333', flex: 1 },
  doctorLanguages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  languageTag: { backgroundColor: 'rgba(46,134,171,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  languageTagText: { fontSize: 11, color: '#2e86ab', fontWeight: '500' },
  doctorActions: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
  doctorActionBtn: { flex: 1 },
  
  // Testimonials Carousel
  testimonialsContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  carouselContent: { paddingHorizontal: 20, gap: 20 },
  testimonialCard: { backgroundColor: '#FFF', padding: 32, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, alignItems: 'center', marginHorizontal: 10 },
  quoteIcon: { marginBottom: 20, opacity: 0.3 },
  testimonialText: { fontSize: 16, lineHeight: 26, color: '#333', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  testimonialAuthor: { alignItems: 'center', marginBottom: 16 },
  authorName: { fontSize: 16, fontWeight: '600', color: '#1a3a4a', marginBottom: 4 },
  authorRole: { fontSize: 13, color: '#666' },
  testimonialRating: { flexDirection: 'row', gap: 4 },
  testimonialDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dee2e6' },
  dotActive: { backgroundColor: '#2e86ab', width: 12, height: 12, borderRadius: 6 },
  
  // FAQ
  faqContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  faqItem: { marginBottom: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6', overflow: 'hidden' },
  faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  faqQuestionText: { fontSize: 15, fontWeight: '600', color: '#1a3a4a', flex: 1, paddingRight: 16 },
  faqAnswer: { padding: 20, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  faqAnswerText: { fontSize: 14, color: '#666', lineHeight: 22 },
  
  // Footer
  footer: { backgroundColor: '#1a3a4a', paddingTop: 60, paddingBottom: 20, marginTop: 0 },
  footerContent: { flexDirection: width <= 992 ? 'column' : 'row', gap: 40, marginBottom: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 40 },
  footerAbout: { flex: 1 },
  footerLogo: { marginBottom: 20 },
  footerLogoText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  footerLogoHighlight: { color: '#2e86ab' },
  footerDescription: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 20, maxWidth: 300 },
  socialLinks: { flexDirection: 'row', gap: 12 },
  socialLink: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  footerLinks: { flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  footerColumn: { minWidth: 120, flex: 1 },
  footerColumnTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 16 },
  footerLink: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  footerBottom: { gap: 12 },
  copyrightText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 12 },
  emergencyNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(255,193,7,0.1)', padding: 12, borderRadius: 8, marginBottom: 8 },
  emergencyText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  emergencyBold: { fontWeight: '600', color: '#FFF' },
  footerLegal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 12 },
  legalLink: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  
  // Chat Modal
  chatPopup: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatPopupContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.7 },
  chatPopupHeader: { backgroundColor: '#2e86ab', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  chatHeaderTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  chatHeaderStatus: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  chatPopupBody: { flex: 1, padding: 16 },
  chatMessagesContainer: { gap: 12 },
  chatMessageWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '85%' },
  chatMessageAI: { alignSelf: 'flex-start' },
  chatMessageUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  chatAvatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2e86ab', justifyContent: 'center', alignItems: 'center' },
  chatAvatarUser: { backgroundColor: '#1c5d7a' },
  chatBubble: { padding: 10, borderRadius: 12, maxWidth: '100%' },
  chatBubbleAI: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#dee2e6', borderTopLeftRadius: 4 },
  chatBubbleUser: { backgroundColor: '#2e86ab', borderTopRightRadius: 4 },
  chatBubbleText: { fontSize: 13, color: '#333' },
  chatBubbleUserText: { color: '#FFF' },
  loader: { marginVertical: 10 },
  chatPopupInput: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#dee2e6', gap: 8 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2e86ab', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  
  // Chat Button
  chatButtonContainer: { position: 'absolute', bottom: 20, right: 20, zIndex: 1000 },
  chatButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2e86ab', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 8 },
  pulseIndicator: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
});

export default Landing;