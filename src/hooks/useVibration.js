// hooks/useVibration.js
import { useCallback } from 'react';

const useVibration = () => {
    const vibrate = useCallback((pattern = 50) => {
        // Check if vibration is supported
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        } else {
            console.log('Vibration not supported on this device');
        }
    }, []);

    return vibrate;
};

export default useVibration;