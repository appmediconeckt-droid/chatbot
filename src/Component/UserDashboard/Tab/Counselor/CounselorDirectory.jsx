import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import axiosInstance, { API_BASE_URL } from "../../../../axiosConfig";
import "./CounselorDirectory.css";

const getInitials = (name = "Counselor") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CO";

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const getProfilePhotoUrl = (profilePhoto) => {
  if (!profilePhoto) return null;
  if (typeof profilePhoto === "string") return profilePhoto;
  return profilePhoto.url || null;
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "Offline";

  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  return `Last seen ${Math.floor(diffHours / 24)}d ago`;
};

const CounselorTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("online");
  const [counselorsData, setCounselorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCounselors = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axiosInstance.get("/api/auth/counsellors");
        const counselors =
          response.data?.counsellors || response.data?.counselors || [];

        if (isMounted) setCounselorsData(counselors);
      } catch (err) {
        console.error("Failed to fetch counselors:", err);
        if (isMounted) setError("Unable to load counselors right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCounselors();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return undefined;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("presence-update", ({ userId, isOnline, lastSeen }) => {
      setCounselorsData((prev) =>
        prev.map((counselor) =>
          String(counselor._id || counselor.id) === String(userId)
            ? { ...counselor, isOnline, lastSeen }
            : counselor,
        ),
      );
    });

    socket.on("connect_error", (err) => {
      console.error("Presence socket connection error:", err.message);
    });

    return () => {
      socket.off("presence-update");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  const allTreatments = useMemo(() => {
    const treatments = new Set();
    counselorsData.forEach((counselor) => {
      normalizeArray(counselor.specialization).forEach((item) =>
        treatments.add(item),
      );
    });
    return Array.from(treatments).sort((a, b) => a.localeCompare(b));
  }, [counselorsData]);

  const filteredCounselors = counselorsData.filter((counselor) => {
    const name = counselor.fullName || counselor.name || "";
    const specializations = normalizeArray(counselor.specialization);
    const languages = normalizeArray(counselor.languages);
    const searchableText = [
      name,
      counselor.qualification,
      counselor.location,
      counselor.aboutMe,
      ...specializations,
      ...languages,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      specializations.some(
        (item) => item.toLowerCase() === selectedCategory.toLowerCase(),
      );

    return matchesSearch && matchesCategory;
  });

  const sortedCounselors = [...filteredCounselors].sort((a, b) => {
    if (sortBy === "online") return Number(b.isOnline) - Number(a.isOnline);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "experience") return (b.experience || 0) - (a.experience || 0);
    return (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "");
  });

  return (
    <div className="counselor-directory">
      <div className="directory-header">
        <div className="header-badge">Mental Health Experts</div>
        <h2 className="directory-title">
          Find your <span className="title-highlight">counselor</span>
        </h2>
        <p className="directory-subtitle">
          Professional therapists specialized in various treatments
        </p>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, specialization, treatment or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm("")}>
              x
            </button>
          )}
        </div>
      </div>

      <div className="filters-container">
        <div className="chips-wrapper">
          <button
            className={`filter-chip ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All
          </button>
          {allTreatments.slice(0, 12).map((treatment) => (
            <button
              key={treatment}
              className={`filter-chip ${selectedCategory === treatment ? "active" : ""}`}
              onClick={() => setSelectedCategory(treatment)}
            >
              {treatment}
            </button>
          ))}
        </div>
      </div>

      <div className="sort-bar">
        <div className="sort-left">
          <span className="sort-label">Sort by:</span>
          <button
            className={`sort-btn ${sortBy === "online" ? "active" : ""}`}
            onClick={() => setSortBy("online")}
          >
            Online
          </button>
          <button
            className={`sort-btn ${sortBy === "name" ? "active" : ""}`}
            onClick={() => setSortBy("name")}
          >
            Name
          </button>
          <button
            className={`sort-btn ${sortBy === "rating" ? "active" : ""}`}
            onClick={() => setSortBy("rating")}
          >
            Rating
          </button>
          <button
            className={`sort-btn ${sortBy === "experience" ? "active" : ""}`}
            onClick={() => setSortBy("experience")}
          >
            Experience
          </button>
        </div>
        <div className="result-count">
          {isLoading
            ? "Loading counselors..."
            : `${sortedCounselors.length} ${
                sortedCounselors.length === 1 ? "counselor" : "counselors"
              } found`}
        </div>
      </div>

      <div className="counselor-grid">
        {error && <div className="no-results">{error}</div>}

        {!error &&
          sortedCounselors.map((counselor) => {
            const id = counselor._id || counselor.id;
            const name = counselor.fullName || counselor.name || "Counselor";
            const specializations = normalizeArray(counselor.specialization);
            const languages = normalizeArray(counselor.languages);
            const profilePhotoUrl = getProfilePhotoUrl(counselor.profilePhoto);

            return (
              <div key={id} className="counselor-card">
                <div className="card-header">
                  <div className="counselor-avatar">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt={name} />
                    ) : (
                      getInitials(name)
                    )}
                    <span
                      className={`presence-dot ${
                        counselor.isOnline ? "online" : "offline"
                      }`}
                      title={counselor.isOnline ? "Online" : formatLastSeen(counselor.lastSeen)}
                    />
                  </div>
                  <div className="counselor-basic">
                    <h3 className="counselor-name">{name}</h3>
                    <p className="counselor-specialization">
                      {specializations[0] || counselor.qualification || "Counselor"}
                    </p>
                  </div>
                  <div
                    className={`availability-badge ${
                      counselor.isOnline ? "now" : ""
                    }`}
                  >
                    {counselor.isOnline ? "Online" : formatLastSeen(counselor.lastSeen)}
                  </div>
                </div>

                <div className="treatment-tags">
                  {specializations.slice(0, 3).map((specialization) => (
                    <span key={specialization} className="tag">
                      {specialization}
                    </span>
                  ))}
                  {specializations.length > 3 && (
                    <span className="tag more">+{specializations.length - 3}</span>
                  )}
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">
                      <span className="star">★</span> {counselor.rating || 0}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Experience</span>
                    <span className="stat-value">{counselor.experience || 0} yrs</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">{counselor.totalSessions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Location</span>
                    <span className="stat-value">{counselor.location || "Online"}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="languages">
                    {languages.slice(0, 3).map((lang) => (
                      <span key={lang} className="language">
                        {lang}
                      </span>
                    ))}
                  </div>
                  <button className="book-btn">Book session</button>
                </div>
              </div>
            );
          })}

        {!error && !isLoading && sortedCounselors.length === 0 && (
          <div className="no-results">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#a0b3d9">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
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
