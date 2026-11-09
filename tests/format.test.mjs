import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colorFor, fileSize, isEmail, isPhoto, sameDay, splitLinks } from '../js/core/format.js';

test('links are split without touching other text', () => {
  assert.deepEqual(splitLinks('see https://a.co now').map((p) => p.link), [false, true, false]);
  assert.equal(splitLinks('javascript:alert(1)')[0].link, false);
});
test('only safe image types display inline', () => {
  assert.equal(isPhoto('image/png'), true);
  assert.equal(isPhoto('image/svg+xml'), false);
  assert.equal(isPhoto('text/html'), false);
});
test('email check', () => { assert.equal(isEmail('a@b.co'), true); assert.equal(isEmail('a@b'), false); });
test('sizes', () => assert.equal(fileSize(2 * 1024 * 1024), '2.0 מ״ב'));
test('avatar color is stable', () => assert.equal(colorFor('x'), colorFor('x')));
test('same day', () => assert.equal(sameDay('2026-01-01T10:00:00', '2026-01-01T11:00:00'), true));
