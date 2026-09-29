// Accept the image shapes returned by profile and call APIs.
export function profileImageValue(profile) {
  if (!profile) return "";
  if (typeof profile === "string") return profile;
  return profile.profilePhoto || profile.profileImage || profile.profile_image ||
    profile.profilePic || profile.profile_pic || profile.profile_photo ||
    profile.image || profile.avatarUrl || profile.avatar || profile.photo || "";
}

export function normalizeProfileImage(value, origin = "") {
  if (!value) return "";
  if (typeof value === "object") return normalizeProfileImage(value.url || value.secure_url || value.avatarUrl, origin);
  if (typeof value !== "string") return "";
  const image = value.trim();
  if (!image) return "";
  if (image.startsWith("{")) {
    try { return normalizeProfileImage(JSON.parse(image), origin); } catch { return ""; }
  }
  if (/^(https?:|data:image\/|blob:)/i.test(image)) return image;
  if (image.startsWith("//")) return `https:${image}`;
  if (/^[^a-z0-9/]+$/iu.test(image)) return image; // Anonymous emoji avatars.
  if (/^[a-z][a-z0-9+.-]*:/i.test(image)) return "";
  return `${origin.replace(/\/api\/?$/, "").replace(/\/+$/, "")}/${image.replace(/^\/+/, "")}`;
}
