import { test } from "node:test";
import assert from "node:assert/strict";
import { getLiveTokenTiming, formatTimer, formatWaitLabel, getTokenDisplayTime, formatQueueStatus } from "../src/Component/UserDashboard/Tab/Counselor/tokenTiming.js";

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

test("own consultation has no waiting countdown and another active consultation never promises zero", () => {
  const eta = "2026-10-08T06:40:00Z";
  assert.equal(getLiveTokenTiming({ doctorStatus: "consulting", isYourTurn: true }, { estimatedTurnTime: eta }, Date.parse(eta)).waiting, null);
  assert.equal(getLiveTokenTiming({ doctorStatus: "consulting", isYourTurn: false }, { estimatedTurnTime: eta }, Date.parse(eta) + 1000).waiting, null);
  assert.equal(getLiveTokenTiming({ doctorStatus: "consulting" }, { estimatedTurnTime: eta, estimateUncertain: true }, Date.parse(eta) - 60000).waiting, null);
});

test("scheduled clock plus whole-minute delay equals the estimated and actual clock display", () => {
  const scheduled = Date.parse("2026-10-08T14:15:00+05:30");
  for (const seconds of [0, 29, 30, 40, 59]) {
    const actual = scheduled + 3 * 60000 + seconds * 1000;
    const lateMinutes = Math.round((actual - scheduled) / 60000);
    assert.equal(getTokenDisplayTime(actual).getTime(), scheduled + lateMinutes * 60000);
  }
  assert.equal(getTokenDisplayTime("2026-10-08T14:18:40+05:30").toISOString(), "2026-10-08T08:49:00.000Z");
  assert.equal(getTokenDisplayTime(null), null);
  assert.equal(getTokenDisplayTime("invalid"), null);
});

test("early and midnight clock rounding remain consistent without changing source timestamps", () => {
  const original = "2026-10-08T23:59:45+05:30";
  assert.equal(getTokenDisplayTime(original).toISOString(), "2026-10-08T18:30:00.000Z");
  assert.equal(original, "2026-10-08T23:59:45+05:30");
  const scheduled = Date.parse("2026-10-08T14:15:00+05:30");
  const early = scheduled - 4 * 60000 + 40000;
  assert.equal(getTokenDisplayTime(early).getTime(), scheduled + Math.round((early - scheduled) / 60000) * 60000);
});

test("queue status uses readable spaces while retaining existing labels", () => {
  assert.equal(formatQueueStatus("in_progress"), "in progress");
  assert.equal(formatQueueStatus("in-progress"), "in progress");
  assert.equal(formatQueueStatus("booked"), "booked");
  assert.equal(formatQueueStatus(null), "--");
});
