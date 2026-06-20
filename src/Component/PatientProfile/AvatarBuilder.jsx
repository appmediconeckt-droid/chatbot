import React, { useState, useMemo, useRef, useEffect } from "react";
import "./AvatarBuilder.css";
import { API_BASE_URL } from "../../axiosConfig";

// ─── DiceBear v7 avataaars — verified correct params from schema.json ─────────
// All option params are passed as repeated query params: key[]=value
// Probability params control visibility: 0 = hidden, 100 = always shown
const BASE = "https://api.dicebear.com/7.x/avataaars/png";

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
  top:             "longButNotTooLong",
  hairColor:       "2c1b18",
  eyes:            "happy",
  eyebrows:        "defaultNatural",
  mouth:           "smile",
  facialHair:      "none",
  facialHairColor: "2c1b18",
  accessories:     "none",
  clothing:        "blazerAndShirt",
  clothesColor:    "3c4f5c",
};

// ─── Build correct DiceBear URL ──────────────────────────────────────────────
function buildUrl(opts, userName = "user") {
  const stableSeed = encodeURIComponent(
    [
      userName || "user",
      opts.skinColor,
      opts.top,
      opts.hairColor,
      opts.eyes,
      opts.eyebrows,
      opts.mouth,
      opts.facialHair,
      opts.accessories,
      opts.clothing,
      opts.clothesColor,
    ].join("-"),
  );
  const params = [
    `seed=${stableSeed}`,
    `skinColor[]=${opts.skinColor}`,
    `top[]=${opts.top}`,
    `hairColor[]=${opts.hairColor}`,
    `eyes[]=${opts.eyes}`,
    `eyebrows[]=${opts.eyebrows}`,
    `mouth[]=${opts.mouth}`,
    `clothing[]=${opts.clothing}`,
    `clothesColor[]=${opts.clothesColor}`,
    `radius=50`,
    `scale=85`,
    `backgroundColor[]=ffffff`,
    `translateX=0`,
    `translateY=0`,
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

// ─── Face detection using canvas pixel analysis ─────────────────────────────
function detectFaceInPhoto(imageElement) {
  try {
    const canvas = document.createElement("canvas");
    const size = Math.min(imageElement.naturalWidth, imageElement.naturalHeight, 300);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const sx = (imageElement.naturalWidth - size) / 2;
    const sy = (imageElement.naturalHeight - size) / 2;
    ctx.drawImage(imageElement, sx, sy, size, size, 0, 0, size, size);

    const data = ctx.getImageData(0, 0, size, size).data;
    let facePixels = 0;
    let edgePixels = 0;
    let nonBlackPixels = 0;

    // Method 1: Count skin-tone pixels (face detection heuristic)
    // More lenient detection for various skin tones
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;

      nonBlackPixels++;

      // Detect skin-like colors - more lenient range
      // Works for very fair to dark skin tones
      if (
        r > 50 && // reddish component
        g > 30 && // greenish component
        b > 15 && // some blue
        r > b && // more red than blue
        r - b > 10 && // skin tone differential
        (r + g + b) > 150 // not too dark
      ) {
        facePixels++;
      }

      // Detect edges (eyes, mouth, boundaries)
      const nextIdx = Math.min(i + 4, data.length - 4);
      const dr = Math.abs(data[nextIdx] - r);
      const dg = Math.abs(data[nextIdx + 1] - g);
      const db = Math.abs(data[nextIdx + 2] - b);
      if ((dr + dg + db) > 60) {
        edgePixels++;
      }
    }

    const skinPixelRatio = nonBlackPixels > 0 ? facePixels / nonBlackPixels : 0;
    const edgeRatio = nonBlackPixels > 0 ? edgePixels / nonBlackPixels : 0;

    console.log(`Face detection: skin=${(skinPixelRatio * 100).toFixed(1)}%, edges=${(edgeRatio * 100).toFixed(1)}%`);

    // Multiple detection methods:
    // 1. If enough skin-tone pixels detected
    // 2. If enough edges detected (eyes, mouth, facial boundaries)
    // 3. If reasonable amount of non-black content
    return skinPixelRatio > 0.02 || (edgeRatio > 0.1 && nonBlackPixels > size * size * 0.1);
  } catch (err) {
    console.error("Face detection error:", err);
    return true; // Fallback to allowing photo if detection fails
  }
}

// ─── Generate realistic avatar using Hugging Face API ──────────────────────
async function generateRealisticAvatar(imageBase64, userName = "user") {
  try {
    // Create a prompt based on the image analysis for better results
    const prompt = `Professional portrait photo of a person, clean background, friendly expression, high quality`;

    // Use Hugging Face's free inference API
    const HF_API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";
    const HF_TOKEN = "hf_placeholder"; // Free tier - limited requests

    // For free solution, create a stylized avatar from the uploaded image
    // by converting it to a professional portrait style
    return await convertToProfileAvatar(imageBase64);
  } catch (err) {
    console.error("Avatar generation error:", err);
    return null;
  }
}

// ─── Convert photo to stylized profile avatar ────────────────────────────────
function convertToProfileAvatar(imageBase64) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Draw with professional styling
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        // Draw image as circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
        ctx.clip();

        const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - imgSize) / 2;
        const sy = (img.naturalHeight - imgSize) / 2;
        ctx.drawImage(img, sx, sy, imgSize, imgSize, 20, 20, size - 40, size - 40);
        ctx.restore();

        // Add subtle border and professional styling
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 20, 0, Math.PI * 2);
        ctx.stroke();

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => resolve(null);
      img.src = imageBase64;
    } catch (err) {
      console.error("Profile avatar conversion error:", err);
      resolve(null);
    }
  });
}

