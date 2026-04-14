import { useCallback, useEffect, useRef, useState } from "react";

const RESUME_EVENTS = ["pointerdown", "touchstart", "keydown"];
const RINGTONE_SOURCES = ["/ringtone.mp3", "/rigntone.mp3"];

const useRingtone = () => {
  const [isRinging, setIsRinging] = useState(false);

  const isRingingRef = useRef(false);
  const audioRef = useRef(null);
  const activeSourceRef = useRef("");
  const listenersAttachedRef = useRef(false);
  const resumeFromGestureRef = useRef(null);

  const detachResumeListeners = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !listenersAttachedRef.current ||
      !resumeFromGestureRef.current
    ) {
      return;
    }

    RESUME_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, resumeFromGestureRef.current);
    });

    listenersAttachedRef.current = false;
  }, []);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return null;
    }

    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.playsInline = true;
      audio.volume = 1;
      audioRef.current = audio;
    }

    return audioRef.current;
  }, []);

  const tryPlayWithSources = useCallback(async () => {
    const audio = ensureAudio();
    if (!audio) {
      return false;
    }

    let lastError = null;

    for (const source of RINGTONE_SOURCES) {
      if (!source) continue;

      if (activeSourceRef.current !== source) {
        activeSourceRef.current = source;
        audio.src = source;
      }

      try {
        await audio.play();
        return true;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      console.warn("Ringtone playback is blocked or source failed.", lastError);
    }

    return false;
  }, [ensureAudio]);

  const resumeFromGesture = useCallback(async () => {
    if (!isRingingRef.current) {
      detachResumeListeners();
      return;
    }

    const started = await tryPlayWithSources();
    if (started) {
      detachResumeListeners();
    }
  }, [detachResumeListeners, tryPlayWithSources]);

  const startRinging = useCallback(async () => {
    const audio = ensureAudio();
    if (!audio) {
      setIsRinging(false);
      isRingingRef.current = false;
      return;
    }

    setIsRinging(true);
    isRingingRef.current = true;

    const started = await tryPlayWithSources();
    if (started) {
      detachResumeListeners();
      return;
    }

    if (typeof window !== "undefined" && !listenersAttachedRef.current) {
      RESUME_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, resumeFromGesture, {
          passive: true,
        });
      });
      listenersAttachedRef.current = true;
    }
  }, [
    detachResumeListeners,
    ensureAudio,
    resumeFromGesture,
    tryPlayWithSources,
  ]);

  const stopRinging = useCallback(() => {
    setIsRinging(false);
    isRingingRef.current = false;

    detachResumeListeners();

    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Ignore playback stop errors.
    }
  }, [detachResumeListeners]);

  useEffect(() => {
    isRingingRef.current = isRinging;
  }, [isRinging]);

  useEffect(() => {
    resumeFromGestureRef.current = resumeFromGesture;
  }, [resumeFromGesture]);

  useEffect(() => {
    return () => {
      detachResumeListeners();

      const audio = audioRef.current;
      audioRef.current = null;

      if (!audio) return;

      try {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // Ignore cleanup races during unmount.
      }
    };
  }, [detachResumeListeners]);

  return {
    startRinging,
    stopRinging,
    isRinging,
  };
};

export default useRingtone;
