import React, { useState, useMemo, useRef, useCallback } from "react";
import "./AvatarBuilder.css";

// ─── DiceBear v7 avataaars — verified correct params from schema.json ─────────
// All option params are passed as repeated query params: key[]=value
// Probability params control visibility: 0 = hidden, 100 = always shown
const BASE = "https://api.dicebear.com/7.x/avataaars/svg";

// Correct skin color hex values (from DiceBear schema defaults)
const SKIN_COLORS = [
  { id: "ffdbb4", label: "Very Fair" },
  { id: "edb98a", label: "Fair" },
  { id: "fd9841", label: "Light" },
  { id: "d08b5b", label: "Medium" },
  { id: "ae5d29", label: "Tan" },
  { id: "614335", label: "Dark" },
];

// Correct top/hair values (from DiceBear schema)
const HAIR_STYLES = [
  { id: "shortFlat",           label: "Short Flat" },
  { id: "shortRound",          label: "Short Round" },
  { id: "shortCurly",          label: "Short Curly" },
  { id: "shortWaved",          label: "Short Waved" },
  { id: "sides",               label: "Sides" },
  { id: "theCaesar",           label: "Caesar" },
  { id: "theCaesarAndSidePart",label: "Caesar Side" },
  { id: "shaggy",              label: "Shaggy" },
  { id: "shaggyMullet",        label: "Mullet" },
  { id: "dreads01",            label: "Dreads" },
  { id: "frizzle",             label: "Frizzle" },
  { id: "bob",                 label: "Bob" },
  { id: "bun",                 label: "Bun" },
  { id: "curly",               label: "Curly Long" },
  { id: "curvy",               label: "Curvy" },
  { id: "dreads",              label: "Long Dreads" },
  { id: "frida",               label: "Frida" },
  { id: "fro",                 label: "Fro" },
  { id: "froBand",             label: "Fro Band" },
  { id: "longButNotTooLong",   label: "Long" },
  { id: "miaWallace",          label: "Mia" },
  { id: "straight01",          label: "Straight" },
  { id: "straight02",          label: "Straight 2" },
  { id: "straightAndStrand",   label: "Straight Strand" },
  { id: "shavedSides",         label: "Shaved Sides" },
  { id: "bigHair",             label: "Big Hair" },
  { id: "hat",                 label: "Hat" },
  { id: "hijab",               label: "Hijab" },
  { id: "turban",              label: "Turban" },
  { id: "winterHat1",          label: "Beanie" },
];

const HAIR_COLORS = [
  { id: "2c1b18", label: "Black" },
  { id: "4a312c", label: "Dark Brown" },
  { id: "724133", label: "Brown" },
  { id: "a55728", label: "Auburn" },
  { id: "b58143", label: "Blonde" },
  { id: "d6b370", label: "Light Blonde" },
  { id: "e8e1e1", label: "Silver" },
  { id: "ecdcbf", label: "White" },
  { id: "c93305", label: "Red" },
  { id: "f59797", label: "Pink" },
];

// Correct eyes values from schema
const EYES = [
  { id: "default",   label: "Normal" },
  { id: "happy",     label: "Happy" },
  { id: "wink",      label: "Wink" },
  { id: "hearts",    label: "Hearts" },
  { id: "side",      label: "Side" },
  { id: "squint",    label: "Squint" },
  { id: "surprised", label: "Surprised" },
  { id: "closed",    label: "Closed" },
  { id: "cry",       label: "Teary" },
  { id: "xDizzy",    label: "Dizzy" },
];

// Correct eyebrows values from schema
const EYEBROWS = [
  { id: "defaultNatural",       label: "Natural" },
  { id: "default",              label: "Default" },
  { id: "angryNatural",         label: "Angry" },
  { id: "flatNatural",          label: "Flat" },
  { id: "raisedExcitedNatural", label: "Raised" },
  { id: "sadConcernedNatural",  label: "Sad" },
  { id: "unibrowNatural",       label: "Unibrow" },
  { id: "upDownNatural",        label: "Up-Down" },
];