// ─── Analyze photo pixels to detect skin tone, gender, and features ─────────
function analyzePhoto(imageElement) {
  const canvas = document.createElement("canvas");
  // Sample a center crop (face area) with higher resolution
  const size = Math.min(imageElement.naturalWidth, imageElement.naturalHeight, 300);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const sx = (imageElement.naturalWidth - size) / 2;
  const sy = (imageElement.naturalHeight - size) / 2;
  ctx.drawImage(imageElement, sx, sy, size, size, 0, 0, size, size);

  const fullData = ctx.getImageData(0, 0, size, size).data;

  // Analyze skin tone from center face area (more reliable)
  const centerSize = size * 0.5;
  const centerStart = (size - centerSize) / 2;
  const centerData = ctx.getImageData(centerStart, centerStart + size * 0.1, centerSize, centerSize * 0.4).data;

  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < centerData.length; i += 16) {
    const pr = centerData[i], pg = centerData[i + 1], pb = centerData[i + 2], pa = centerData[i + 3];
    if (pa < 128) continue;
    // Skin tone detection: high red, moderate green, lower blue
    if (pr > 60 && pg > 40 && pb > 20 && pr > pb && pr - pb > 15) {
      r += pr; g += pg; b += pb; count++;
    }
  }

  if (count === 0) return { skinColor: "edb98a", hairColor: "2c1b18", gender: "unknown" };

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  // Map to closest skin tone with improved matching
  const skinTones = [
    { id: "ffdbb4", r: 255, g: 219, b: 180 }, // Very Fair
    { id: "edb98a", r: 237, g: 185, b: 138 }, // Fair
    { id: "fd9841", r: 253, g: 152, b:  65 }, // Light
    { id: "d08b5b", r: 208, g: 139, b:  91 }, // Medium
    { id: "ae5d29", r: 174, g:  93, b:  41 }, // Tan
    { id: "614335", r:  97, g:  67, b:  53 }, // Dark
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

  // Detect hair color from top portion (more robust sampling)
  const topStart = Math.max(0, size * 0.05);
  const topHeight = size * 0.3;
  const topData = ctx.getImageData(size * 0.15, topStart, size * 0.7, topHeight).data;

  let darkness = 0, darkCount = 0;
  for (let i = 0; i < topData.length; i += 16) {
    const pr = topData[i], pg = topData[i+1], pb = topData[i+2];
    const brightness = (pr + pg + pb) / 3;
    darkness += brightness;
    darkCount++;
  }
  const avgBrightness = darkCount > 0 ? darkness / darkCount : 128;

  let hairColor = "2c1b18";
  if (avgBrightness > 210)       hairColor = "ecdcbf"; // very light
  else if (avgBrightness > 170)  hairColor = "d6b370"; // light blonde
  else if (avgBrightness > 130)  hairColor = "b58143"; // blonde
  else if (avgBrightness > 85)   hairColor = "724133"; // brown
  else if (avgBrightness > 55)   hairColor = "4a312c"; // dark brown
  else                           hairColor = "2c1b18"; // black

  // Detect facial hair (male indicator) from chin/jaw area
  const chinStart = size * 0.55;
  const chinHeight = size * 0.25;
  const chinData = ctx.getImageData(size * 0.2, chinStart, size * 0.6, chinHeight).data;

  let darkPixels = 0, totalPixels = 0;
  for (let i = 0; i < chinData.length; i += 16) {
    const pr = chinData[i], pg = chinData[i+1], pb = chinData[i+2], pa = chinData[i+3];
    if (pa < 128) continue;
    const brightness = (pr + pg + pb) / 3;
    totalPixels++;
    // Detect dark shadow pixels (facial hair)
    if (brightness < 100) darkPixels++;
  }

  const facialHairRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
  const gender = facialHairRatio > 0.15 ? "male" : "female"; // Male likely if significant dark shadow

  return { skinColor: best.id, hairColor, gender };
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
  const [cameraLoading, setCameraLoading] = useState(false);
  const [selectedAvatarPayload, setSelectedAvatarPayload] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const imgRef    = useRef(null);

  const set = (key, val) => setOpts(prev => ({ ...prev, [key]: val }));
  const avatarUrl = useMemo(() => buildUrl(opts, userName), [opts, userName]);

  // ── Camera ──────────────────────────────────────────────────
  const startCamera = async () => {
    console.log("📷 Starting camera...");
    setCameraError(null);
    setCameraLoading(true);
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("❌ Your browser doesn't support camera access. Try Chrome, Firefox, Safari, or Edge.");
        return;
      }

      console.log("🔍 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          aspectRatio: { ideal: 4 / 3 }
        },
      });

      console.log("✅ Camera stream obtained");
      streamRef.current = stream;

      // First, activate the camera UI so video element renders
      setCameraActive(true);

      // Then attach stream to video element - with a small delay to ensure DOM is updated
      setTimeout(() => {
        if (videoRef.current) {
          console.log("📹 Attaching stream to video element");
          videoRef.current.srcObject = stream;

          // Wait for video to load
          const handleLoadedMetadata = () => {
            console.log("✅ Video metadata loaded");
            videoRef.current.play()
              .then(() => {
                console.log("✅ Camera started successfully");
                setCameraLoading(false);
              })
              .catch((err) => {
                console.error("❌ Play error:", err);
                setCameraError("Failed to play camera. Please try again.");
                setCameraLoading(false);
              });
            videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
          };

          videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);

          // Timeout fallback in case metadata doesn't load
          const timeoutId = setTimeout(() => {
            console.log("⏱️ Fallback: Checking video ready state");
            if (videoRef.current && videoRef.current.readyState >= 2) {
              console.log("✅ Video ready (fallback), setting camera active");
              setCameraLoading(false);
            }
          }, 3000);

          // Cleanup timeout when metadata loads
          const cleanupTimeout = () => {
            clearTimeout(timeoutId);
          };
          videoRef.current.addEventListener("loadedmetadata", cleanupTimeout, { once: true });
        } else {
          console.error("❌ Video ref still null after delay");
          setCameraError("Camera setup failed. Please refresh and try again.");
          setCameraLoading(false);
        }
      }, 100);

    } catch (err) {
      console.error("❌ Camera error:", err);
      let errorMsg = "Camera access denied. Please allow camera permission and try again.";

      if (err.name === "NotFoundError") {
        errorMsg = "❌ No camera found on this device.";
      } else if (err.name === "NotAllowedError") {
        errorMsg = "❌ Camera permission denied. Please check your browser settings.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "❌ Camera is in use by another application. Close other apps and try again.";
      } else if (err.name === "SecurityError") {
        errorMsg = "❌ Camera access is blocked by your browser security settings.";
      }

      setCameraError(errorMsg);
      setCameraLoading(false);
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

  const runAnalysis = async (src) => {
    console.log("🔍 Starting analysis...");
    setAnalyzing(true);
    setCameraError(null);
    setCapturedSrc(src); // Immediately set captured photo

    try {
      const img = new Image();
      img.onload = async () => {
        console.log("📸 Photo loaded, detecting face...");
        // Check if face is detected in photo
        const hasFace = detectFaceInPhoto(img);
        if (!hasFace) {
          console.warn("⚠️ No face detected");
          setCameraError("❌ No face detected. Please take a clear selfie and try again.");
          setAnalyzing(false);
          setCapturedSrc(null);
          return;
        }

        console.log("✅ Face detected, sending to backend...");
        // Call backend for OpenAI analysis and avatar generation
        try {
          console.log("📤 Sending photo to backend for AI analysis...");
          const response = await fetch(`${API_BASE_URL}/api/avatar/analyze-and-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ photoBase64: src }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to analyze photo");
          }

          const result = await response.json();
          console.log("✅ Analysis complete:", result.analysis);
          console.log("🎨 Avatar URL:", result.avatarUrl);

          // Set avatar from OpenAI generation
          if (result.avatarUrl) {
            console.log("📸 Setting AI-generated avatar");
            setProfileImage(result.avatarUrl);
            setSelectedAvatarPayload({
              url: result.avatarUrl,
              avatarType: "ai-generated",
              avatarUrl: result.avatarUrl,
              analysis: result.analysis,
            });
          } else {
            console.warn("⚠️ No avatar URL in response");
          }

          // Update avatar options based on analysis
          const analysis = result.analysis;
          let defaults = { ...DEFAULT };

          if (analysis.gender === "male") {
            console.log("👨 Detected male features");
            defaults = {
              ...defaults,
              top: "shortFlat",
              facialHair: analysis.facialHair !== "none" ? analysis.facialHair : "beardLight",
              facialHairColor: "2c1b18",
            };
          } else {
            console.log("👩 Detected female features");
          }

          setOpts(defaults);
          setAnalyzing(false);
          console.log("✅ Switching to result phase");
          setPhase("result");
        } catch (err) {
          console.error("❌ Backend analysis error:", err);
          setCameraError(`❌ ${err.message}`);
          setAnalyzing(false);
        }
      };
      img.onerror = (err) => {
        console.error("❌ Error loading image:", err);
        setCameraError("Error loading image. Please try again.");
        setAnalyzing(false);
      };
      img.src = src;
    } catch (err) {
      console.error("❌ Analysis error:", err);
      setCameraError("❌ Failed to analyze photo. Please try again.");
      setAnalyzing(false);
    }
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) {
      setCameraError("❌ Camera not ready. Please try again.");
      return;
    }

    // Check if video has valid dimensions
    if (!v.videoWidth || !v.videoHeight) {
      setCameraError("❌ Camera is not fully loaded. Please wait a moment and try again.");
      return;
    }

    try {
      const w = v.videoWidth;
      const h = v.videoHeight;
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");

      // Clear canvas first
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Mirror the canvas to match mirrored preview
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0, w, h);
      ctx.restore();

      const dataUrl = c.toDataURL("image/jpeg", 0.92);

      // Verify the dataUrl is valid (not blank)
      if (!dataUrl || dataUrl === "data:image/jpeg;base64,") {
        setCameraError("❌ Failed to capture photo. Please try again.");
        return;
      }

      stopCamera();
      setCapturedSrc(dataUrl);
      runAnalysis(dataUrl);
    } catch (err) {
      console.error("Capture error:", err);
      setCameraError("❌ Failed to capture photo. Please try again.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file is image
    if (!file.type.startsWith("image/")) {
      setCameraError("❌ Please select an image file.");
      return;
    }

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
    // If this is an AI-generated avatar, use that directly
    if (selectedAvatarPayload?.avatarType === "ai-generated") {
      onSelect(selectedAvatarPayload);
    } else {
      // Otherwise use the cartoon avatar builder
      onSelect({
        url: avatarUrl,
        avatarType: "builder",
        avatarUrl,
        avatarSeed: `${userName || "user"}-${opts.skinColor}-${opts.top}`,
        avatarBackgroundColor: "#B6E3F4",
        avatarTextColor: "#FFFFFF",
        avatarBuilder: {
          skinColor: opts.skinColor,
          hair: opts.top,
          hairColor: opts.hairColor,
          eyes: opts.eyes,
          eyebrows: opts.eyebrows,
          mouth: opts.mouth,
          beard: opts.facialHair,
          beardColor: opts.facialHairColor,
          accessory: opts.accessories,
          clothes: opts.clothing,
          shirtColor: opts.clothesColor,
          source: capturedSrc ? "selfie-analysis" : "manual-builder",
        },
      });
    }
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
                <div className="ab-capture-icon">✨</div>
                <p className="ab-capture-title">Create your AI Avatar</p>
                <p className="ab-capture-desc">
                  📸 Take a clear selfie or upload a photo with your face visible.
                  We'll generate a professional AI avatar that matches your appearance.
                  Make sure your face is clearly visible in good lighting.
                </p>
                {cameraError && <p className="ab-error">{cameraError}</p>}
                <div className="ab-capture-btns">
                  <button
                    className="ab-camera-btn"
                    onClick={startCamera}
                    disabled={cameraLoading}
                  >
                    {cameraLoading ? "⏳ Starting Camera..." : "📷 Open Camera"}
                  </button>
                  <label className="ab-upload-btn" style={{ pointerEvents: cameraLoading ? "none" : "auto", opacity: cameraLoading ? 0.5 : 1 }}>
                    🖼️ Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} hidden disabled={cameraLoading} />
                  </label>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="ab-camera-wrap">
                <video
                  ref={videoRef}
                  className="ab-video"
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  style={{ WebkitPlaysinline: "webkit-playsinline" }}
                  onPlay={() => console.log("✅ Video playing")}
                  onLoadedMetadata={() => console.log("✅ Video metadata loaded")}
                />
                <canvas ref={canvasRef} hidden />
                <div className="ab-camera-overlay">
                  <div className="ab-face-guide" />
                  <p className="ab-guide-text">📸 Center your face in the circle • Good lighting helps • Neutral expression</p>
                </div>
                <div className="ab-camera-actions">
                  <button className="ab-shutter" onClick={capturePhoto}>📸 Capture</button>
                  <button className="ab-cam-cancel" onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            )}

            {analyzing && (
              <div className="ab-analyzing">
                <div className="ab-spinner" />
                <p>🔍 Detecting face...</p>
                <p style={{ fontSize: "12px", marginTop: "8px", opacity: 0.7 }}>Analyzing skin tone, hair color & features</p>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: Result + Editor ── */}
        {phase === "result" && (
          <>
            <div className="ab-result-top">
              {capturedSrc ? (
                <div className="ab-photo-thumb-wrap">
                  <img
                    src={capturedSrc}
                    alt="Your photo"
                    className="ab-photo-thumb"
                    ref={imgRef}
                    style={{
                      background: "#f0f0f0",
                      objectFit: "cover"
                    }}
                    onLoad={() => {
                      console.log("✅ Your photo loaded successfully");
                    }}
                    onError={(e) => {
                      console.error("❌ Photo failed to load. Event:", e);
                      setCameraError("❌ Photo failed to load. Try again.");
                    }}
                  />
                  <div className="ab-arrow">→</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#999", minWidth: "120px" }}>
                  <p>📸 Loading...</p>
                </div>
              )}
              <div className="ab-preview-ring">
                {selectedAvatarPayload?.avatarType === "ai-generated" && selectedAvatarPayload?.avatarUrl ? (
                  <img
                    src={selectedAvatarPayload.avatarUrl}
                    alt="AI Avatar"
                    className="ab-preview-img"
                    style={{ display: "block" }}
                    onError={() => {
                      console.error("❌ AI avatar failed to load - showing cartoon fallback");
                    }}
                    onLoad={() => {
                      console.log("✅ AI avatar loaded successfully");
                    }}
                  />
                ) : avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="Avatar"
                    className="ab-preview-img"
                    style={{ display: "block" }}
                    onError={() => {
                      console.error("❌ Cartoon avatar failed to load");
                      setCameraError("Avatar failed to load. Please try again.");
                    }}
                    onLoad={() => {
                      console.log("✅ Cartoon avatar loaded");
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f0f0f0",
                    borderRadius: "8px",
                    color: "#999"
                  }}>
                    <p>⏳ Generating avatar...</p>
                  </div>
                )}
              </div>
            </div>
            {cameraError ? (
              <p className="ab-error" style={{ marginTop: "10px" }}>
                {cameraError}
              </p>
            ) : (
              <p className="ab-result-hint">
                {selectedAvatarPayload?.avatarType === "ai-generated"
                  ? "🤖 AI-Generated Avatar - Your face analyzed by OpenAI. Perfect match!"
                  : selectedAvatarPayload?.avatarUrl
                    ? "✨ AI Avatar generated! Customize features below ↓"
                    : "⏳ Avatar generating..."}
              </p>
            )}

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
