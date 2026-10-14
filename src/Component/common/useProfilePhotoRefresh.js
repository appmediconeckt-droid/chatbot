import { useEffect } from 'react';
import axios from '../../axiosConfig.js';

export default function useProfilePhotoRefresh(profile, setProfile) {
  const id = String(profile?._id || profile?.id || '');
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const { data } = await axios.get('/api/auth/me', { signal: controller.signal });
        const user = data.user;
        if (!controller.signal.aborted && String(user?._id || user?.id || '') === id) {
          setProfile(current => current && current.role === user.role &&
            JSON.stringify(current.profilePhoto) !== JSON.stringify(user.profilePhoto)
            ? { ...current, profilePhoto: user.profilePhoto } : current);
        }
      } catch {
        // Keep the last loaded profile during transient connection failures.
      } finally { pending = false; }
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = setInterval(refresh, 15000);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [id, setProfile]);
}
