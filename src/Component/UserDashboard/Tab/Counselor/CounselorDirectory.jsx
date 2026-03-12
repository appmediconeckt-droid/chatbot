import React, { useState } from 'react';
import './CounselorDirectory.css';

const CounselorTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Enhanced sample data with more fields for richness
  const counselorsData = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      specialization: "Clinical Psychologist",
      treatmentTypes: ["Depression", "Anxiety", "Stress", "Trauma"],
      experience: "12 yrs",
      languages: ["Hindi", "English"],
      rating: 4.8,
      fee: "₹1200",
      availability: "Today",
      patients: 1240,
      avatar: "PS"
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      specialization: "Psychiatrist",
      treatmentTypes: ["Bipolar", "Schizophrenia", "OCD", "ADHD"],
      experience: "15 yrs",
      languages: ["Hindi", "English", "Urdu"],
      rating: 4.9,
      fee: "₹1500",
      availability: "Tomorrow",
      patients: 2350,
      avatar: "RK"
    },
    {
      id: 3,
      name: "Dr. Sneha Patel",
      specialization: "Child Psychologist",
      treatmentTypes: ["Autism", "ADHD", "Learning", "Behavioral"],
      experience: "8 yrs",
      languages: ["Gujarati", "Hindi", "English"],
      rating: 4.7,
      fee: "₹1000",
      availability: "Today",
      patients: 890,
      avatar: "SP"
    },
    {
      id: 4,
      name: "Dr. Amit Verma",
      specialization: "Marriage Counselor",
      treatmentTypes: ["Relationship", "Couple", "Divorce", "Family"],
      experience: "10 yrs",
      languages: ["Hindi", "English", "Bengali"],
      rating: 4.6,
      fee: "₹1100",
      availability: "Now",
      patients: 1560,
      avatar: "AV"
    },
    {
      id: 5,
      name: "Dr. Neha Gupta",
      specialization: "Addiction Counselor",
      treatmentTypes: ["Substance", "Alcohol", "Gambling", "Recovery"],
      experience: "9 yrs",
      languages: ["Hindi", "English", "Marathi"],
      rating: 4.9,
      fee: "₹1300",
      availability: "Today",
      patients: 980,
      avatar: "NG"
    },
    {
      id: 6,
      name: "Dr. Vikram Singh",
      specialization: "Trauma Specialist",
      treatmentTypes: ["PTSD", "Childhood Trauma", "Abuse", "Grief"],
      experience: "14 yrs",
      languages: ["Hindi", "English", "Punjabi"],
      rating: 4.8,
      fee: "₹1400",
      availability: "Tomorrow",
      patients: 1870,
      avatar: "VS"
    },
    {
      id: 7,
      name: "Dr. Anjali Mehta",
      specialization: "Cognitive Therapist",
      treatmentTypes: ["Anxiety", "Depression", "Phobias", "Panic"],
      experience: "11 yrs",
      languages: ["Hindi", "English", "Sanskrit"],
      rating: 4.8,
      fee: "₹1250",
      availability: "Today",
      patients: 1430,
      avatar: "AM"
    },
    {
      id: 8,
      name: "Dr. Suresh Reddy",
      specialization: "Neuro Psychologist",
      treatmentTypes: ["Memory Issues", "Brain Injury", "Dementia", "Stroke"],
      experience: "16 yrs",
      languages: ["Telugu", "Hindi", "English"],
      rating: 4.9,
      fee: "₹1600",
      availability: "Now",
      patients: 2120,
      avatar: "SR"
    }
  ];

  // All treatment types (used for filter chips)
  const allTreatments = [
    "Depression", "Anxiety", "Stress", "Trauma", "Bipolar", 
    "Schizophrenia", "OCD", "ADHD", "Autism", "Learning",
    "Relationship", "Couple", "Divorce", "Family", "Substance",
    "Alcohol", "PTSD", "Abuse", "Grief", "Phobias", "Dementia"
  ];

  // Filter counselors based on search and category
  const filteredCounselors = counselorsData.filter(counselor => {
    const matchesSearch = 
      counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.treatmentTypes.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      counselor.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || 
      counselor.treatmentTypes.some(t => t.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Sort counselors
  const sortedCounselors = [...filteredCounselors].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'fee') return parseInt(a.fee.replace('₹', '')) - parseInt(b.fee.replace('₹', ''));
    if (sortBy === 'experience') return parseInt(b.experience) - parseInt(a.experience);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="counselor-directory">
      {/* Header with decorative element */}
      <div className="directory-header">
        <div className="header-badge">🧠 Mental Health Experts</div>
        <h2 className="directory-title">Find your <span className="title-highlight">counselor</span></h2>
        <p className="directory-subtitle">Professional therapists specialized in various treatments</p>
      </div>

      {/* Search Bar - modern design */}
      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, specialization, treatment or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter chips with horizontal scroll on mobile */}
      <div className="filters-container">
        <div className="chips-wrapper">
          <button 
            className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {allTreatments.slice(0, 12).map((treatment, idx) => (
            <button
              key={idx}
              className={`filter-chip ${selectedCategory === treatment ? 'active' : ''}`}
              onClick={() => setSelectedCategory(treatment)}
            >
              {treatment}
            </button>
          ))}
        </div>
      </div>

      {/* Sort bar and result count */}
      <div className="sort-bar">
        <div className="sort-left">
          <span className="sort-label">Sort by:</span>
          <button 
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => setSortBy('name')}
          >
            Name
          </button>
          <button 
            className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            Rating
          </button>
          <button 
            className={`sort-btn ${sortBy === 'fee' ? 'active' : ''}`}
            onClick={() => setSortBy('fee')}
          >
            Fee (low)
          </button>
          <button 
            className={`sort-btn ${sortBy === 'experience' ? 'active' : ''}`}
            onClick={() => setSortBy('experience')}
          >
            Experience
          </button>
        </div>
        <div className="result-count">
          {sortedCounselors.length} {sortedCounselors.length === 1 ? 'counselor' : 'counselors'} found
        </div>
      </div>

      {/* Cards Grid */}
      <div className="counselor-grid">
        {sortedCounselors.length > 0 ? (
          sortedCounselors.map((counselor) => (
            <div key={counselor.id} className="counselor-card">
              {/* Card header with avatar and availability */}
              <div className="card-header">
                <div className="counselor-avatar">
                  {counselor.avatar}
                </div>
                <div className="counselor-basic">
                  <h3 className="counselor-name">{counselor.name}</h3>
                  <p className="counselor-specialization">{counselor.specialization}</p>
                </div>
                <div className={`availability-badge ${counselor.availability === 'Now' ? 'now' : ''}`}>
                  {counselor.availability}
                </div>
              </div>

              {/* Tags (treatment types) */}
              <div className="treatment-tags">
                {counselor.treatmentTypes.slice(0, 3).map((t, i) => (
                  <span key={i} className="tag">{t}</span>
                ))}
                {counselor.treatmentTypes.length > 3 && (
                  <span className="tag more">+{counselor.treatmentTypes.length - 3}</span>
                )}
              </div>

              {/* Stats grid */}
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">
                    <span className="star">★</span> {counselor.rating}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Experience</span>
                  <span className="stat-value">{counselor.experience}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Patients</span>
                  <span className="stat-value">{counselor.patients.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fee</span>
                  <span className="stat-value fee">{counselor.fee}</span>
                </div>
              </div>

              {/* Languages and action */}
              <div className="card-footer">
                <div className="languages">
                  {counselor.languages.map((lang, i) => (
                    <span key={i} className="language">{lang}</span>
                  ))}
                </div>
                <button className="book-btn">Book session</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#a0b3d9">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <h4>No counselors found</h4>
            <p>Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorTable;