import { useEffect, useState } from "react";
import axios from "../axiosConfig";

export default function useProfileCompletion(saved, draft, editing) {
  const payload = JSON.stringify(draft);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!editing) { setPreview(null); return; }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await axios.post("/api/auth/profile-completion", JSON.parse(payload));
        if (active) setPreview({ payload, completion: response.data.profileCompletion });
      } catch {
        if (active) setPreview({ payload, error: true });
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [payload, editing]);
  const current = editing && preview?.payload === payload ? preview : null;
  return {
    completion: editing && !current?.error ? (preview?.completion || saved) : saved,
    pending: editing && !current,
    error: Boolean(current?.error),
    editing,
  };
}
