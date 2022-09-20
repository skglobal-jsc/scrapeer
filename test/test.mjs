import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDescriptionFromDom } from '../dist/index.modern.mjs';

// Node 18+ support UT test, does need mocha or jest anymore.
// Read more: https://nodejs.org/api/test.html
test('generateDescriptionFromDom', (_t) => {
  assert.equal(true, true);
});
