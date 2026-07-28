import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { getIndustryStories } from '../data/industryStories.mjs';
import styles from './industry-news.module.css';

function StoryCard({ story, featured = false }) {
  return (
    <Link
      className={`${styles.storyCard} ${featured ? styles.featuredCard : ''}`}
      to={story.href}
    >
      <span className={styles.storyLabel}>{featured ? '最新发布' : story.label}</span>
      <div className={styles.storyContent}>
        <h1 className={styles.storyTitle}>{story.title}</h1>
        <p className={styles.storySummary}>{story.summary}</p>
        <div className={styles.storyMeta}>
          <time dateTime={story.publishedAt}>{story.publishedAt}</time>
          <span className={styles.storyAction}>阅读专题 <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </Link>
  );
}

export default function IndustryNews() {
  const stories = getIndustryStories();
  const featuredStory = stories[0];
  const otherStories = stories.slice(1);

  return (
    <Layout title="行业动态">
      <main className={styles.showcase}>
        {featuredStory ? <StoryCard story={featuredStory} featured /> : <p className={styles.empty}>暂无专题内容。</p>}
        {otherStories.length > 0 ? (
          <section className={styles.storyGrid} aria-label="更多行业专题">
            {otherStories.map((story) => <StoryCard key={story.slug} story={story} />)}
          </section>
        ) : null}
      </main>
    </Layout>
  );
}
