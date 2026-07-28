import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './byd-strategy.module.css';

export default function BydStrategy() {
  const articleUrl = useBaseUrl('/industry/byd-strategy.html');

  return (
    <Layout title="比亚迪战略全景">
      <main className={styles.articlePage}>
        <iframe
          className={styles.articleFrame}
          src={articleUrl}
          title="比亚迪战略全景｜从电池厂到全球科技帝国的四化征途"
          loading="eager"
        />
      </main>
    </Layout>
  );
}
