import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ---------- inline SVG icons ---------- */
const ChipIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 9h16M4 15h16M9 4v4M15 4v4M9 16v4M15 16v4" />
  </svg>
);

const SignalIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0" />
    <path d="M1.42 9a16 16 0 0121.16 0" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4" />
    <path d="M12 2a6 6 0 00-2.9 11.3c.56.38.9.99.9 1.65V16h4v-1.05c0-.66.34-1.27.9-1.65A6 6 0 0012 2z" />
  </svg>
);

const ToolIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0L10.3 5.1a1 1 0 000 1.4l1.4 1.4a1 1 0 001.4 0z" />
    <path d="M8.5 9.6L3.2 14.9a1 1 0 000 1.4L7.7 20.8a1 1 0 001.4 0l5.3-5.3" />
    <path d="M21 3l-5.6 5.6M15 9l3-3" />
  </svg>
);

const NewsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 019 9" />
    <path d="M4 4a16 16 0 0116 16" />
    <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const UsersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const socialIcons = {
  xiaohongshu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18v14H3z" />
      <path d="M7 9l3 3-3 3M12 9h5v6" />
    </svg>
  ),
  bilibili: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 7l3-6 3 6M2 12l20 0" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
    </svg>
  ),
  douyin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 100 8 4 4 0 000-8z" />
      <path d="M15 8h.01M15 3a8 8 0 00-8 8v1M15.5 20.5a4.5 4.5 0 006.5-6.5" />
    </svg>
  ),
};

/* ---------- hero ---------- */
function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>山药泥酸奶的技术窝</h1>
        <p className={styles.heroSubtitle}>嵌入式开发 · 智能硬件 · 技术分享</p>
        <div className={styles.heroActions}>
          <Link className={styles.heroPrimary} to="/blog">查看博客</Link>
          <Link className={styles.heroSecondary} to="/docs/intro">关于本站</Link>
        </div>
      </div>
      <div className={styles.heroBg} />
    </header>
  );
}

/* ---------- section card ---------- */
const iconMap = {
  chip:  <ChipIcon />,
  signal: <SignalIcon />,
  bulb: <LightbulbIcon />,
  tool: <ToolIcon />,
  news: <NewsIcon />,
  users: <UsersIcon />,
};

function SectionCard({ title, description, to, icon }) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.cardIcon}>{iconMap[icon]}</span>
      <div>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDesc}>{description}</p>
      </div>
      <svg className={styles.cardArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ---------- sections grid ---------- */
function HomeSections() {
  const sections = [
    { title: '博客介绍', description: '了解本站的创建初衷、内容规划与未来方向。一个专注于嵌入式硬件的个人技术博客。', to: '/docs/intro', icon: 'news' },
    { title: 'STM32知识库', description: '从基础到外设，从项目实战到体系化整理。GPIO、定时器、串口通信、PWM等核心内容。', to: '/docs/stm32/stm32-basics/intro', icon: 'chip' },
    { title: 'ESP32知识库', description: '乐鑫ESP32系列开发指南，涵盖Wi-Fi蓝牙、FOC电机控制、智能小车与无刷云台。', to: '/docs/esp32/esp32-intro', icon: 'signal' },
    { title: '开发工具', description: 'WSL2配置、Ollama本地模型、Docker开发环境、Hermes Agent等开发工具指南。', to: '/docs/开发工具/WSL2安装与基础配置', icon: 'tool' },
    { title: '干货分享', description: '开发工具推荐、实用技巧总结、经验分享。帮助嵌入式开发者提升效率少走弯路。', to: '/docs/sharing/intro', icon: 'bulb' },
    { title: '行业动态', description: '嵌入式与智能硬件行业最新资讯、技术趋势与市场动态。保持对行业的敏锐洞察。', to: '/docs/industry/news/intro', icon: 'news' },
    { title: '科研团队', description: '科研项目介绍、团队成员展示、技术研究成果。记录学术探索与技术创新的点滴。', to: '/docs/team/intro', icon: 'users' },
  ];

  return (
    <section className={styles.sections}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>内容分区</h2>
        <p className={styles.sectionSubtitle}>探索不同领域的技术文章与知识分享</p>
      </div>
      <div className={styles.grid}>
        {sections.map((s, i) => <SectionCard key={i} {...s} />)}
      </div>
    </section>
  );
}

/* ---------- latest posts ---------- */
function LatestPosts() {
  return (
    <section className={styles.latest}>
      <div className={styles.latestInner}>
        <div className={styles.latestHeader}>
          <h2 className={styles.latestTitle}>最新文章</h2>
          <Link className={styles.latestMore} to="/blog">查看全部 →</Link>
        </div>
        <p className={styles.latestHint}>
          前往 <Link to="/blog">博客页面</Link> 查看所有技术文章，支持按标签和分类浏览。
        </p>
      </div>
    </section>
  );
}

/* ---------- about ---------- */
function AboutSection() {
  return (
    <section className={styles.about}>
      <div className={styles.aboutInner}>
        <div className={styles.aboutHeader}>
          <h2 className={styles.aboutTitle}>关于我</h2>
        </div>
        <div className={styles.aboutCard}>
          <div className={styles.aboutAvatar}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className={styles.aboutBody}>
            <h3 className={styles.aboutName}>山药泥酸奶</h3>
            <div className={styles.aboutTags}>
              <span className={styles.tag}>嵌入式开发工程师</span>
              <span className={styles.tag}>研究生在读</span>
            </div>
            <p className={styles.aboutBio}>
              专注于嵌入式硬件和智能硬件开发的个人爱好者，热衷于分享技术知识、整理学习心得。希望将学习过程中的点滴记录下来，帮助更多嵌入式开发者共同成长。
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.xiaohongshu.com/user/profile/5d0d7bfa000000001002850b" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                {socialIcons.xiaohongshu}<span>小红书</span>
              </a>
              <a href="https://space.bilibili.com/511264524" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                {socialIcons.bilibili}<span>哔哩哔哩</span>
              </a>
              <a href="https://github.com/1234567mm/lib-hub" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                {socialIcons.github}<span>GitHub</span>
              </a>
              <a href="https://www.douyin.com/user/self" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                {socialIcons.douyin}<span>抖音</span>
              </a>
            </div>
            <Link className={styles.aboutCta} to="/tech-radar">查看我的技术栈 →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function Home() {
  return (
    <Layout
      title="山药泥酸奶的技术窝"
      description="嵌入式开发 | 智能硬件 | 技术分享 - 专注于STM32、ESP32与嵌入式技术分享"
    >
      <HomepageHeader />
      <main>
        <HomeSections />
        <LatestPosts />
        <AboutSection />
      </main>
    </Layout>
  );
}
