export const getPasswordChecks = (value) => {
  const password = String(value || "");
  return {
    length: password.length >= 6 && password.length <= 20,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

export const isStrongPassword = (value) =>
  Object.values(getPasswordChecks(value)).every(Boolean);

export const STRONG_PASSWORD_ERROR =
  "Password must contain 6 to 20 characters, including uppercase, lowercase, number and special character.";
