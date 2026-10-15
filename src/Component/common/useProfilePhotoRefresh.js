import { useEffect } from 'react';
import axios from '../../axiosConfig.js';

export default function useProfilePhotoRefresh(profile, setProfile) {
  const id = String(profile?._id || profile?.id || '');
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let pending = false;
    let lastRefresh = Date.now();
    const refresh = async (force = false) => {
      if (pending || document.visibilityState === 'hidden' || navigator.onLine === false || (!force && Date.now() - lastRefresh < 60000)) return;
      pending = true;
      lastRefresh = Date.now();
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
    const wake = () => refresh();
    const updated = () => refresh(true);
    const storage = event => { if (event.key === 'userData' || event.key === `doctorProfile:${id}`) refresh(true); };
    window.addEventListener('focus', wake);
    window.addEventListener('profile-updated', updated);
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', wake);
    return () => {
      controller.abort();
      window.removeEventListener('focus', wake);
      window.removeEventListener('profile-updated', updated);
      window.removeEventListener('storage', storage);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [id, setProfile]);
}
