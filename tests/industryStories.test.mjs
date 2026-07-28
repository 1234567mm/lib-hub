import test from 'node:test';
import assert from 'node:assert/strict';
import { getIndustryStories } from '../src/data/industryStories.mjs';

test('industry stories are newest first and never use a news subdirectory', () => {
  const stories = getIndustryStories();

  assert.equal(stories.length, 1);
  assert.deepEqual(stories.map(({ slug }) => slug), ['byd-strategy']);
  assert.ok(stories.every(({ href }) => !href.includes('/news/')));
  assert.deepEqual(stories.map(({ publishedAt }) => publishedAt), [...stories]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .map(({ publishedAt }) => publishedAt));
});
