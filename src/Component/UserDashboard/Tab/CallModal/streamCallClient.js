import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

const readLocalProfileImage = () => {
  const profilePhoto = localStorage.getItem("profilePhoto");
  if (profilePhoto) return profilePhoto;
  return "";
};

export const resolveStreamUser = (currentUser) => {
  const id =
    currentUser?.id ||
    currentUser?._id ||
    localStorage.getItem("userId") ||
    localStorage.getItem("counsellorId") ||
    localStorage.getItem("counselorId") ||
    "";

  const name =
    currentUser?.fullName ||
    currentUser?.name ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("name") ||
    "User";

  const rawImage =
    currentUser?.profilePic ||
    currentUser?.profilePhoto ||
    readLocalProfileImage() ||
    "";

  const image = typeof rawImage === "string" ? rawImage : rawImage?.url || "";

  return {
    id: String(id),
    name,
    image,
  };
};

export const getStreamToken = async () => {
  const token = getAuthToken();

  const response = await axios.get(`${API_BASE_URL}/api/video/stream/token`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return response.data;
};

export const resolveStreamApiKey = (tokenPayload) =>
  tokenPayload?.apiKey || import.meta.env.VITE_STREAM_API_KEY || "";

export const resolveStreamUserFromToken = (localUser, tokenPayload) => ({
  ...localUser,
  id: String(tokenPayload?.userId || localUser?.id || "").trim(),
});

export const validateStreamTokenPayload = (payload) => {
  if (!payload || payload.success === false) {
    throw new Error(payload?.error || "Failed to fetch Stream token.");
  }

  if (!payload.token || typeof payload.token !== "string") {
    throw new Error("Stream token is missing or invalid.");
  }

  if (!payload.userId) {
    throw new Error("Stream user ID is missing in token response.");
  }
};
