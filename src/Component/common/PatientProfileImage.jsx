import React, { useState } from "react";
import { getAnonymousUserAvatarUrl } from "../../utils/anonymousUser";

export default function PatientProfileImage({ patient, fallback = null, size }) {
  const src = getAnonymousUserAvatarUrl(patient);
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || src === failedSrc) return fallback;
  return <img src={src} alt="" onError={() => setFailedSrc(src)} style={{
    width: size || "100%", height: size || "100%", objectFit: "cover",
    borderRadius: "50%", flexShrink: 0, verticalAlign: "middle",
    ...(size ? { marginRight: 8 } : {}),
  }} />;
}