// Correct mouth values from schema
const MOUTH = [
  { id: "smile",     label: "Smile" },
  { id: "default",   label: "Neutral" },
  { id: "serious",   label: "Serious" },
  { id: "twinkle",   label: "Twinkle" },
  { id: "tongue",    label: "Tongue" },
  { id: "sad",       label: "Sad" },
  { id: "grimace",   label: "Grimace" },
];

// Correct facialHair values from schema (beardMajestic NOT beardMagestic)
const FACIAL_HAIR = [
  { id: "none",           label: "None" },
  { id: "beardLight",     label: "Light Beard" },
  { id: "beardMajestic",  label: "Full Beard" },
  { id: "beardMedium",    label: "Medium Beard" },
  { id: "moustacheFancy", label: "Moustache" },
  { id: "moustacheMagnum",label: "Magnum" },
];

const FACIAL_HAIR_COLORS = [
  { id: "2c1b18", label: "Black" },
  { id: "4a312c", label: "Dark Brown" },
  { id: "724133", label: "Brown" },
  { id: "b58143", label: "Blonde" },
  { id: "e8e1e1", label: "Silver" },
  { id: "c93305", label: "Red" },
];

// Correct accessories from schema
const ACCESSORIES = [
  { id: "none",          label: "None" },
  { id: "kurt",          label: "Round" },
  { id: "prescription01",label: "Glasses 1" },
  { id: "prescription02",label: "Glasses 2" },
  { id: "round",         label: "Circle" },
  { id: "sunglasses",    label: "Sunglasses" },
  { id: "wayfarers",     label: "Wayfarers" },
];

// Correct clothing values from schema
const CLOTHING = [
  { id: "blazerAndShirt",   label: "Blazer + Shirt" },
  { id: "blazerAndSweater", label: "Blazer + Sweater" },
  { id: "collarAndSweater", label: "Collar Sweater" },
  { id: "graphicShirt",     label: "Graphic Shirt" },
  { id: "hoodie",           label: "Hoodie" },
  { id: "overall",          label: "Overall" },
  { id: "shirtCrewNeck",    label: "Crew Neck" },
  { id: "shirtScoopNeck",   label: "Scoop Neck" },
  { id: "shirtVNeck",       label: "V-Neck" },
];

const CLOTHES_COLORS = [
  { id: "3c4f5c", label: "Dark Blue" },
  { id: "262e33", label: "Black" },
  { id: "65c9ff", label: "Sky Blue" },
  { id: "5199e4", label: "Blue" },
  { id: "25557c", label: "Navy" },
  { id: "e6e6e6", label: "White" },
  { id: "929598", label: "Grey" },
  { id: "a7ffc4", label: "Mint" },
  { id: "ffdeb5", label: "Peach" },
  { id: "ff5c5c", label: "Red" },
  { id: "ffafb9", label: "Pink" },
  { id: "ffffb1", label: "Yellow" },
];

const TABS = [
  { id: "skin",    label: "Skin",    icon: "🎨" },
  { id: "hair",    label: "Hair",    icon: "💇" },
  { id: "eyes",    label: "Eyes",    icon: "👁️" },
  { id: "mouth",   label: "Mouth",   icon: "😊" },
  { id: "facial",  label: "Beard",   icon: "🧔" },
  { id: "extras",  label: "Extras",  icon: "👓" },
  { id: "clothes", label: "Outfit",  icon: "👕" },
];

const DEFAULT = {
  skinColor:       "edb98a",
  top:             "shortFlat",
  hairColor:       "2c1b18",
  eyes:            "default",
  eyebrows:        "defaultNatural",
  mouth:           "smile",
  facialHair:      "none",
  facialHairColor: "2c1b18",
  accessories:     "none",
  clothing:        "shirtCrewNeck",
  clothesColor:    "3c4f5c",
};

