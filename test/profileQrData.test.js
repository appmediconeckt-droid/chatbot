import { test } from "node:test";
import assert from "node:assert/strict";
import { publicDoctorProfile, createProfileLink, readProfileLink } from "../src/Component/DoctorDashboard/Setting/SettingProfileQR/profileQrData.js";

test("doctor contact aliases and professional details survive scanning on another device", () => {
  const profile = publicDoctorProfile({ doctor: {
    full_name: "Dr. अरुण", phone_number: "9876543210", qualification: "MBBS",
    online_consultation: false, initial_consultation_fee: 0,
    languages: ["Hindi", "English"], hospital_address: "Clinic Road",
  } }, { email: "doctor@example.com" });
  const url = new URL(createProfileLink(profile, "https://example.com"));
  assert.equal(url.pathname, "/doctor-profile-qr");
  assert.deepEqual(readProfileLink(url.hash), profile);
  assert.equal(profile.phone, "9876543210");
  assert.equal(profile.email, "doctor@example.com");
  assert.equal(profile.online, "No");
  assert.equal(profile.initialFee, "0");
});

test("QR includes only public fields and never account or identity-document data", () => {
  const profile = publicDoctorProfile({ fullName: "Doctor", accessToken: "secret", password: "secret", aadhaar: "private", pan: "private", current_address: "home" });
  assert.deepEqual(profile, { name: "Doctor" });
  const link = createProfileLink({ ...profile, refreshToken: "secret" }, "https://example.com");
  assert.deepEqual(readProfileLink(new URL(link).hash), { name: "Doctor" });
});

test("malformed or oversized QR payloads produce clear errors", () => {
  for (const hash of ["", "#broken", "#" + btoa("null"), "#" + btoa("{}")]) assert.throws(() => readProfileLink(hash));
  assert.throws(() => createProfileLink({ name: "Doctor", about: "a".repeat(3000) }, "https://example.com"), /too long/);
});
