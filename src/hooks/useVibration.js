// hooks/useVibration.js
import { useCallback } from "react";

const useVibration = () => {
  const vibrate = useCallback((pattern = 50) => {

    // check support
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    } else {
      // fallback for iPhone
      console.log("Vibration not supported (likely iPhone)");
      
      // optional: play sound or trigger animation
      const audio = new Audio("/click.mp3");
      audio.play();
    }

  }, []);

  return vibrate;
};
export default useVibration;