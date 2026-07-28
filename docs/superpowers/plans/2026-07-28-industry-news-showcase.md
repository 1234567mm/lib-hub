# 行业动态专题展示页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将行业动态改为无旧 news 内容的专题网格页，并以保留原样式的比亚迪专题作为唯一初始内容。

**Architecture:** 新增一个纯数据模块，将专题按日期降序输出；行业动态路由使用该数据构建一个“首项主卡 + 响应式网格”的入口页。专题原始 HTML 放在 `static/industry/`，由一个带 Docusaurus `Layout` 的页面以同源 iframe 承载，从而同时保留网站导航和源页面的样式、脚本与二级导航。

**Tech Stack:** Docusaurus 3、React 18、CSS Modules、Node.js 内置 `node:test`、原生 HTML/CSS/JavaScript。

---

### Task 1: 专题数据与排序约束

**Files:**
- Create: `src/data/industryStories.mjs`
- Create: `tests/industryStories.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/industryStories.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` for `src/data/industryStories.mjs`.

- [ ] **Step 3: Write the minimal data module**

```js
const stories = [
  {
    slug: 'byd-strategy',
    href: '/industry/byd-strategy',
    publishedAt: '2026-07-28',
    title: '比亚迪战略全景｜从电池厂到全球科技帝国的「四化」征途',
    summary: '从电动化、智能化、高端化到全球化，梳理比亚迪的战略全景与工程师文化。',
    label: '深度专题',
  },
];

export function getIndustryStories() {
  return [...stories].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}
```

- [ ] **Step 4: Run the data test to verify it passes**

Run: `node --test tests/industryStories.test.mjs`

Expected: one passing test and zero failures.

- [ ] **Step 5: Commit the data constraint**

```bash
git add src/data/industryStories.mjs tests/industryStories.test.mjs
git commit -m "test: define industry story ordering"
```

### Task 2: 行业动态入口页与响应式模块展示

**Files:**
- Modify: `src/pages/industry-news.js`
- Create: `src/pages/industry-news.module.css`

- [ ] **Step 1: Write the failing page-source test**

Append the following test to `tests/industryStories.test.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('industry page renders its primary story and has no blog-tag redirect', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/industry-news.js'), 'utf8');

  assert.match(page, /getIndustryStories/);
  assert.match(page, /stories\[0\]/);
  assert.doesNotMatch(page, /blog\/tags/);
  assert.doesNotMatch(page, /useHistory|useEffect/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/industryStories.test.mjs`

Expected: the second test fails because `industry-news.js` still redirects to the blog tag page.

- [ ] **Step 3: Replace the redirect page with the metadata-driven showcase**

Replace `src/pages/industry-news.js` with a `Layout` page that imports `Link`, `getIndustryStories`, and `industry-news.module.css`; it renders `stories[0]` in a `featuredCard`, renders `stories.slice(1)` in a `storyGrid`, and renders only the text `暂无专题内容。` when there are no stories.  The title is `行业动态`, and there is no descriptive heading or blog/news list.

```jsx
const stories = getIndustryStories();
const [featuredStory, ...otherStories] = stories;

return (
  <Layout title="行业动态">
    <main className={styles.showcase}>
      {featuredStory ? <StoryCard story={featuredStory} featured /> : <p className={styles.empty}>暂无专题内容。</p>}
      {otherStories.length > 0 && <section className={styles.storyGrid}>{otherStories.map((story) => <StoryCard key={story.slug} story={story} />)}</section>}
    </main>
  </Layout>
);
```

- [ ] **Step 4: Add layout styles**

Create `src/pages/industry-news.module.css` with a centered 1120px container, a full-width featured card, a `repeat(auto-fit, minmax(280px, 1fr))` grid, visible keyboard focus styles, and a 640px media query that reduces card padding and stacks metadata. Do not add a page heading or introduction.

- [ ] **Step 5: Run the page-source and data tests to verify they pass**

Run: `node --test tests/industryStories.test.mjs`

Expected: two passing tests and zero failures.

- [ ] **Step 6: Commit the showcase page**

```bash
git add src/pages/industry-news.js src/pages/industry-news.module.css tests/industryStories.test.mjs
git commit -m "feat: add industry showcase page"
```

### Task 3: 保留样式的专题详情页

**Files:**
- Create: `static/industry/byd-strategy.html`
- Create: `src/pages/industry/byd-strategy.js`
- Create: `src/pages/industry/byd-strategy.module.css`

- [ ] **Step 1: Write the failing page-source test**

Append this test to `tests/industryStories.test.mjs`:

```js
test('BYD detail page keeps the Docusaurus layout and loads the source article outside news', () => {
  const page = fs.readFileSync(path.join(root, 'src/pages/industry/byd-strategy.js'), 'utf8');

  assert.match(page, /@theme\/Layout/);
  assert.match(page, /byd-strategy\.html/);
  assert.doesNotMatch(page, /\/news\//);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/industryStories.test.mjs`

