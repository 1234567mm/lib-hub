import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './shenzhen-commercial-space-cluster.module.css';

export default function ShenzhenCommercialSpaceCluster() {
  const articleUrl = useBaseUrl('/industry/shenzhen-commercial-space-cluster.html');

  return (
    <Layout title="深圳商业航天产业集群全景">
      <main className={styles.articlePage}>
        <iframe
          className={styles.articleFrame}
          src={articleUrl}
          title="深圳商业航天产业集群全景｜从火箭到卫星的深圳力量"
          loading="eager"
        />
      </main>
    </Layout>
  );
}
