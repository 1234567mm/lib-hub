import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './tech-radar.module.css';

/** 技术能力数据 */
const skills = [
  { name: 'STM32', level: '精通', desc: '标准库/HAL库/寄存器，GPIO/定时器/ADC/DMA/USART/SPI/I2C', icon: '⚡' },
  { name: 'ESP32', level: '熟练', desc: 'Wi-Fi/蓝牙，Arduino/ESP-IDF，智能小车/云台控制', icon: '📡' },
  { name: 'RTOS', level: '熟练', desc: 'FreeRTOS/uCOS-II，任务调度/同步/IPC', icon: '🧠' },
  { name: 'C/C++', level: '精通', desc: '嵌入式C，数据结构，驱动开发', icon: '⚙️' },
  { name: 'Linux', level: '掌握', desc: 'WSL2环境，Shell脚本，基础驱动', icon: '🐧' },
  { name: '工具链', level: '掌握', desc: 'Keil/STM32CubeMX/Git/Docker/Ollama', icon: '🛠️' },
  { name: '硬件设计', level: '掌握', desc: '原理图阅读，外设选型，示波器调试', icon: '🔧' },
  { name: 'AI工具', level: '掌握', desc: 'Ollama本地模型，Hermes Agent，AI辅助开发', icon: '🤖' },
];

/** 代表项目数据 */
const projects = [
  { title: 'ESP32 二轴无刷云台', tags: ['esp32', '项目实战', 'FOC'], desc: 'IMU姿态解算 + FOC闭环控制，STM32+ESP32协同', stars: 5 },
  { title: '四轴飞行器', tags: ['stm32', '项目实战', 'PID'], desc: 'MPU6050姿态传感，互补滤波，PID飞控', stars: 4 },
  { title: '智能小车', tags: ['esp32', '项目实战'], desc: 'Wi-Fi控制 + 超声波避障 + 红外循迹', stars: 4 },
  { title: '环境监测系统', tags: ['stm32', '项目实战'], desc: '温湿度+气压传感器，数据采集上报', stars: 3 },
];

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ---------- Resume Header ---------- */
function ResumeHeader() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>山药泥酸奶</h1>
        <p className={styles.heroSubtitle}>嵌入式开发工程师 / 研究生在读</p>
        <div className={styles.resumeInfo}>
          <div className={styles.resumeItem}>
            <span className={styles.resumeLabel}>📌 定位</span>
            <span>嵌入式硬件与智能硬件开发，专注于 STM32 / ESP32 平台</span>
          </div>
          <div className={styles.resumeItem}>
            <span className={styles.resumeLabel}>🎯 方向</span>
            <span>驱动开发 · RTOS · 项目实战 · AI辅助开发</span>
          </div>
          <div className={styles.resumeItem}>
            <span className={styles.resumeLabel}>📝 博客</span>
            <span>40+ 篇技术文章，涵盖入门教程到项目实战</span>
          </div>
          <div className={styles.resumeItem}>
            <span className={styles.resumeLabel}>🔗 链接</span>
            <span>
              <a href="https://github.com/1234567mm" target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>GitHub</a>
              {" · "}
              <a href="https://space.bilibili.com/511264524" target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>哔哩哔哩</a>
              {" · "}
              <a href="https://www.xiaohongshu.com/user/profile/5d0d7bfa000000001002850b" target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>小红书</a>
            </span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <Link className={styles.heroPrimary} to="#skills">技术能力</Link>
          <Link className={styles.heroSecondary} to="#projects">精选项目</Link>
          <Link className={styles.heroSecondary} to="/blog">全部文章</Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Skills Grid ---------- */
function SkillsSection() {
  return (
    <section id="skills" className={styles.section}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>技术能力</h2>
        <p className={styles.sectionSubtitle}>长期深耕嵌入式领域，持续迭代技术栈</p>
        <div className={styles.skillsGrid}>
          {skills.map((s, i) => (
            <div key={i} className={styles.skillCard}>
              <span className={styles.skillIcon}>{s.icon}</span>
              <div className={styles.skillInfo}>
                <div className={styles.skillHeader}>
                  <h3 className={styles.skillName}>{s.name}</h3>
                  <span className={`${styles.skillLevel} ${styles[`level${s.level}`]}`}>{s.level}</span>
                </div>
                <p className={styles.skillDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Projects ---------- */
function ProjectsSection() {
  return (
    <section id="projects" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>精选项目</h2>
        <p className={styles.sectionSubtitle}>从实战中打磨的技术沉淀</p>
        <div className={styles.projectsGrid}>
          {projects.map((p, i) => (
            <div key={i} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectTitle}>{p.title}</h3>
                <div className={styles.projectStars}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <StarIcon key={j} filled={j < p.stars} />
                  ))}
                </div>
              </div>
              <p className={styles.projectDesc}>{p.desc}</p>
              <div className={styles.projectTags}>
                {p.tags.map((t, j) => (
                  <span key={j} className={styles.projectTag}>{t}</span>
                ))}
              </div>
              <Link className={styles.projectLink} to={`/blog/tags/${p.tags[0]}`}>查看相关文章 →</Link>
            </div>
          ))}
        </div>
        <div className={styles.sectionCta}>
          <Link className={styles.ctaButton} to="/blog">浏览全部技术文章 →</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function TechRadar() {
  return (
    <Layout
      title="技术甄选"
      description="山药泥酸奶的技术作品集 — 嵌入式开发、智能硬件、技术分享"
    >
      <ResumeHeader />
      <main>
        <SkillsSection />
        <ProjectsSection />
      </main>
    </Layout>
  );
}
