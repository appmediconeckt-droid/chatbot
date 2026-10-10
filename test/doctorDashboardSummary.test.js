import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardIndiaDate, getDoctorDashboardSummary } from '../src/Component/DoctorDashboard/Dashboard/doctorDashboardSummary.js';

const now = Date.parse('2026-10-10T12:00:00+05:30');
const row = (id, status = 'completed', date = '2026-10-10', changes = {}) => ({
  id, appointmentSource: 'online', status, appointmentDate: date, ...changes,
});

test('53 old completions never inflate today cards or completion progress', () => {
  const history = Array.from({ length: 53 }, (_, i) => row(`old-${i}`, 'completed', '2026-10-09'));
  const stats = getDoctorDashboardSummary([...history, row('today-completed'), row('today-pending', 'confirmed')], now);
  assert.equal(stats.completedToday, 1);
  assert.equal(stats.totalToday, 2);
  assert.equal(stats.pendingToday, 1);
  assert.equal(stats.completionPercent, 50);
});

test('an empty today has zero counts even when completion history exists', () => {
  assert.deepEqual(getDoctorDashboardSummary([row('yesterday', 'completed', '2026-10-09')], now), {
    totalToday: 0, completedToday: 0, pendingToday: 0, completionPercent: 0, averageConsultMinutes: null,
  });
});

test('duplicate API and local completion entries count once by source and appointment ID', () => {
  const completed = row('same', 'completed', '2026-10-10', { apiId: 'booking' });
  const stats = getDoctorDashboardSummary([completed, { ...completed }, { ...completed }], now);
  assert.equal(stats.totalToday, 1);
  assert.equal(stats.completedToday, 1);
  assert.equal(stats.completionPercent, 100);
});

test('online/walk-in ID collisions and restarted token numbers remain distinct bookings', () => {
  const stats = getDoctorDashboardSummary([
    row(1, 'completed', '2026-10-10', { tokenNumber: 1 }),
    row(1, 'completed', '2026-10-10', { appointmentSource: 'walkin', tokenNumber: 1 }),
    row(2, 'completed', '2026-10-10', { tokenNumber: 1 }),
  ], now);
  assert.equal(stats.totalToday, 3);
  assert.equal(stats.completedToday, 3);
});

test('India date boundaries are independent of the browser timezone', () => {
  assert.equal(dashboardIndiaDate('2026-10-09T20:00:00Z'), '2026-10-10');
  assert.equal(dashboardIndiaDate('2026-10-10T19:00:00Z'), '2026-10-11');
  const stats = getDoctorDashboardSummary([
    { _id: 'early', status: 'completed', date: '2026-10-09T20:00:00Z' },
    { _id: 'tomorrow', status: 'completed', date: '2026-10-10T19:00:00Z' },
  ], now);
  assert.equal(stats.completedToday, 1);
});

test('old emergencies, missing dates, invalid dates and future bookings are not counted today', () => {
  const stats = getDoctorDashboardSummary([
    row('old-emergency', 'completed', '2026-10-09', { isEmergency: true }),
    row('missing', 'completed', undefined),
    row('invalid', 'completed', 'invalid-date'),
    row('impossible', 'completed', '2026-02-30'),
    row('future', 'confirmed', '2026-10-11'),
  ].map((item) => item.id === 'missing' ? { ...item, appointmentDate: null } : item), now);
  assert.equal(stats.totalToday, 0);
});

test('original booked date wins over estimates, createdAt and follow-up update dates', () => {
  const stats = getDoctorDashboardSummary([row('old', 'completed', '2026-10-09', {
    estimatedStartAt: '2026-10-10T10:00:00+05:30', updatedAt: '2026-10-10', createdAt: '2026-10-10',
  })], now);
  assert.equal(stats.completedToday, 0);
});

test('pending card includes booked, confirmed and skipped patients but excludes actual consultations and cancellations', () => {
  const stats = getDoctorDashboardSummary([
    row('pending', 'pending'), row('confirmed', 'confirmed'), row('skipped', 'skipped'),
    row('running', 'in-progress', '2026-10-10', { queueStatus: 'in_progress' }),
    row('started-legacy', 'confirmed', '2026-10-10', { consultationStartedAt: '2026-10-10T10:00:00+05:30' }),
    row('cancelled', 'canceled', '2026-10-10', { queueStatus: 'in_progress' }), row('done'),
  ], now);
  assert.equal(stats.totalToday, 7);
  assert.equal(stats.pendingToday, 3);
  assert.equal(stats.completedToday, 1);
});

test('average uses actual durations for today only and excludes unknown durations', () => {
  const stats = getDoctorDashboardSummary([
    row('old', 'completed', '2026-10-09', { durationMs: 120 * 60000 }),
    row('first', 'completed', '2026-10-10', { durationMs: 10 * 60000 }),
    row('second', 'completed', '2026-10-10', { durationMs: 20 * 60000 }), row('unknown'),
  ], now);
  assert.equal(stats.averageConsultMinutes, 15);
});

test('persisted actual start/end and pause history determine average when duration is absent', () => {
  const stats = getDoctorDashboardSummary([{ _id: 'actual', appointment_date: '2026-10-10', status: 'completed', consultation_timing: {
    startedAt: '2026-10-10T10:00:00+05:30', endedAt: '2026-10-10T10:20:00+05:30',
    pauses: [{ startedAt: '2026-10-10T10:05:00+05:30', endedAt: '2026-10-10T10:10:00+05:30' }],
  } }], now);
  assert.equal(stats.averageConsultMinutes, 15);
});

test('calculations leave appointment history untouched', () => {
  const rows = [row('old', 'completed', '2026-10-09'), row('today', 'confirmed')];
  const original = structuredClone(rows);
  getDoctorDashboardSummary(rows, now);
  assert.deepEqual(rows, original);
});
