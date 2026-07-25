export const ANONYMOUS_USER_NAME = "Anonymous User";

const SAFE_GENERATED_AVATAR_HOSTS = [
  "api.dicebear.com",
  "randomuser.me",
  "xsgames.co",
  "images.generated.photos",
  "ui-avatars.com",
];

const readNested = (source, path) =>
  path.reduce(
    (value, key) => (value && value[key] !== undefined ? value[key] : undefined),
    source,
  );

const readFirst = (source, paths) => {
  for (const path of paths) {
    const value = readNested(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value === true) return true;
  }
  return "";
};

const normalizeAvatarUrl = (value, allowAnyHttpUrl = false) => {
  const raw =
    typeof value === "string"
      ? value
      : value?.url || value?.secure_url || value?.uri || value?.src;

  if (typeof raw !== "string" || !raw.trim()) return "";

  const trimmed = raw.trim();
  if (/^data:image\//i.test(trimmed)) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return "";

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "";
  }

  const isGeneratedAvatar = SAFE_GENERATED_AVATAR_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );

  if (!allowAnyHttpUrl && !isGeneratedAvatar) return "";

  const normalizedUrl = parsed.toString();
  if (parsed.hostname === "api.dicebear.com") {
    return normalizedUrl
      .replace(/\/svg(?=\?)/i, "/png")
      .replace(/\/svg\//i, "/png/");
  }

  return normalizedUrl;
};

const readFirstAvatarUrl = (source, paths, allowAnyHttpUrl = false) => {
  for (const path of paths) {
    const url = normalizeAvatarUrl(readNested(source, path), allowAnyHttpUrl);
    if (url) return url;
  }
  return "";
};

export const getAnonymousUserName = (
  source,
  fallback = ANONYMOUS_USER_NAME,
) => {
  const value = readFirst(source, [
    ["anonymous"],
    ["anonymousName"],
    ["anonName"],
    ["anonymousDisplayName"],
    ["anonymousIdentity"],
    ["userAnonymousName"],
    ["patientName"],
    ["displayAnonymous"],
    ["displayName"],
    ["from", "anonymous"],
    ["from", "anonymousName"],
    ["from", "anonymousDisplayName"],
    ["from", "patientName"],
    ["from", "displayName"],
    ["initiator", "anonymous"],
    ["initiator", "anonymousName"],
    ["initiator", "anonymousDisplayName"],
    ["initiator", "patientName"],
    ["initiator", "displayName"],
    ["user", "anonymous"],
    ["user", "anonymousName"],
    ["user", "anonymousDisplayName"],
    ["user", "patientName"],
    ["user", "displayName"],
    ["patient", "anonymous"],
    ["patient", "anonymousName"],
    ["patient", "anonymousDisplayName"],
    ["patient", "patientName"],
    ["patient", "displayName"],
    ["otherParty", "anonymous"],
    ["otherParty", "anonymousName"],
    ["otherParty", "anonymousDisplayName"],
    ["otherParty", "patientName"],
    ["otherParty", "displayName"],
    ["profile", "anonymous"],
    ["profile", "anonymousName"],
    ["apiCallData", "anonymous"],
    ["apiCallData", "anonymousName"],
    ["apiCallData", "patientName"],
    ["apiCallData", "from", "anonymous"],
    ["apiCallData", "from", "anonymousName"],
    ["apiCallData", "initiator", "anonymous"],
    ["apiCallData", "initiator", "anonymousName"],
  ]);

  return typeof value === "string" && value ? value : fallback;
};

export const getAnonymousUserGender = (source) => {
  const raw = String(
    readFirst(source, [
      ["gender"],
      ["user", "gender"],
      ["patient", "gender"],
      ["otherParty", "gender"],
      ["profile", "gender"],
      ["user", "profile", "gender"],
      ["patient", "profile", "gender"],
    ]) || "",
  ).toLowerCase();

  if (["male", "man", "boy", "m"].includes(raw)) return "male";
  if (["female", "woman", "girl", "f"].includes(raw)) return "female";
  return "other";
};

export const getAnonymousUserAvatar = (source) => {
  const gender = getAnonymousUserGender(source);
  if (gender === "male") return "👨";
  if (gender === "female") return "👩";
  return "👤";
};

