export const getPasswordChecks = (value) => {
  const password = String(value || "");
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

export const isStrongPassword = (value) =>
  Object.values(getPasswordChecks(value)).every(Boolean);

export const STRONG_PASSWORD_ERROR =
  "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.";