// ─── Build correct DiceBear URL ──────────────────────────────────────────────
function buildUrl(opts) {
  const params = [
    `seed=avatar-${opts.skinColor}`,
    `skinColor[]=${opts.skinColor}`,
    `top[]=${opts.top}`,
    `hairColor[]=${opts.hairColor}`,
    `eyes[]=${opts.eyes}`,
    `eyebrows[]=${opts.eyebrows}`,
    `mouth[]=${opts.mouth}`,
    `clothing[]=${opts.clothing}`,
    `clothesColor[]=${opts.clothesColor}`,
    `radius=50`,
    `backgroundColor[]=b6e3f4`,
    // facialHair: use probability 0 to hide, 100 to show
    opts.facialHair === "none"
      ? `facialHairProbability=0`
      : `facialHair[]=${opts.facialHair}&facialHairColor[]=${opts.facialHairColor}&facialHairProbability=100`,
    // accessories: same pattern
    opts.accessories === "none"
      ? `accessoriesProbability=0`
      : `accessories[]=${opts.accessories}&accessoriesProbability=100`,
  ];
  return `${BASE}?${params.join("&")}`;
}

// ─── Analyze photo pixels to detect skin tone ────────────────────────────────
function analyzePhoto(imageElement) {
  const canvas = document.createElement("canvas");
  // Sample a center crop (face area)
  const size = Math.min(imageElement.naturalWidth, imageElement.naturalHeight, 200);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const sx = (imageElement.naturalWidth - size) / 2;
  const sy = (imageElement.naturalHeight - size) / 2;
  ctx.drawImage(imageElement, sx, sy, size, size, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  let r = 0, g = 0, b = 0, count = 0;

  // Sample every 8th pixel for speed
  for (let i = 0; i < data.length; i += 32) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2], pa = data[i + 3];
    if (pa < 128) continue; // skip transparent
    // Only count skin-ish pixels (high red, moderate green, low blue relative to red)
    if (pr > 60 && pg > 40 && pb > 20 && pr > pb && pr - pb > 15) {
      r += pr; g += pg; b += pb; count++;
    }
  }

  if (count === 0) return { skinColor: "edb98a" }; // fallback

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  // Map average skin RGB to closest DiceBear skin tone
  const skinTones = [
    { id: "ffdbb4", r: 255, g: 219, b: 180 },
    { id: "edb98a", r: 237, g: 185, b: 138 },
    { id: "fd9841", r: 253, g: 152, b:  65 },
    { id: "d08b5b", r: 208, g: 139, b:  91 },
    { id: "ae5d29", r: 174, g:  93, b:  41 },
    { id: "614335", r:  97, g:  67, b:  53 },
  ];

  let best = skinTones[0], bestDist = Infinity;
  for (const tone of skinTones) {
    const dist = Math.sqrt(
      Math.pow(r - tone.r, 2) +
      Math.pow(g - tone.g, 2) +
      Math.pow(b - tone.b, 2)
    );
    if (dist < bestDist) { bestDist = dist; best = tone; }
  }

  // Detect approximate hair darkness from top portion of image
  const topData = ctx.getImageData(size * 0.2, 0, size * 0.6, size * 0.25).data;
  let darkness = 0, darkCount = 0;
  for (let i = 0; i < topData.length; i += 16) {
    const pr = topData[i], pg = topData[i+1], pb = topData[i+2];
    darkness += (pr + pg + pb) / 3;
    darkCount++;
  }
  const avgBrightness = darkCount > 0 ? darkness / darkCount : 128;

  let hairColor = "2c1b18"; // default black
  if (avgBrightness > 200)       hairColor = "ecdcbf"; // very light = white/blonde
  else if (avgBrightness > 160)  hairColor = "d6b370"; // light blonde
  else if (avgBrightness > 120)  hairColor = "b58143"; // blonde
  else if (avgBrightness > 80)   hairColor = "724133"; // brown
  else if (avgBrightness > 50)   hairColor = "4a312c"; // dark brown
  else                           hairColor = "2c1b18"; // black

  return { skinColor: best.id, hairColor };
}

