/**
 * Centralized WebRTC / ICE configuration.
 *
 * Both VoiceCallModal and VideoCallModal import from here so the
 * STUN/TURN settings are defined in exactly one place.
 */

const buildRtcConfiguration = () => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    const urls = turnUrl
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    iceServers.push({
      urls: urls.length > 1 ? urls : urls[0],
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return { iceServers };
};

export const RTC_CONFIGURATION = buildRtcConfiguration();