export const getAnonymousUserAvatarUrl = (source) => {
  const profileAvatarUrl = readFirstAvatarUrl(source, [
    ["profilePhoto"],
    ["profilePhoto", "url"],
    ["profilePic"],
    ["photoUrl"],
    ["image"],
    ["Image"],
    ["avatar"],
    ["avatar", "url"],
    ["user", "profilePhoto"],
    ["user", "profilePhoto", "url"],
    ["user", "profilePic"],
    ["user", "photoUrl"],
    ["user", "image"],
    ["user", "Image"],
    ["user", "avatar"],
    ["user", "avatar", "url"],
    ["patient", "profilePhoto"],
    ["patient", "profilePhoto", "url"],
    ["patient", "profilePic"],
    ["patient", "photoUrl"],
    ["patient", "image"],
    ["patient", "Image"],
    ["patient", "avatar"],
    ["patient", "avatar", "url"],
    ["otherParty", "profilePhoto"],
    ["otherParty", "profilePhoto", "url"],
    ["otherParty", "profilePic"],
    ["otherParty", "photoUrl"],
    ["otherParty", "image"],
    ["otherParty", "Image"],
    ["otherParty", "avatar"],
    ["otherParty", "avatar", "url"],
    ["profile", "profilePhoto"],
    ["profile", "profilePhoto", "url"],
    ["profile", "profilePic"],
    ["profile", "photoUrl"],
    ["profile", "image"],
    ["profile", "Image"],
    ["profile", "avatar"],
    ["profile", "avatar", "url"],
  ], true);

  if (profileAvatarUrl) return profileAvatarUrl;

  const explicitAvatarUrl = readFirstAvatarUrl(source, [
    ["anonymousAvatarUrl"],
    ["anonymousAvatar"],
    ["avatarUrl"],
    ["avatarImage"],
    ["Image"],
    ["profileAvatarUrl"],
    ["profileAvatar"],
    ["selectedAvatar"],
    ["displayAvatar"],
    ["user", "anonymousAvatarUrl"],
    ["user", "anonymousAvatar"],
    ["user", "avatarUrl"],
    ["user", "avatarImage"],
    ["user", "Image"],
    ["patient", "anonymousAvatarUrl"],
    ["patient", "anonymousAvatar"],
    ["patient", "avatarUrl"],
    ["patient", "avatarImage"],
    ["patient", "Image"],
    ["otherParty", "anonymousAvatarUrl"],
    ["otherParty", "anonymousAvatar"],
    ["otherParty", "avatarUrl"],
    ["otherParty", "avatarImage"],
    ["otherParty", "Image"],
    ["profile", "anonymousAvatarUrl"],
    ["profile", "anonymousAvatar"],
    ["profile", "avatarUrl"],
    ["profile", "avatarImage"],
    ["profile", "Image"],
  ], true);

  if (explicitAvatarUrl) return explicitAvatarUrl;

  return readFirstAvatarUrl(source, [
    ["avatar"],
    ["avatar", "url"],
    ["Image"],
    ["profilePhoto"],
    ["profilePhoto", "url"],
    ["profilePic"],
    ["photoUrl"],
    ["image"],
    ["user", "avatar"],
    ["user", "avatar", "url"],
    ["user", "Image"],
    ["user", "profilePhoto"],
    ["user", "profilePhoto", "url"],
    ["user", "profilePic"],
    ["patient", "avatar"],
    ["patient", "avatar", "url"],
    ["patient", "Image"],
    ["patient", "profilePhoto"],
    ["patient", "profilePhoto", "url"],
    ["patient", "profilePic"],
    ["otherParty", "avatar"],
    ["otherParty", "avatar", "url"],
    ["otherParty", "Image"],
    ["otherParty", "profilePhoto"],
    ["otherParty", "profilePhoto", "url"],
    ["otherParty", "profilePic"],
    ["profile", "avatar"],
    ["profile", "avatar", "url"],
    ["profile", "Image"],
    ["profile", "profilePhoto"],
    ["profile", "profilePhoto", "url"],
  ], true);
};

export const getAnonymousUserDisplay = (source) => ({
  name: getAnonymousUserName(source),
  gender: getAnonymousUserGender(source),
  avatar: getAnonymousUserAvatar(source),
  avatarUrl: getAnonymousUserAvatarUrl(source),
});

export const getAnonymousParticipantId = (source) =>
  source?.receiverId ||
  source?._id ||
  source?.id ||
  source?.userId ||
  source?.user_id ||
  source?.patientId ||
  source?.clientId ||
  source?.user?._id ||
  source?.user?.id ||
  source?.patient?._id ||
  source?.patient?.id ||
  source?.otherParty?._id ||
  source?.otherParty?.id ||
  null;
