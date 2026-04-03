import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function IndustryNewsCard({ title, summary, date, image, tags, to }) {
  return (
    <Link to={to} className={styles.card}>
      <div className={styles.imageWrapper}>
        {image ? (
          <img src={image} alt={title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>📰</div>
        )}
        {tags && tags.length > 0 && (
          <span className={styles.tag}>{tags[0]}</span>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {summary && <p className={styles.summary}>{summary}</p>}
        <div className={styles.meta}>
          <span className={styles.date}>📅 {date}</span>
        </div>
      </div>
    </Link>
  );
}
