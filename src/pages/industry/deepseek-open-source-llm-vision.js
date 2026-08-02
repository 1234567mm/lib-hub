import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './deepseek-open-source-llm-vision.module.css';

export default function DeepseekOpenSourceLlmVision() {
  const articleUrl = useBaseUrl('/industry/deepseek-open-source-llm-vision.html');

  return (
    <Layout title="从 DeepSeek 看开源大模型发展愿景">
      <main className={styles.articlePage}>
        <iframe
          className={styles.articleFrame}
          src={articleUrl}
          title="从 DeepSeek 看开源大模型发展愿景｜梁文峰投资者交流会精华"
          loading="eager"
        />
      </main>
    </Layout>
  );
}
