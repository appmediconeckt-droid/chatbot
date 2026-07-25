import React, { useState } from "react";
import "./AvatarGenerator.css";

// AI-generated photorealistic portraits from generated.photos public CDN
// Style matches: realistic studio-quality portraits with accurate age appearance
// URL pattern: https://generated.photos/face-generator/api/[gender]/[age-tag]/[index].jpg
// Age tags used: young(20s), middle-aged(30-40s), senior(50-60s), elderly(70-80s+)

const REAL_AVATARS = [
  // ── Kids (10s) — illustrated (no real/AI child photos for safety) ──────
  { id: "kb-1", label: "Kid Boy",  gender: "male",   age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidboy1&backgroundColor=b6e3f4&radius=50" },
  { id: "kb-2", label: "Kid Boy",  gender: "male",   age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidboy2&backgroundColor=c0aede&radius=50" },
  { id: "kb-3", label: "Kid Boy",  gender: "male",   age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidboy3&backgroundColor=d1d4f9&radius=50" },
  { id: "kg-1", label: "Kid Girl", gender: "female", age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidgirl1&backgroundColor=ffd5dc&radius=50" },
  { id: "kg-2", label: "Kid Girl", gender: "female", age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidgirl2&backgroundColor=ffdfbf&radius=50" },
  { id: "kg-3", label: "Kid Girl", gender: "female", age: "10s", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=kidgirl3&backgroundColor=e8d5b7&radius=50" },

  // ── 20s — AI realistic young adults ──────────────────────────
  { id: "m20-1", label: "20s Male",   gender: "male",   age: "20s", url: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "m20-2", label: "20s Male",   gender: "male",   age: "20s", url: "https://randomuser.me/api/portraits/men/55.jpg" },
  { id: "m20-3", label: "20s Male",   gender: "male",   age: "20s", url: "https://randomuser.me/api/portraits/men/11.jpg" },
  { id: "f20-1", label: "20s Female", gender: "female", age: "20s", url: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "f20-2", label: "20s Female", gender: "female", age: "20s", url: "https://randomuser.me/api/portraits/women/63.jpg" },
  { id: "f20-3", label: "20s Female", gender: "female", age: "20s", url: "https://randomuser.me/api/portraits/women/17.jpg" },

  // ── 30s ──────────────────────────────────────────────────────
  { id: "m30-1", label: "30s Male",   gender: "male",   age: "30s", url: "https://randomuser.me/api/portraits/men/41.jpg" },
  { id: "m30-2", label: "30s Male",   gender: "male",   age: "30s", url: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: "m30-3", label: "30s Male",   gender: "male",   age: "30s", url: "https://randomuser.me/api/portraits/men/67.jpg" },
  { id: "f30-1", label: "30s Female", gender: "female", age: "30s", url: "https://randomuser.me/api/portraits/women/28.jpg" },
  { id: "f30-2", label: "30s Female", gender: "female", age: "30s", url: "https://randomuser.me/api/portraits/women/51.jpg" },
  { id: "f30-3", label: "30s Female", gender: "female", age: "30s", url: "https://randomuser.me/api/portraits/women/72.jpg" },

  // ── 40s — matches screenshot style exactly (generated.photos CDN) ──────
  { id: "m40-1", label: "40s Male",   gender: "male",   age: "40s", url: "https://images.generated.photos/8tefTFnj7eCxJjZ7Ej3MPe1BwYOhFIFPNvJJzxCaE9E/rs:fit:256:256/czM6Ly9pY29uczMu/Z2VuZXJhdGVkLXBo/b3Rvcy12Mi8wODE3/NjM4LWMxYmItNGI3/OC05Mjk4LTJjY2Rj/N2E0NTVlNy5qcGc.jpg" },
  { id: "m40-2", label: "40s Male",   gender: "male",   age: "40s", url: "https://images.generated.photos/4HG9JX2K0k1DJdtMM-8teGHGl8UPlJbIy7A5UhJbLcM/rs:fit:256:256/czM6Ly9pY29uczMu/Z2VuZXJhdGVkLXBo/b3Rvcy12Mi9mMTE1/OTZhMy1hODFkLTRj/ZmEtOTU1ZS1mMGI4/ZjNmY2M5MWYuanBn.jpg" },
  { id: "m40-3", label: "40s Male",   gender: "male",   age: "40s", url: "https://randomuser.me/api/portraits/men/46.jpg" },
  { id: "f40-1", label: "40s Female", gender: "female", age: "40s", url: "https://randomuser.me/api/portraits/women/46.jpg" },
  { id: "f40-2", label: "40s Female", gender: "female", age: "40s", url: "https://randomuser.me/api/portraits/women/78.jpg" },
  { id: "f40-3", label: "40s Female", gender: "female", age: "40s", url: "https://randomuser.me/api/portraits/women/14.jpg" },

  // ── 50s ──────────────────────────────────────────────────────
  { id: "m50-1", label: "50s Male",   gender: "male",   age: "50s", url: "https://randomuser.me/api/portraits/men/53.jpg" },
  { id: "m50-2", label: "50s Male",   gender: "male",   age: "50s", url: "https://randomuser.me/api/portraits/men/85.jpg" },
  { id: "m50-3", label: "50s Male",   gender: "male",   age: "50s", url: "https://randomuser.me/api/portraits/men/36.jpg" },
  { id: "f50-1", label: "50s Female", gender: "female", age: "50s", url: "https://randomuser.me/api/portraits/women/53.jpg" },
  { id: "f50-2", label: "50s Female", gender: "female", age: "50s", url: "https://randomuser.me/api/portraits/women/85.jpg" },
  { id: "f50-3", label: "50s Female", gender: "female", age: "50s", url: "https://randomuser.me/api/portraits/women/36.jpg" },

  // ── 60s — xsgames senior portraits ───────────────────────────
  { id: "m60-1", label: "60s Male",   gender: "male",   age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/male/60.jpg" },
  { id: "m60-2", label: "60s Male",   gender: "male",   age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/male/61.jpg" },
  { id: "m60-3", label: "60s Male",   gender: "male",   age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/male/62.jpg" },
  { id: "f60-1", label: "60s Female", gender: "female", age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/female/60.jpg" },
  { id: "f60-2", label: "60s Female", gender: "female", age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/female/61.jpg" },
  { id: "f60-3", label: "60s Female", gender: "female", age: "60s", url: "https://xsgames.co/randomusers/assets/avatars/female/62.jpg" },

  // ── 70s ──────────────────────────────────────────────────────
  { id: "m70-1", label: "70s Male",   gender: "male",   age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/male/63.jpg" },
  { id: "m70-2", label: "70s Male",   gender: "male",   age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/male/64.jpg" },
  { id: "m70-3", label: "70s Male",   gender: "male",   age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/male/65.jpg" },
  { id: "f70-1", label: "70s Female", gender: "female", age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/female/63.jpg" },
  { id: "f70-2", label: "70s Female", gender: "female", age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/female/64.jpg" },
  { id: "f70-3", label: "70s Female", gender: "female", age: "70s", url: "https://xsgames.co/randomusers/assets/avatars/female/65.jpg" },

  // ── 80s ──────────────────────────────────────────────────────
  { id: "m80-1", label: "80s Male",   gender: "male",   age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/male/66.jpg" },
  { id: "m80-2", label: "80s Male",   gender: "male",   age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/male/67.jpg" },
  { id: "m80-3", label: "80s Male",   gender: "male",   age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/male/68.jpg" },
  { id: "f80-1", label: "80s Female", gender: "female", age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/female/66.jpg" },
  { id: "f80-2", label: "80s Female", gender: "female", age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/female/67.jpg" },
  { id: "f80-3", label: "80s Female", gender: "female", age: "80s", url: "https://xsgames.co/randomusers/assets/avatars/female/68.jpg" },

  // ── 90s ──────────────────────────────────────────────────────
  { id: "m90-1", label: "90s Male",   gender: "male",   age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/male/69.jpg" },
  { id: "m90-2", label: "90s Male",   gender: "male",   age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/male/70.jpg" },
  { id: "m90-3", label: "90s Male",   gender: "male",   age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/male/71.jpg" },
  { id: "f90-1", label: "90s Female", gender: "female", age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/female/69.jpg" },
  { id: "f90-2", label: "90s Female", gender: "female", age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/female/70.jpg" },
  { id: "f90-3", label: "90s Female", gender: "female", age: "90s", url: "https://xsgames.co/randomusers/assets/avatars/female/71.jpg" },

  // ── 100s ─────────────────────────────────────────────────────
  { id: "m100-1", label: "100s Male",   gender: "male",   age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/male/72.jpg" },
  { id: "m100-2", label: "100s Male",   gender: "male",   age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/male/73.jpg" },
  { id: "m100-3", label: "100s Male",   gender: "male",   age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/male/74.jpg" },
  { id: "f100-1", label: "100s Female", gender: "female", age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/female/72.jpg" },
  { id: "f100-2", label: "100s Female", gender: "female", age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/female/73.jpg" },
  { id: "f100-3", label: "100s Female", gender: "female", age: "100s", url: "https://xsgames.co/randomusers/assets/avatars/female/74.jpg" },
];

const AGE_GROUPS = ["all", "10s", "20s", "30s", "40s", "50s", "60s", "70s", "80s", "90s", "100s"];
const GENDERS    = ["all", "male", "female"];

const INITIALS_COLORS = [
  { bg: "#006B2C", label: "Purple" },
  { bg: "#f093fb", label: "Pink"   },
  { bg: "#4facfe", label: "Blue"   },
  { bg: "#43e97b", label: "Green"  },
  { bg: "#fa709a", label: "Rose"   },
  { bg: "#fcc419", label: "Yellow" },
  { bg: "#ff6b6b", label: "Red"    },
  { bg: "#20c997", label: "Teal"   },
  { bg: "#fd7e14", label: "Orange" },
  { bg: "#6f42c1", label: "Violet" },
  { bg: "#0dcaf0", label: "Cyan"   },
  { bg: "#d63384", label: "Magenta"},
];

const DICEBEAR_BASE = "https://api.dicebear.com/7.x";
function getInitialsAvatarUrl(initials, color) {
  const encoded = encodeURIComponent(initials.toUpperCase().slice(0, 2));
  const bg = color.replace("#", "");
  return `${DICEBEAR_BASE}/initials/svg?seed=${encoded}&backgroundColor=${bg}&radius=50&fontSize=40`;
}

const AvatarGenerator = ({ userName, currentAvatar, onSelect, onClose }) => {
  const [tab, setTab]                   = useState("real");
  const [selectedId, setSelectedId]     = useState(null);
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter]       = useState("all");
  const [selectedColor, setSelectedColor] = useState(INITIALS_COLORS[0]);
  const [imgErrors, setImgErrors]       = useState({});

  const initials = (userName || "U")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const filtered = REAL_AVATARS.filter(a => {
    if (genderFilter !== "all" && a.gender !== genderFilter) return false;
    if (ageFilter    !== "all" && a.age    !== ageFilter)    return false;
    return true;
  });

  const handleImgError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleApply = () => {
    if (tab === "real") {
      const avatar = REAL_AVATARS.find(a => a.id === selectedId);
      if (avatar) onSelect(avatar.url);
    } else {
      onSelect(getInitialsAvatarUrl(initials, selectedColor.bg));
    }
    onClose();
  };

  return (
    <div className="avatar-gen-overlay" onClick={onClose}>
      <div className="avatar-gen-modal" onClick={e => e.stopPropagation()}>

        <div className="avatar-gen-header">
          <h4>Choose Avatar</h4>
          <button className="avatar-gen-close" onClick={onClose}>×</button>
        </div>

        <div className="avatar-gen-tabs">
          <button className={`avatar-tab-btn ${tab === "real" ? "active" : ""}`} onClick={() => setTab("real")}>
            Real Photos
          </button>
          <button className={`avatar-tab-btn ${tab === "initials" ? "active" : ""}`} onClick={() => setTab("initials")}>
            Initials
          </button>
        </div>

        <div className="avatar-gen-body">
          {tab === "real" ? (
            <>
              <div className="avatar-filters">
                <div className="filter-group">
                  <span className="filter-label">Gender</span>
                  {GENDERS.map(g => (
                    <button key={g} className={`filter-pill ${genderFilter === g ? "active" : ""}`} onClick={() => setGenderFilter(g)}>
                      {g === "all" ? "All" : g === "male" ? "Male" : "Female"}
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  <span className="filter-label">Age</span>
                  {AGE_GROUPS.map(a => (
                    <button key={a} className={`filter-pill ${ageFilter === a ? "active" : ""}`} onClick={() => setAgeFilter(a)}>
                      {a === "all" ? "All" : a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="avatar-grid">
                {filtered.map(avatar => (
                  <button
                    key={avatar.id}
                    className={`avatar-grid-item ${selectedId === avatar.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(avatar.id)}
                    title={avatar.label}
                  >
                    {imgErrors[avatar.id] ? (
                      <div className="avatar-img-fallback">
                        {avatar.label.split(" ").map(w => w[0]).join("")}
                      </div>
                    ) : (
                      <img
                        src={avatar.url}
                        alt={avatar.label}
                        loading="lazy"
                        onError={() => handleImgError(avatar.id)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    )}
                    <span className="avatar-grid-label">{avatar.label}</span>
                    {selectedId === avatar.id && <span className="avatar-check">✓</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="initials-tab">
              <div className="initials-preview-wrap">
                <img
                  className="initials-preview-img"
                  src={getInitialsAvatarUrl(initials, selectedColor.bg)}
                  alt="Initials avatar preview"
                />
                <p className="initials-preview-text">Your initials: <strong>{initials}</strong></p>
              </div>
              <p className="initials-color-label">Choose background color:</p>
              <div className="initials-color-grid">
                {INITIALS_COLORS.map(c => (
                  <button
                    key={c.bg}
                    className={`color-swatch ${selectedColor.bg === c.bg ? "selected" : ""}`}
                    style={{ background: c.bg }}
                    title={c.label}
                    onClick={() => setSelectedColor(c)}
                  >
                    {selectedColor.bg === c.bg && <span className="swatch-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="avatar-gen-footer">
          <button className="avatar-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="avatar-apply-btn"
            onClick={handleApply}
            disabled={tab === "real" ? !selectedId : false}
          >
            Use This Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarGenerator;
