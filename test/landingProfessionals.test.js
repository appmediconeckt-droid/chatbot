import { test } from 'node:test';
import assert from 'node:assert/strict';
import { professionalAverage, isHighlyRatedProfessional, professionalRoleLabel } from '../src/authtication/landingProfessionals.js';

test('landing includes only averages strictly above 4.5', () => {
  for (const rating of [0, 4, 4.49, 4.5, null, undefined, 'invalid', 6]) {
    assert.equal(isHighlyRatedProfessional({ rating }), false);
  }
  assert.equal(isHighlyRatedProfessional({ rating: 4.6 }), true);
  assert.equal(isHighlyRatedProfessional({ rating: '5' }), true);
  assert.equal(isHighlyRatedProfessional({ averageRating: 4.8 }), true);
});

test('uses the real average without inventing a default rating', () => {
  assert.equal(professionalAverage({ rating: 4.7 }), 4.7);
  assert.equal(professionalAverage({ rating: 0, averageRating: 5 }), 0);
  assert.equal(professionalAverage({}), 0);
});

test('identifies doctors including legacy doctor accounts and labels consultants', () => {
  assert.equal(professionalRoleLabel({ role: 'doctor' }), 'Doctor');
  assert.equal(professionalRoleLabel({ role: 'counsellor', accountType: 'doctor' }), 'Doctor');
  assert.equal(professionalRoleLabel({ role: 'consultant' }), 'Consultant');
  assert.equal(professionalRoleLabel({ role: 'counsellor' }), 'Consultant');
});
