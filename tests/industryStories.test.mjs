import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getIndustryStories } from '../src/data/industryStories.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('industry stories are newest first and never use a news subdirectory', () => {
  const stories = getIndustryStories();

  assert.equal(stories.length, 1);
  assert.deepEqual(stories.map(({ slug }) => slug), ['byd-strategy']);
  assert.ok(stories.every(({ href }) => !href.includes('/news/')));
  assert.deepEqual(stories.map(({ publishedAt }) => publishedAt), [...stories]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .map(({ publishedAt }) => publishedAt));
});

test('industry page renders its primary story and has no blog-tag redirect', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/industry-news.js'), 'utf8');

  assert.match(page, /getIndustryStories/);
  assert.match(page, /stories\[0\]/);
  assert.doesNotMatch(page, /blog\/tags/);
  assert.doesNotMatch(page, /useHistory|useEffect/);
});

test('BYD detail page keeps the Docusaurus layout and loads the source article outside news', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/industry/byd-strategy.js'), 'utf8');

  assert.match(page, /@theme\/Layout/);
  assert.match(page, /byd-strategy\.html/);
  assert.doesNotMatch(page, /\/news\//);
});

test('legacy industry news document and navigation targets are removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'docs/industry/news/intro.md')), false);
  const config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8');
  const home = fs.readFileSync(path.join(root, 'src/pages/index.js'), 'utf8');

  assert.doesNotMatch(config, /docs\/industry\/news/);
  assert.doesNotMatch(home, /docs\/industry\/news/);
  assert.match(config, /to: '\/industry-news'/);
  assert.match(home, /to: '\/industry-news'/);
});
