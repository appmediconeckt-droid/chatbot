import { test } from "node:test";
import assert from "node:assert/strict";
import { getLiveTokenTiming, formatTimer, formatWaitLabel } from "../src/Component/UserDashboard/Tab/Counselor/tokenTiming.js";

test("checkup elapsed and estimated waiting countdown tick between server updates", () => {
  const current = { serverTime: "2026-09-22T04:30:00Z", elapsedSeconds: 60, doctorStatus: "consulting" };
  assert.deepEqual(getLiveTokenTiming(current, { estimatedTurnTime: "2026-09-22T04:40:00Z" }, Date.parse("2026-09-22T04:30:05Z")), { elapsed: 65, waiting: 595 });
  assert.equal(formatTimer(65), "01:05");
  assert.equal(formatWaitLabel(595), "10 min");
});
test("paused and missing timers do not advance or fabricate a countdown", () => {
  assert.equal(getLiveTokenTiming({ serverTime: "2026-09-22T04:30:00Z", elapsedSeconds: 60, doctorStatus: "paused" }, {}, Date.parse("2026-09-22T04:35:00Z")).elapsed, 60);
  assert.deepEqual(getLiveTokenTiming({}, {}), { elapsed: null, waiting: null });
  assert.equal(formatTimer(null), "--");
  assert.equal(getLiveTokenTiming({ doctorStatus: "waiting" }, { estimatedTurnTime: "2099-01-01" }, Date.parse("2098-12-31T23:50:00Z")).waiting, 600);
  assert.equal(getLiveTokenTiming({ doctorStatus: "paused", elapsedSeconds: 60 }, { estimatedTurnTime: "2099-01-01", estimateUncertain: true }).waiting, null);
});
