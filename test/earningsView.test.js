import test from 'node:test';
import assert from 'node:assert/strict';
import { earningsMode } from '../src/Component/DoctorDashboard/Earnings/earningsView.js';

test('a saved dummy UPI payment is visible on initial earnings load', () => {
  const data = { transactions: [], demo: { transactions: [{ method: 'upi', gross: 550, platformFee: 110, net: 440, createdAt: '2026-10-27T07:18:04Z' }] } };
  assert.equal(earningsMode(undefined), 'live');
  assert.equal(earningsMode(data), 'demo');
  assert.equal(earningsMode(data, 'live'), 'live');
});

test('newest dummy card payment opens the demo view without combining real balances', () => {
  const data = { transactions: [{ createdAt: '2026-10-26T12:00:00Z' }], demo: { transactions: [{ method: 'debit_card', createdAt: '2026-10-27T12:00:00Z' }] } };
  assert.equal(earningsMode(data), 'demo');
  data.transactions.push({ createdAt: '2026-10-28T12:00:00Z' });
  assert.equal(earningsMode(data), 'live');
  assert.equal(earningsMode(data, 'demo'), 'demo');
});
