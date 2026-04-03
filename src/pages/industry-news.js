import React from 'react';
import Layout from '@theme/Layout';
import IndustryNewsCard from '@site/src/components/IndustryNewsCard';
import styles from './industry-news.module.css';

const newsItems = [
  {
    id: 'stm32h5',
    title: 'STM32H5系列发布：高性能与安全特性再升级',
    summary: 'STMicroelectronics推出全新STM32H5系列微控制器，主打高性能处理能力与硬件安全特性，适合工业控制与物联网应用。',
    date: '2025-03-15',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/stm32h5/400/225',
    to: '/news-detail?id=stm32h5',
  },
  {
    id: 'esp32c6',
    title: 'ESP32-C6全面支持Wi-Fi 6和蓝牙5.3',
    summary: '乐鑫科技宣布ESP32-C6系列芯片全面支持Wi-Fi 6协议和蓝牙5.3规范，为物联网设备提供更稳定高效的无线连接。',
    date: '2025-03-10',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/esp32c6/400/225',
    to: '/news-detail?id=esp32c6',
  },
  {
    id: 'matter13',
    title: 'Matter协议1.3版本发布：智能家居标准再完善',
    summary: '连接标准联盟发布Matter 1.3规范，新增对智能家电、充电桩等设备的支持，进一步统一智能家居生态。',
    date: '2025-03-05',
    tags: ['技术标准'],
    image: 'https://picsum.photos/seed/matter/400/225',
    to: '/news-detail?id=matter13',
  },
  {
    id: 'imxrt1180',
    title: 'NXP推出i.MX RT 1180跨界MCU：性能突破新高度',
    summary: '恩智浦半导体发布全新i.MX RT 1180系列，主频提升至600MHz，配备丰富的外设接口，瞄准工业与汽车应用。',
    date: '2025-02-28',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/imxrt/400/225',
    to: '/news-detail?id=imxrt1180',
  },
  {
    id: 'rp2350',
    title: 'Raspberry Pi RP2350发布：双核M33架构性能提升显著',
    summary: '树莓派基金会推出RP2350芯片，采用双核ARM Cortex-M33设计，主频提升至150MHz，价格依旧亲民。',
    date: '2025-02-20',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/rp2350/400/225',
    to: '/news-detail?id=rp2350',
  },
  {
    id: 'thread',
    title: 'Thread协议成为智能家居首选低功耗Mesh方案',
    summary: '随着更多智能家居设备支持Thread协议，其低功耗、高稳定的Mesh网络特性得到广泛认可，市场份额快速增长。',
    date: '2025-02-15',
    tags: ['技术标准'],
    image: 'https://picsum.photos/seed/thread/400/225',
    to: '/news-detail?id=thread',
  },
];

function TrendingSidebar() {
  const trendingItems = [
    { title: 'STM32H5系列发布', views: '12.5k' },
    { title: 'ESP32-C6 Wi-Fi 6支持', views: '10.2k' },
    { title: 'Matter 1.3规范发布', views: '8.8k' },
    { title: 'NXP i.MX RT 1180', views: '7.3k' },
    { title: 'RP2350芯片发布', views: '6.1k' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarIcon}>🔥</span>
        <h3 className={styles.sidebarTitle}>热度排行</h3>
      </div>
      <ul className={styles.trendingList}>
        {trendingItems.map((item, index) => (
          <li key={index} className={styles.trendingItem}>
            <span className={`${styles.trendingRank} ${styles[`rank${index + 1}`]}`}>{index + 1}</span>
            <div className={styles.trendingContent}>
              <span className={styles.trendingTitle}>{item.title}</span>
              <span className={styles.trendingViews}>{item.views} 阅读</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function LatestNewsCard({ item }) {
  return (
    <a href={item.to} className={styles.latestCard}>
      <div className={styles.latestImageWrapper}>
        <img src={item.image} alt={item.title} className={styles.latestImage} />
        <span className={styles.latestBadge}>最新动态</span>
      </div>
      <div className={styles.latestContent}>
        <div className={styles.latestTags}>
          {item.tags.map((tag, index) => (
            <span key={index} className={styles.latestTag}>{tag}</span>
          ))}
        </div>
        <h2 className={styles.latestTitle}>{item.title}</h2>
        <p className={styles.latestSummary}>{item.summary}</p>
        <div className={styles.latestMeta}>
          <span className={styles.latestDate}>📅 {item.date}</span>
        </div>
      </div>
    </a>
  );
}

export default function IndustryNews() {
  const latestNews = newsItems[0];
  const otherNews = newsItems.slice(1);

  return (
    <Layout title="行业动态" description="追踪嵌入式与智能硬件行业的最新资讯、技术趋势与市场动态">
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>📰 行业动态</h1>
            <p className={styles.pageSubtitle}>追踪嵌入式与智能硬件行业的最新资讯、技术趋势与市场动态</p>
          </header>

          <div className={styles.content}>
            <div className={styles.mainContent}>
              <LatestNewsCard item={latestNews} />

              <section className={styles.newsGridSection}>
                <h2 className={styles.sectionTitle}>更多资讯</h2>
                <div className={styles.newsGrid}>
                  {otherNews.map((item, index) => (
                    <IndustryNewsCard key={index} {...item} />
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.sidebarWrapper}>
              <TrendingSidebar />
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
}
