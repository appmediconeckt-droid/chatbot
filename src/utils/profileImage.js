// Accept the image shapes returned by profile and call APIs.
export function profileImageValue(profile) {
  if (!profile) return "";
  if (typeof profile === "string") return profile;
  return profile.profilePhoto || profile.profileImage || profile.profile_image ||
    profile.profilePic || profile.profile_pic || profile.profile_photo ||
    profile.image || profile.Image || profile.photoUrl || profile.avatarUrl || profile.avatar || profile.photo || "";
}

export function normalizeProfileImage(value, origin = "") {
  if (!value) return "";
  if (typeof value === "object") return normalizeProfileImage(value.url || value.secure_url || value.avatarUrl || value.uri || value.src, origin);
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

export function resolveProfileImage(profile, origin = "") {
  if (!profile) return "";
  for (const key of ["profilePhoto", "profileImage", "profile_image", "profilePic", "profile_pic", "profile_photo", "image", "Image", "photoUrl", "avatarUrl", "avatar", "photo"]) {
    const image = normalizeProfileImage(profile[key], origin);
    if (image && /^(https?:|data:image\/|blob:|\/)/i.test(image)) return image;
  }
  return "";
}

// The receiver is the peer only for an outgoing call. Incoming calls show the initiator.
export function remoteCallParticipant(call, localId) {
  const id = value => String(value?._id || value?.id || value?.userId || value?.user?.id || "");
  const receiver = call?.receiver || call?.apiCallData?.receiver;
  const initiator = call?.initiator || call?.from || call?.apiCallData?.initiator;
  if (localId && id(receiver) === String(localId)) return initiator;
  if (localId && id(initiator) === String(localId)) return receiver;
  return call?.isIncoming ? initiator : receiver;
}
export function remoteCallImage(call, localId, origin = "") {
  return resolveProfileImage(remoteCallParticipant(call, localId), origin) || resolveProfileImage(call, origin);
}
