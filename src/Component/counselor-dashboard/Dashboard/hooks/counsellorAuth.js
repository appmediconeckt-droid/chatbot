export const getAuthToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

export const getCounsellorId = () => {
  const byKey =
    localStorage.getItem("counsellorId") ||
    localStorage.getItem("counselorId") ||
    localStorage.getItem("userId");
  if (byKey) return byKey;

  try {
    const userDataRaw = localStorage.getItem("userData");
    if (userDataRaw) {
      const userData = JSON.parse(userDataRaw);
      if (userData?._id) {
        const resolvedId = String(userData._id);
        localStorage.setItem("counsellorId", resolvedId);
        localStorage.setItem("counselorId", resolvedId);
        localStorage.setItem("userId", resolvedId);
        return resolvedId;
      }
    }
  } catch (error) {
    console.warn("Failed to parse userData while resolving counsellorId", error);
  }

  const token = getAuthToken();
  if (!token) return "";

  try {
    const payloadBase64 = token.split(".")[1];
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    const resolvedId = payload?.userId || payload?.id || "";
    if (resolvedId) {
      localStorage.setItem("counsellorId", resolvedId);
      localStorage.setItem("counselorId", resolvedId);
      localStorage.setItem("userId", resolvedId);
    }
    return resolvedId;
  } catch (error) {
    console.warn("Failed to decode token while resolving counsellorId", error);
    return "";
  }
};
