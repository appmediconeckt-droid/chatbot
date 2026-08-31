import React, { useEffect, useMemo, useState } from "react";
import { FaMapMarkerAlt, FaSearch, FaStar, FaUserMd } from "react-icons/fa";
import api from "../../../../axiosConfig";
import "./PsychiatristsDirectory.css";

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const isPsychiatrist = (counselor = {}) => {
  const specializations = [
    ...normalizeList(counselor.specialization),
    ...normalizeList(counselor.specializations),
    ...normalizeList(counselor.speciality),
    ...normalizeList(counselor.specialty),
  ];
  return specializations.some((item) => /\bpsychiatr(?:ist|y|ic)\b/i.test(String(item)));
};

const getPhoto = (counselor = {}) => {
  const photo = counselor.profilePhoto || counselor.profileImage || counselor.avatar;
  if (typeof photo === "string") return photo;
  return photo?.url || photo?.secureUrl || photo?.secure_url || "";
};

export default function PsychiatristsDirectory() {
  const [counselors, setCounselors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadCounselors = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/auth/counsellors");
        const list = response.data?.counsellors || response.data?.counselors || [];
        const psychiatrists = list.filter(isPsychiatrist);
        if (mounted) {
          setCounselors(psychiatrists);
          setError("");
        }
      } catch (requestError) {
        console.error("Unable to load counselors:", requestError);
        if (mounted) setError("Unable to load counselors. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadCounselors();
    return () => { mounted = false; };
  }, []);

  const visibleCounselors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return counselors;
    return counselors.filter((counselor) => [
      counselor.fullName,
      counselor.name,
      counselor.qualification,
      counselor.location,
      ...normalizeList(counselor.specialization),
      ...normalizeList(counselor.languages),
    ].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [counselors, search]);

  return (
    <section className="psychiatrists-directory">
      <header className="psychiatrists-directory__header">
        <div>
          <span>Professional network</span>
          <h1>Psychiatrist</h1>
          <p>View psychiatrists available on Humaeli.</p>
        </div>
        <label>
          <FaSearch aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search psychiatrists"
            aria-label="Search psychiatrists"
          />
        </label>
      </header>

      {loading ? (
        <div className="psychiatrists-directory__state">Loading psychiatrists...</div>
      ) : error ? (
        <div className="psychiatrists-directory__state error">{error}</div>
      ) : visibleCounselors.length === 0 ? (
        <div className="psychiatrists-directory__state">No psychiatrists found.</div>
      ) : (
        <div className="psychiatrists-directory__grid">
          {visibleCounselors.map((counselor) => {
            const photo = getPhoto(counselor);
            const specializations = normalizeList(counselor.specialization);
            return (
              <article key={counselor._id || counselor.id} className="psychiatrist-card">
                <div className="psychiatrist-card__photo">
                  {photo ? (
                    <img src={photo} alt={counselor.fullName || counselor.name || "Counselor"} />
                  ) : (
                    <FaUserMd />
                  )}
                  <i className={counselor.isOnline ? "online" : "offline"} aria-label={counselor.isOnline ? "Online" : "Offline"} />
                </div>
                <div className="psychiatrist-card__body">
                  <h2>{counselor.fullName || counselor.name || "Counselor"}</h2>
                  <p className="psychiatrist-card__qualification">
                    {counselor.qualification || "Mental wellness professional"}
                  </p>
                  <div className="psychiatrist-card__tags">
                    {(specializations.length ? specializations : ["Counseling"])
                      .slice(0, 3)
                      .map((item) => <span key={item}>{item}</span>)}
                  </div>
                  <div className="psychiatrist-card__meta">
                    <span><FaMapMarkerAlt /> {counselor.location || "Location not added"}</span>
                    <span><FaStar /> {Number(counselor.rating || 0).toFixed(1)}</span>
                    <span>{counselor.experience || 0} years experience</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