// ─── Component ───────────────────────────────────────────────────────────────
const AvatarBuilder = ({ userName, onSelect, onClose }) => {
  const [opts, setOpts]             = useState({ ...DEFAULT });
  const [activeTab, setActiveTab]   = useState("skin");
  const [phase, setPhase]           = useState("capture"); // "capture" | "result"
  const [analyzing, setAnalyzing]   = useState(false);
  const [capturedSrc, setCapturedSrc] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const imgRef    = useRef(null);

  const set = (key, val) => setOpts(prev => ({ ...prev, [key]: val }));
  const avatarUrl = useMemo(() => buildUrl(opts), [opts]);

  // ── Camera ──────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      // Wait for video element to be in DOM, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
        }
      }, 50);
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permission and try again.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const runAnalysis = (src) => {
    setAnalyzing(true);
    const img = new Image();
    img.onload = () => {
      const { skinColor, hairColor } = analyzePhoto(img);
      setOpts(prev => ({
        ...prev,
        skinColor,
        hairColor: hairColor || prev.hairColor,
      }));
      setAnalyzing(false);
      setPhase("result");
    };
    img.onerror = () => {
      setAnalyzing(false);
      setPhase("result");
    };
    img.src = src;
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth  || 640;
    const h = v.videoHeight || 480;
    c.width  = w;
    c.height = h;
    const ctx = c.getContext("2d");
    // Mirror the canvas to match mirrored preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setCapturedSrc(dataUrl);
    runAnalysis(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      setCapturedSrc(src);
      runAnalysis(src);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedSrc(null);
    setPhase("capture");
    setOpts({ ...DEFAULT });
  };

  const handleUse = () => {
    onSelect(avatarUrl);
    stopCamera();
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // ── Pill + Swatch helpers ────────────────────────────────────
  const Pill = ({ label, selected, onClick }) => (
    <button className={`ab-option-pill ${selected ? "selected" : ""}`} onClick={onClick}>
      {label}
    </button>
  );

  const Swatch = ({ color, selected, onClick, size = 30 }) => (
    <button
      className={`ab-swatch ${selected ? "selected" : ""}`}
      style={{ background: `#${color}`, width: size, height: size }}
      onClick={onClick}
    >
      {selected && <span className="ab-swatch-check">✓</span>}
    </button>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="ab-overlay" onClick={handleClose}>
      <div className={`ab-modal ${cameraActive ? "camera-active" : ""}`} onClick={e => e.stopPropagation()}>

        <div className="ab-header">
          <h4>{phase === "capture" && !cameraActive ? "Take Your Photo" : phase === "capture" && cameraActive ? "Take Selfie" : "Your AI Avatar"}</h4>
          <button className="ab-close" onClick={handleClose}>×</button>
        </div>

        {/* ── Phase 1: Capture ── */}
        {phase === "capture" && (
          <div className="ab-capture-phase">
            {!cameraActive && !capturedSrc && (
              <div className="ab-capture-intro">
                <div className="ab-capture-icon">📸</div>
                <p className="ab-capture-title">Create your AI Avatar</p>
                <p className="ab-capture-desc">
                  Take a selfie or upload a photo — we'll analyze your skin tone
                  and hair color to build a matching cartoon avatar instantly.
                </p>
                {cameraError && <p className="ab-error">{cameraError}</p>}
                <div className="ab-capture-btns">
                  <button className="ab-camera-btn" onClick={startCamera}>
                    📷 Open Camera
                  </button>
                  <label className="ab-upload-btn">
                    🖼️ Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                  </label>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="ab-camera-wrap">
                <video ref={videoRef} className="ab-video" autoPlay playsInline muted />
                <canvas ref={canvasRef} hidden />
                <div className="ab-camera-overlay">
                  <div className="ab-face-guide" />
                  <p className="ab-guide-text">Position your face in the circle</p>
                </div>
                <div className="ab-camera-actions">
                  <button className="ab-shutter" onClick={capturePhoto}>⬤</button>
                  <button className="ab-cam-cancel" onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            )}

            {analyzing && (
              <div className="ab-analyzing">
                <div className="ab-spinner" />
                <p>Analyzing your photo...</p>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: Result + Editor ── */}
        {phase === "result" && (
          <>
            <div className="ab-result-top">
              {capturedSrc && (
                <div className="ab-photo-thumb-wrap">
                  <img src={capturedSrc} alt="Your photo" className="ab-photo-thumb" ref={imgRef} />
                  <div className="ab-arrow">→</div>
                </div>
              )}
              <div className="ab-preview-ring">
                <img key={avatarUrl} src={avatarUrl} alt="Avatar" className="ab-preview-img" />
              </div>
            </div>
            <p className="ab-result-hint">Avatar matched to your photo. Fine-tune below ↓</p>

            {/* Tabs */}
            <div className="ab-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`ab-tab ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <span className="ab-tab-icon">{t.icon}</span>
                  <span className="ab-tab-label">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="ab-panel">

              {activeTab === "skin" && (
                <div className="ab-section">
                  <p className="ab-section-title">Skin Tone</p>
                  <div className="ab-swatches">
                    {SKIN_COLORS.map(c => (
                      <Swatch key={c.id} color={c.id} size={36} selected={opts.skinColor === c.id} onClick={() => set("skinColor", c.id)} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "hair" && (
                <>
                  <div className="ab-section">
                    <p className="ab-section-title">Hair Style</p>
                    <div className="ab-pills">
                      {HAIR_STYLES.map(o => (
                        <Pill key={o.id} label={o.label} selected={opts.top === o.id} onClick={() => set("top", o.id)} />
                      ))}
                    </div>
                  </div>
                  <div className="ab-section">
                    <p className="ab-section-title">Hair Color</p>
                    <div className="ab-swatches">
                      {HAIR_COLORS.map(c => (
                        <Swatch key={c.id} color={c.id} selected={opts.hairColor === c.id} onClick={() => set("hairColor", c.id)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "eyes" && (
                <>
                  <div className="ab-section">
                    <p className="ab-section-title">Eye Style</p>
                    <div className="ab-pills">
                      {EYES.map(o => (
                        <Pill key={o.id} label={o.label} selected={opts.eyes === o.id} onClick={() => set("eyes", o.id)} />
                      ))}
                    </div>
                  </div>
                  <div className="ab-section">
                    <p className="ab-section-title">Eyebrows</p>
                    <div className="ab-pills">
                      {EYEBROWS.map(o => (
                        <Pill key={o.id} label={o.label} selected={opts.eyebrows === o.id} onClick={() => set("eyebrows", o.id)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "mouth" && (
                <div className="ab-section">
                  <p className="ab-section-title">Mouth</p>
                  <div className="ab-pills">
                    {MOUTH.map(o => (
                      <Pill key={o.id} label={o.label} selected={opts.mouth === o.id} onClick={() => set("mouth", o.id)} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "facial" && (
                <>
                  <div className="ab-section">
                    <p className="ab-section-title">Facial Hair</p>
                    <div className="ab-pills">
                      {FACIAL_HAIR.map(o => (
                        <Pill key={o.id} label={o.label} selected={opts.facialHair === o.id} onClick={() => set("facialHair", o.id)} />
                      ))}
                    </div>
                  </div>
                  {opts.facialHair !== "none" && (
                    <div className="ab-section">
                      <p className="ab-section-title">Beard Color</p>
                      <div className="ab-swatches">
                        {FACIAL_HAIR_COLORS.map(c => (
                          <Swatch key={c.id} color={c.id} selected={opts.facialHairColor === c.id} onClick={() => set("facialHairColor", c.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "extras" && (
                <div className="ab-section">
                  <p className="ab-section-title">Accessories</p>
                  <div className="ab-pills">
                    {ACCESSORIES.map(o => (
                      <Pill key={o.id} label={o.label} selected={opts.accessories === o.id} onClick={() => set("accessories", o.id)} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "clothes" && (
                <>
                  <div className="ab-section">
                    <p className="ab-section-title">Outfit</p>
                    <div className="ab-pills">
                      {CLOTHING.map(o => (
                        <Pill key={o.id} label={o.label} selected={opts.clothing === o.id} onClick={() => set("clothing", o.id)} />
                      ))}
                    </div>
                  </div>
                  <div className="ab-section">
                    <p className="ab-section-title">Outfit Color</p>
                    <div className="ab-swatches">
                      {CLOTHES_COLORS.map(c => (
                        <Swatch key={c.id} color={c.id} selected={opts.clothesColor === c.id} onClick={() => set("clothesColor", c.id)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer */}
            <div className="ab-footer">
              <button className="ab-reset-btn" onClick={handleRetake}>↩ Retake</button>
              <button className="ab-cancel-btn" onClick={handleClose}>Cancel</button>
              <button className="ab-use-btn" onClick={handleUse}>✨ Use Avatar</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AvatarBuilder;