Expected: the third test fails because the detail page does not exist.

- [ ] **Step 3: Add the original standalone page unchanged in `static/industry/byd-strategy.html`**

Copy the supplied `比亚迪战略全景之四化征途.html` byte-for-byte to `static/industry/byd-strategy.html`. Its original CSS, interactions, page-level navigation, and mobile breakpoints remain intact.

- [ ] **Step 4: Add the Docusaurus detail-page wrapper**

Create `src/pages/industry/byd-strategy.js` with a `Layout` and a same-origin iframe whose source comes from `useBaseUrl('/industry/byd-strategy.html')`. Include an explicit title and an iframe `title`, and use `loading="eager"` so the complete first/only article is ready on entry.

```jsx
<Layout title="比亚迪战略全景">
  <main className={styles.articlePage}>
    <iframe className={styles.articleFrame} src={articleUrl} title="比亚迪战略全景｜从电池厂到全球科技帝国的四化征途" />
  </main>
</Layout>
```

- [ ] **Step 5: Add responsive iframe framing styles**

Create `src/pages/industry/byd-strategy.module.css` so the iframe fills the available width, has no visible border, has `min-height: calc(100vh - var(--ifm-navbar-height))`, and uses a viewport-based height on desktop and mobile. The Docusaurus navigation remains outside the frame, above the source page's own second-level navigation.

- [ ] **Step 6: Run the detail-page and data tests to verify they pass**

Run: `node --test tests/industryStories.test.mjs`

Expected: three passing tests and zero failures.

- [ ] **Step 7: Commit the detail page**

```bash
git add static/industry/byd-strategy.html src/pages/industry/byd-strategy.js src/pages/industry/byd-strategy.module.css tests/industryStories.test.mjs
git commit -m "feat: add BYD industry feature"
```

### Task 4: 移除旧 news 内容并修复全站入口

**Files:**
- Delete: `docs/industry/news/intro.md`
- Modify: `src/pages/index.js`
- Modify: `docusaurus.config.js`
- Modify: `tests/industryStories.test.mjs`

- [ ] **Step 1: Write the failing removal test**

Append this test to `tests/industryStories.test.mjs`:

```js
test('legacy industry news document and navigation targets are removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'docs/industry/news/intro.md')), false);
  const config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8');
  const home = fs.readFileSync(path.join(root, 'src/pages/index.js'), 'utf8');

  assert.doesNotMatch(config, /docs\/industry\/news/);
  assert.doesNotMatch(home, /docs\/industry\/news/);
  assert.match(config, /to: '\/industry-news'/);
  assert.match(home, /to: '\/industry-news'/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/industryStories.test.mjs`

Expected: the legacy document and the home/config navigation targets still exist.

- [ ] **Step 3: Remove the legacy content and update all entries**

Delete `docs/industry/news/intro.md`. Change the home-page “行业动态” section target and both navbar/footer industry targets in `docusaurus.config.js` from `/docs/industry/news/intro` to `/industry-news`. Keep all labels unchanged.

- [ ] **Step 4: Run the complete test file to verify it passes**

Run: `node --test tests/industryStories.test.mjs`

Expected: four passing tests and zero failures.

- [ ] **Step 5: Commit the removed legacy content and links**

```bash
git add -u docs/industry/news/intro.md docusaurus.config.js src/pages/index.js tests/industryStories.test.mjs
git commit -m "refactor: remove legacy industry news"
```

### Task 5: 生产构建验证

**Files:**
- Verify only: all files above

- [ ] **Step 1: Run the full test suite**

Run: `node --test tests/industryStories.test.mjs`

Expected: four passing tests and zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Docusaurus generates `build/` with exit code 0; warnings about existing non-industry links are noted but do not change the implementation scope.

- [ ] **Step 3: Inspect generated routes and static asset**

Run: `Test-Path build/industry-news/index.html; Test-Path build/industry/byd-strategy/index.html; Test-Path build/industry/byd-strategy.html`

Expected: all three commands return `True`.

- [ ] **Step 4: Commit verified implementation state**

```bash
git add src static docs docusaurus.config.js tests
git commit -m "feat: publish industry showcase"
```

## Plan Self-Review

- Spec coverage: Tasks 1–2 cover sorted module-only listing with latest at the top; Task 3 preserves the supplied layout while retaining the site navbar; Task 4 removes the old news document and every known navigation entry; Task 5 verifies build artifacts.
- Placeholder scan: no TODO/TBD or undefined implementation labels remain.
- Consistency: all content URLs use `/industry/byd-strategy` for the wrapper and `/industry/byd-strategy.html` for the static source, neither of which uses a `news` subdirectory.
