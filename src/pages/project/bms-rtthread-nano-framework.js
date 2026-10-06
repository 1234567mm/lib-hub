import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './bms-rtthread-nano-framework.module.css';

export default function BmsRtthreadNanoFramework() {
  const articleUrl = useBaseUrl('/projects/bms-rtthread-nano-framework.html');

  return (
    <Layout title="集中式BMS软件嵌入式开发框架">
      <main className={styles.articlePage}>
        <iframe
          className={styles.articleFrame}
          src={articleUrl}
          title="RT-Thread Nano 配置与启动逻辑说明｜admin_BMS 工程学习笔记"
          loading="eager"
        />
      </main>
    </Layout>
  );
}
