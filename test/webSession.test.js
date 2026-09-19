import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { initializeWebSession } from "../src/utils/webSession.js";

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};

beforeEach(() => {
  globalThis.localStorage = createStorage();
  globalThis.sessionStorage = createStorage();
});

test("opening a QR tab preserves the main tab's shared login", () => {
  initializeWebSession();
  const mainTab = sessionStorage;
  const login = {
    accessToken: "access-token",
    token: "legacy-token",
    refreshToken: "refresh-token",
    isAuthenticated: "true",
    userRole: "doctor",
    userData: JSON.stringify({ id: "doctor-1", role: "doctor" }),
    doctorId: "doctor-1",
  };
  for (const [key, value] of Object.entries(login)) localStorage.setItem(key, value);

  // A QR link opens with fresh sessionStorage and the same localStorage.
  globalThis.sessionStorage = createStorage();
  initializeWebSession();
  assert.ok(sessionStorage.getItem("humaeliWebSession"));
  for (const [key, value] of Object.entries(login)) assert.equal(localStorage.getItem(key), value);

  globalThis.sessionStorage = mainTab;
  initializeWebSession();
  for (const [key, value] of Object.entries(login)) assert.equal(localStorage.getItem(key), value);
});

test("reloading a tab preserves its marker and login", () => {
  sessionStorage.setItem("humaeliWebSession", "existing-marker");
  localStorage.setItem("accessToken", "access-token");
  initializeWebSession();
  assert.equal(sessionStorage.getItem("humaeliWebSession"), "existing-marker");
  assert.equal(localStorage.getItem("accessToken"), "access-token");
});

test("opening a guest tab or reinitializing after logout does not create credentials", () => {
  initializeWebSession();
  assert.equal(localStorage.getItem("accessToken"), null);
  assert.equal(localStorage.getItem("isAuthenticated"), null);

  localStorage.setItem("accessToken", "access-token");
  localStorage.clear();
  initializeWebSession();
  assert.equal(localStorage.getItem("accessToken"), null);
  assert.equal(localStorage.getItem("isAuthenticated"), null);
});
