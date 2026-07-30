import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import axiosInstance from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import "./CounselorDirectory.css";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import StarRating from "../../../../components/StarRating";
import {
  formatPresenceText,
  getPresence,
  getPresenceUserId,
  resolveOfflineLastSeen,
} from "../../../../utils/presence";

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

// Keep this identical to the Chat tab: all API/socket payload shapes are
// normalized in one place instead of requiring several duplicate flags.
const isCounselorOnline = (counselor) => getPresence(counselor).isOnline;

const CounselorTable = () => {
  const { t } = useUserTranslation();
  const navigate = useNavigate();
  const [startingChatId, setStartingChatId] = useState(null);

  const handleBookAppointment = (counselor) => {
    const counselorData = {
      id: counselor._id || counselor.id,
      name: counselor.fullName || counselor.name,
      specialization: counselor.specialization,
      profilePhoto: counselor.profilePhoto,
      rating: counselor.rating,
      experience: counselor.experience,
      isOnline: counselor.isOnline,
      isLoggedIn: counselor.isLoggedIn,
      lastSeen: counselor.lastSeen,
    };
    navigate("/dashboard/appointment", {
      state: { selectedCounselor: counselorData },
    });
  };

  const handleChatNow = async (counselor) => {
    const counselorId = counselor._id || counselor.id;

    if (!isCounselorOnline(counselor)) {
      return;
    }

    try {
      setStartingChatId(counselorId);

      const response = await axiosInstance.post("/api/chat/start", {
        counselorId,
      });
      const chatId = response.data?.chat?.id || response.data?.chatId;

      navigate(`/chat/${counselorId}`, {
        state: {
          chatId,
          counselor: {
            id: counselorId,
            name: counselor.fullName || counselor.name,
            specialization: counselor.specialization,
            profilePhoto: counselor.profilePhoto,
            isOnline: counselor.isOnline,
            isLoggedIn: counselor.isLoggedIn,
            lastSeen: counselor.lastSeen,
          },
        },
      });
    } catch (err) {
      const status = err?.response?.status;
      const existingChatId = err?.response?.data?.chatId;
      const serverMessage =
        err?.response?.data?.error || err?.response?.data?.message || "";

      if (status === 400 && existingChatId) {
        navigate(`/chat/${counselorId}`, {
          state: { chatId: existingChatId, counselor },
        });
        return;
      }

      alert(serverMessage || t('chat_already_connected'));
    } finally {
      setStartingChatId(null);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("online");
  const [counselorsData, setCounselorsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCounselors = async (showLoader = true) => {
      try {
        if (showLoader) setIsLoading(true);

        const response = await axiosInstance.get("/api/auth/counsellors");
        const counselors = (
          response.data?.counsellors ||
          response.data?.counselors ||
          []
        ).map((counselor) => {
          const presence = getPresence(counselor);
          return {
            ...counselor,
            presenceStatus: presence.isOnline ? "online" : "offline",
            hasActiveSession: presence.isOnline,
            socketOnline: presence.isOnline,
            online: presence.isOnline,
            isOnline: presence.isOnline,
            isLoggedIn: presence.isOnline,
          };
        });

        if (isMounted) {
          setCounselorsData(counselors);
          setError("");
        }
      } catch (err) {
        console.error("Failed to fetch counselors:", err);
        if (isMounted && showLoader) setError(t('error_load_counselors'));
      } finally {
        if (isMounted && showLoader) setIsLoading(false);
      }
    };

    void fetchCounselors(true);

    // Socket events are primary. This reconciliation covers an event missed
    // while the tab was mounting, reconnecting, or in the background.
    const refreshTimer = window.setInterval(() => {
      void fetchCounselors(false);
    }, 15_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void fetchCounselors(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [t]);

  useEffect(() => {
    let mounted = true;

    const onPresenceUpdate = (payload = {}) => {
      if (!mounted) return;
      const presence = getPresence(payload);
      const userId = getPresenceUserId(payload);
      const isLoggedIn = presence.isLoggedIn;
      const hasLoginStatus = presence.hasLoginStatus;
      const lastSeen = presence.lastSeen;
      console.log(`[Presence] ${userId} socket is now ${presence.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      setCounselorsData((prev) =>
        prev.map((counselor) =>
          String(counselor._id || counselor.id) === String(userId)
            ? (() => {
                const isOnline = presence.isOnline;
                return {
                ...counselor,
                isOnline,
                online: isOnline,
                presenceStatus: isOnline ? "online" : "offline",
                hasActiveSession: isOnline,
                isLoggedIn: hasLoginStatus
                  ? isLoggedIn
                  : counselor.isLoggedIn,
                socketOnline: presence.isOnline,
                lastSeen: resolveOfflineLastSeen(
                  { ...presence, lastSeen },
                  counselor.lastSeen,
                ),
                };
              })()
            : counselor,
        ),
      );
    };

    const onConnectError = (err) => {
      console.error("Presence socket connection error:", err.message);
    };

    socketService.connect().then((socket) => {
      if (!mounted) return;
      socket.on("presence-update", onPresenceUpdate);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[CounselorDirectory] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      socketService.off("presence-update", onPresenceUpdate);
      socketService.off("connect_error", onConnectError);
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
        <div className="header-badge">{t("mental_health_experts")}</div>
        <h2 className="directory-title">
          {t("find_your")} <span className="title-highlight">{t("counselor_label")}</span>
        </h2>
        <p className="directory-subtitle">
          {t("counselor_directory_subtitle")}
        </p>
      </div>

      <div className="search-section">
        <div className="search-wrapper">
          <FaSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder={t('search_counselors')}
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
            {t('all')}
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
          <span className="sort-label">{t('sort_by')}:</span>
          <button
            className={`sort-btn ${sortBy === "online" ? "active" : ""}`}
            onClick={() => setSortBy("online")}
          >
            {t('online')}
          </button>
          <button
            className={`sort-btn ${sortBy === "name" ? "active" : ""}`}
            onClick={() => setSortBy("name")}
          >
            {t('name')}
          </button>
          <button
            className={`sort-btn ${sortBy === "rating" ? "active" : ""}`}
            onClick={() => setSortBy("rating")}
          >
            {t('rating')}
          </button>
          <button
            className={`sort-btn ${sortBy === "experience" ? "active" : ""}`}
            onClick={() => setSortBy("experience")}
          >
            {t('experience')}
          </button>
        </div>
        <div className="result-count">
          {isLoading
            ? t('loading')
            : `${sortedCounselors.length} ${t('counselors_found')}`}
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
            const online = isCounselorOnline(counselor);
            const isStartingChat = String(startingChatId) === String(id);
            const presenceText = formatPresenceText(
              { isOnline: online, lastSeen: counselor.lastSeen },
              {
                onlineText: t('online') || "Online",
                offlineText: t('offline') || "Offline",
              },
            );

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
                        online ? "online" : "offline"
                      }`}
                      title={online ? t('online') : t('offline')}
                    />
                  </div>
                  <div className="counselor-basic">
                    <h3 className="counselor-name">{name}</h3>
                    <p className="counselor-specialization">
                      {specializations[0] || counselor.qualification || "Counselor"}
                    </p>
                    <p className={`counselor-presence-text ${online ? "online" : "offline"}`}>
                      {presenceText}
                    </p>
                  </div>
                  <div
                    className={`availability-badge ${
                      online ? "now" : ""
                    }`}
                  >
                    {presenceText}
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
                    <span className="stat-label">{t('rating')}</span>
                    <span className="stat-value">
                      {counselor.ratingCount > 0 ? (
                        <StarRating
                          rating={counselor.rating}
                          count={counselor.ratingCount}
                          size={14}
                          showValue={true}
                        />
                      ) : (
                        <span style={{ color: "#2c50cd", fontSize: 12 }}>✨ New</span>
                      )}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('experience')}</span>
                    <span className="stat-value">{counselor.experience || 0} {t('yrs')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('sessions_label')}</span>
                    <span className="stat-value">{counselor.totalSessions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('location')}</span>
                    <span className="stat-value">{counselor.location || t('online')}</span>
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
                  <div className="card-actions">
                    <button
                      className={`chat-now-btn ${!online ? "disabled" : ""}`}
                      onClick={() => handleChatNow(counselor)}
                      disabled={!online || isStartingChat}
                      title={online ? t('chat_now') : t('offline')}
                    >
                      {online ? t('chat_now') : t('unavailable')}
                    </button>
                    <button
                      className="book-btn"
                      onClick={() => handleBookAppointment(counselor)}
                    >
                      {t('book_appointment')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {!error && !isLoading && sortedCounselors.length === 0 && (
          <div className="no-results">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="#a0b3d9">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <h4>{t('error_load_counselors')}</h4>
            <p>{t('search_counselors')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorTable;
