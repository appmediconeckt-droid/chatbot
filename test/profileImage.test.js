import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProfileImage, profileImageValue } from "../src/utils/profileImage.js";

test("profile API aliases and stored image objects resolve to the backend origin", () => {
  for (const field of ["profilePhoto", "profileImage", "profile_image", "profilePic", "photo"]) {
    assert.equal(normalizeProfileImage(profileImageValue({ [field]: { url: "/uploads/photo.jpg" } }), "https://api.example.com/api"), "https://api.example.com/uploads/photo.jpg");
  }
  assert.equal(normalizeProfileImage('{"url":"/uploads/photo.jpg"}', "https://api.example.com"), "https://api.example.com/uploads/photo.jpg");
});
test("absolute images, anonymous avatars and missing images are handled", () => {
  assert.equal(normalizeProfileImage("https://cdn.example.com/a.jpg"), "https://cdn.example.com/a.jpg");
  assert.equal(normalizeProfileImage("??"), "??");
  assert.equal(normalizeProfileImage(null), "");
  assert.equal(normalizeProfileImage({}), "");
  assert.equal(normalizeProfileImage("javascript:alert(1)"), "");
});
