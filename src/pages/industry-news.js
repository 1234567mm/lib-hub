import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import IndustryNewsCard from '@site/src/components/IndustryNewsCard';
import styles from './industry-news.module.css';

const initialNewsItems = [
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

const STORAGE_KEY = 'industry_news_views';
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1小时

function getStoredViews() {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // 检查是否过期（超过1小时）
      if (Date.now() - data.timestamp < UPDATE_INTERVAL) {
        return data.views;
      }
    }
  } catch (e) {}
  return {};
}

function saveViews(views) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      views,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

// 模拟随机热度增长
function simulateViews(newsItems, currentViews) {
  const updatedViews = { ...currentViews };
  newsItems.forEach(item => {
    const baseViews = currentViews[item.id] || Math.floor(Math.random() * 500) + 100;
    // 每次模拟增加0-30随机阅读量
    const increment = Math.floor(Math.random() * 30);
    updatedViews[item.id] = baseViews + increment;
  });
  return updatedViews;
}

function formatViews(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function TrendingSidebar({ newsItems }) {
  const [views, setViews] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  // 初始化阅读量
  useEffect(() => {
    const storedViews = getStoredViews();
    if (Object.keys(storedViews).length === 0) {
      // 初始化随机阅读量
      const initialViews = {};
      newsItems.forEach(item => {
        initialViews[item.id] = Math.floor(Math.random() * 500) + 100;
      });
      setViews(initialViews);
      saveViews(initialViews);
    } else {
      setViews(storedViews);
    }
    setLastUpdate(new Date());
  }, [newsItems]);

  // 定时更新热度
  useEffect(() => {
    const interval = setInterval(() => {
      setViews(currentViews => {
        const updated = simulateViews(newsItems, currentViews);
        saveViews(updated);
        setLastUpdate(new Date());
        return updated;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [newsItems]);

  // 根据阅读量排序
  const trendingItems = newsItems
    .map(item => ({
      ...item,
      views: views[item.id] || 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarIcon}>🔥</span>
        <h3 className={styles.sidebarTitle}>热度排行</h3>
      </div>
      {lastUpdate && (
        <div className={styles.updateTime}>
          更新于 {lastUpdate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <ul className={styles.trendingList}>
        {trendingItems.map((item, index) => (
          <li key={item.id} className={styles.trendingItem}>
            <span className={`${styles.trendingRank} ${styles[`rank${index + 1}`]}`}>{index + 1}</span>
            <div className={styles.trendingContent}>
              <Link to={`/news-detail?id=${item.id}`} className={styles.trendingTitleLink}>
                <span className={styles.trendingTitle}>{item.title}</span>
              </Link>
              <span className={styles.trendingViews}>{formatViews(item.views)} 阅读</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function LatestNewsCard({ item }) {
  return (
    <Link to={item.to} className={styles.latestCard}>
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
    </Link>
  );
}

export default function IndustryNews() {
  const latestNews = initialNewsItems[0];
  const otherNews = initialNewsItems.slice(1);

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
                  {otherNews.map((item) => (
                    <IndustryNewsCard key={item.id} {...item} />
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.sidebarWrapper}>
              <TrendingSidebar newsItems={initialNewsItems} />
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
}
