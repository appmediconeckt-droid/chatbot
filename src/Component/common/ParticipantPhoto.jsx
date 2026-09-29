import { useState } from "react";

export default function ParticipantPhoto({ src, name, className, fallback }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return src && failedSrc !== src
    ? <img src={src} alt={name || "Profile"} className={className} onError={() => setFailedSrc(src)} />
    : fallback;
}
