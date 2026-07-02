import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';

/**
 * 行业动态页面 — 已迁移到博客标签页
 * 自动重定向到 /blog/tags/行业动态
 */
export default function IndustryNews() {
  const history = useHistory();

  useEffect(() => {
    history.replace('/blog/tags/行业动态');
  }, [history]);

  return (
    <Layout title="行业动态" description="嵌入式与智能硬件行业最新资讯">
      <main style={{ padding: '3rem', textAlign: 'center' }}>
        <p>正在跳转到行业动态页面...</p>
        <p>
          如果没有自动跳转，请
          <a href="/lib-hub/blog/tags/行业动态">点击这里</a>
        </p>
      </main>
    </Layout>
  );
}
