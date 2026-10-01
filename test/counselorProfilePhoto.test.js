import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { sanitizeUserForCounselor } from "../../chatbot-backend/src/utils/anonymousUser.js";

// Bundle the real display helper; only the Vite-specific API origin is supplied
// by the test so the backend-to-frontend image contract can run in Node.
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("../src/utils/anonymousUser.js", import.meta.url))],
  bundle: true, write: false, format: "esm", platform: "node",
  plugins: [{ name: "test-api-origin", setup(builder) {
    builder.onResolve({ filter: /axiosConfig$/ }, () => ({ path: "api-origin", namespace: "test" }));
    builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
      contents: 'export const API_BASE_URL = "https://api.example.com";', loader: "js",
    }));
  } }],
});
const { getAnonymousUserDisplay } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

test("counselor appointments resolve the same saved avatar as the user profile", () => {
  const url = "https://api.dicebear.com/7.x/avataaars/png?seed=patient";
  const patient = sanitizeUserForCounselor({ _id: "patient-1", anonymous: "Boss", profilePhoto: { url } });
  const display = getAnonymousUserDisplay({ patient });
  assert.equal(display.avatarUrl, url);
  assert.equal(display.name, "Boss");
});

test("chat list and selected chat preserve the photo through display normalization", () => {
  const url = "https://cdn.example.com/avatar.png";
  const otherParty = { id: "patient-1", anonymous: "Boss", profilePhoto: url, avatar: url, avatarUrl: url };
  const display = getAnonymousUserDisplay(otherParty);
  const selected = { user: { avatar: display.avatar, avatarUrl: display.avatarUrl, anonymous: display.name } };
  assert.equal(getAnonymousUserDisplay(selected).avatarUrl, url);
});

test("stored JSON and relative image paths resolve to the backend, without making up missing photos", () => {
  const patient = sanitizeUserForCounselor({ profilePhoto: JSON.stringify({ url: "/uploads/avatar.png" }) });
  assert.equal(getAnonymousUserDisplay(patient).avatarUrl, "https://api.example.com/uploads/avatar.png");
  assert.equal(getAnonymousUserDisplay(sanitizeUserForCounselor({})).avatarUrl, "");
});
