import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import axios from "axios";

const source = (await readFile(new URL("../src/axiosConfig.js", import.meta.url), "utf8"))
  .replace('from "axios"', `from ${JSON.stringify(import.meta.resolve("axios"))}`)
  .replaceAll("import.meta.env.VITE_API_BASE_URL", '"https://backend.example/api/"');
const loadClient = async () => import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}#${Math.random()}`);
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

test("doctor API client removes a configured /api suffix and sends the current bearer token", async () => {
  const { default: client, API_BASE_URL } = await loadClient();
  localStorage.setItem("accessToken", "doctor-token");
  assert.equal(API_BASE_URL, "https://backend.example");
  client.defaults.adapter = async (config) => {
    assert.equal(client.getUri(config), "https://backend.example/api/auth/me");
    assert.equal(config.headers.Authorization, "Bearer doctor-token");
    assert.equal(config.withCredentials, true);
    return { data: {}, headers: {}, status: 200, config };
  };
  await client.get("/api/auth/me");
});

test("doctor pages can recognize cancellation without masking the original error", async () => {
  const { default: client } = await loadClient();
  assert.equal(client.isCancel(new axios.CanceledError()), true);
  assert.equal(client.isCancel(new Error("Network error")), false);
});

test("silent refresh header updates the bearer token for subsequent pages", async () => {
  const { default: client } = await loadClient();
  client.defaults.adapter = async (config) => ({ data: {}, headers: { "x-new-access-token": "refreshed-doctor-token" }, status: 200, config });
  await client.get("/api/auth/me");
  assert.equal(localStorage.getItem("accessToken"), "refreshed-doctor-token");
  assert.equal(localStorage.getItem("token"), "refreshed-doctor-token");
});

test("wrong current password does not trigger a refresh or discard the session", async () => {
  const { default: client } = await loadClient();
  localStorage.setItem("accessToken", "doctor-token");
  let requests = 0;
  client.defaults.adapter = async (config) => {
    requests++;
    throw new axios.AxiosError("Old password is incorrect", "ERR_BAD_REQUEST", config, null, { status: 401, data: { message: "Old password is incorrect" } });
  };
  await assert.rejects(client.post("/api/auth/changePassword", {}), /Old password/);
  assert.equal(requests, 1);
  assert.equal(localStorage.getItem("accessToken"), "doctor-token");
});

test("permission denial is surfaced without refreshing or logging out", async () => {
  const { default: client } = await loadClient();
  localStorage.setItem("accessToken", "doctor-token");
  client.defaults.adapter = async (config) => {
    throw new axios.AxiosError("Forbidden", "ERR_BAD_REQUEST", config, null, { status: 403 });
  };
  await assert.rejects(client.get("/api/chat/chats"), /Forbidden/);
  assert.equal(localStorage.getItem("accessToken"), "doctor-token");
});
