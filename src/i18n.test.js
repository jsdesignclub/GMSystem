import test from 'node:test';
import assert from 'node:assert/strict';
import { getTranslation } from './i18n.js';

test('defaults to English when no language is provided', () => {
  assert.equal(getTranslation('login.title', 'en'), 'Officer Login');
});

test('returns Sinhala translation when Sinhala is selected', () => {
  assert.equal(getTranslation('login.title', 'si'), 'අධිකාරි පුරනය වීම');
});

test('falls back to English for unknown keys', () => {
  assert.equal(getTranslation('missing.key', 'si'), 'missing.key');
});

test('returns the application wizard labels in English', () => {
  assert.equal(getTranslation('application.personal.title', 'en'), 'Personal Information');
  assert.equal(getTranslation('application.review.submit', 'en'), 'SUBMIT APPLICATION');
});

test('returns the application wizard labels in Sinhala', () => {
  assert.equal(getTranslation('application.personal.title', 'si'), 'පුද්ගලික තොරතුරු');
  assert.equal(getTranslation('application.equipment.next', 'si'), 'අවසන් පියවර');
});
