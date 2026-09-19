import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { persistAuthSession, dashboardForRole } from "../src/authtication/authSession.js";

beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

for (const role of ["user", "doctor", "counselor", "consultant", "counsellor"]) {
  test(`preserves ${role} identity while routing to the correct dashboard`, () => {
    const session = persistAuthSession({
      role, accessToken: "test-token", user: { _id: "test-id", email: "test@example.com", role },
    });
    assert.equal(session.role, role);
    assert.equal(localStorage.getItem("userRole"), role);
    assert.equal(localStorage.getItem("userType"), role);
    assert.equal(JSON.parse(localStorage.getItem("userData")).role, role);
    assert.equal(session.path, role === "user" ? "/user-dashboard" : "/counselor-dashboard");
    assert.equal(dashboardForRole(role), session.path);
  });
}

test("user login clears a previous professional account's identifiers", () => {
  persistAuthSession({ role: "doctor", token: "first", user: { _id: "doctor-id", role: "doctor" } });
  persistAuthSession({ token: "second", user: { _id: "user-id", role: "user" } });
  assert.equal(localStorage.getItem("counselorId"), null);
  assert.equal(localStorage.getItem("counsellorId"), null);
  assert.equal(localStorage.getItem("userRole"), "user");
});

test("does not infer a role from a token-only response", () => {
  assert.equal(persistAuthSession({ token: "missing-role" }), null);
  assert.equal(localStorage.getItem("isAuthenticated"), null);
});
