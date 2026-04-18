import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleSmall}>Welcome to</span>
          <br />
          <span className={styles.heroTitleMain}>山药泥酸奶的技术窝</span>
        </h1>
        <p className={styles.heroSubtitle}>
          嵌入式开发 · 智能硬件 · 知识输出
        </p>
        <div className={styles.heroButtons}>
          <Link className={styles.primaryButton} to="/docs/intro">
            了解更多
          </Link>
          <Link className={styles.secondaryButton} to="/docs/stm32/intro">
            开始学习
          </Link>
        </div>
      </div>
      <div className={styles.heroDecoration}></div>
    </header>
  );
}

function SectionCard({title, description, to, icon}) {
  return (
    <Link to={to} className={styles.sectionCard}>
      <div className={styles.cardIcon}>{icon}</div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      <span className={styles.cardArrow}>→</span>
    </Link>
  );
}

function HomepageSections() {
  const sections = [
    {
      title: '博客介绍',
      description: '了解这个网站的创建初衷、内容规划与未来发展方向。一个专注于嵌入式硬件和智能硬件开发的个人技术博客。',
      to: '/docs/intro',
      icon: '📖',
    },
    {
      title: 'STM32知识库',
      description: '从基础知识到外设驱动，从项目实战到体系化知识库整理。涵盖GPIO、定时器、串口通信、PWM等核心内容。',
      to: '/docs/stm32/intro',
      icon: '🔧',
    },
    {
      title: 'ESP32知识库',
      description: '乐鑫ESP32系列芯片开发指南，涵盖Wi-Fi蓝牙应用、FOC电机控制、智能小车与无刷云台项目实战。',
      to: '/docs/esp32/esp32-intro',
      icon: '📡',
    },
    {
      title: '干货分享',
      description: '开发工具推荐、实用技巧总结、行业见解与经验分享。帮助嵌入式开发者提升效率，少走弯路。',
      to: '/docs/sharing/intro',
      icon: '💡',
    },
    {
      title: '行业动态',
      description: '追踪嵌入式与智能硬件行业的最新资讯、技术趋势与市场动态。保持对行业发展的敏锐洞察。',
      to: '/docs/industry/news/intro',
      icon: '📰',
    },
    {
      title: '科研团队',
      description: '科研项目介绍、团队成员展示、技术研究成果分享。记录学术探索与技术创新的点点滴滴。',
      to: '/docs/team/intro',
      icon: '🔬',
    },
  ];

  return (
    <section className={styles.sections}>
      <div className={styles.sectionGrid}>
        {sections.map((section, idx) => (
          <SectionCard key={idx} {...section} />
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className={styles.about}>
      <div className={styles.aboutContainer}>
        <div className={styles.aboutHeader}>
          <h2 className={styles.aboutTitle}>关于我</h2>
          <div className={styles.aboutDivider}></div>
        </div>
        <div className={styles.aboutContent}>
          <div className={styles.aboutAvatar}>
            <div className={styles.avatarPlaceholder}>🍶</div>
          </div>
          <div className={styles.aboutInfo}>
            <h3 className={styles.aboutName}>山药泥酸奶</h3>
            <p className={styles.aboutTags}>
              <span className={styles.tag}>嵌入式开发工程师</span>
              <span className={styles.tag}>研究生在读</span>
            </p>
            <p className={styles.aboutBio}>
              一个专注于嵌入式硬件和智能硬件开发的个人爱好者，热衷于分享技术知识、整理学习心得。
              希望将学习过程中的点滴记录下来，帮助更多嵌入式开发者共同成长。
            </p>
            <div className={styles.socialLinks}>
              <a
                href="https://www.xiaohongshu.com/user/profile/5d0d7bfa000000001002850b"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <span className={styles.socialIcon}>📕</span>
                <span>小红书</span>
              </a>
              <a
                href="https://space.bilibili.com/511264524"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <span className={styles.socialIcon}>📺</span>
                <span>哔哩哔哩</span>
              </a>
              <a
                href="https://github.com/1234567mm/lib-hub"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <span className={styles.socialIcon}>🐙</span>
                <span>GitHub</span>
              </a>
              <a
                href="https://www.douyin.com/user/self"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <span className={styles.socialIcon}>🎵</span>
                <span>抖音</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="山药泥酸奶的技术窝"
      description="嵌入式开发 | 智能硬件 | 知识输出 - 专注于STM32、智能硬件与嵌入式技术分享"
    >
      <HomepageHeader />
      <main>
        <HomepageSections />
        <AboutSection />
      </main>
    </Layout>
  );
}
