import React from 'react';
import Layout from '@theme/Layout';
import { useLocation } from '@docusaurus/router';
import styles from './news-detail.module.css';

const newsItems = [
  {
    id: 'stm32h5',
    title: 'STM32H5系列发布：高性能与安全特性再升级',
    summary: 'STMicroelectronics推出全新STM32H5系列微控制器，主打高性能处理能力与硬件安全特性，适合工业控制与物联网应用。',
    content: `STMicroelectronics 近日发布了全新 STM32H5 系列微控制器，这是继 STM32H7 之后推出的高性能系列新品。

## 主要特性

- **高性能处理**：采用 ARM Cortex-M7 内核，主频高达 480MHz
- **硬件安全特性**：集成安全启动、安全存储、加密加速器等
- **丰富外设**：支持 USB 3.0、千兆以太网、CAN FD 等高速接口
- **低功耗设计**：多种低功耗模式，适合电池供电应用

## 应用场景

STM32H5 系列主要面向以下应用领域：
- 工业自动化控制系统
- 智能家居网关设备
- 物联网边缘计算节点
- 医疗电子设备

## 供货情况

STM32H5 系列现已提供样品，预计将于 2025 年第二季度正式量产。`,
    date: '2025-03-15',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/stm32h5/800/450',
    author: '山药泥酸奶',
  },
  {
    id: 'esp32c6',
    title: 'ESP32-C6全面支持Wi-Fi 6和蓝牙5.3',
    summary: '乐鑫科技宣布ESP32-C6系列芯片全面支持Wi-Fi 6协议和蓝牙5.3规范，为物联网设备提供更稳定高效的无线连接。',
    content: `乐鑫科技近日宣布，ESP32-C6 系列芯片已完成 Wi-Fi 6 和蓝牙 5.3 的全面支持升级。

## Wi-Fi 6 特性

- **更高速率**：理论峰值速率可达 600Mbps
- **更低延迟**：支持 OFDMA，明显改善多设备并发场景
- **更省电**：Target Wake Time (TWT) 技术大幅降低设备功耗

## 蓝牙 5.3 特性

- **远距离模式**：更稳定的远距离通信
- **LE Audio**：支持全新音频应用
- **同步通道**：改善音频同步性能

## 应用建议

ESP32-C6 适合以下应用场景：
- 智能家居设备
- 工业物联网传感器
- 可穿戴设备
- 智能照明系统`,
    date: '2025-03-10',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/esp32c6/800/450',
    author: '山药泥酸奶',
  },
  {
    id: 'matter13',
    title: 'Matter协议1.3版本发布：智能家居标准再完善',
    summary: '连接标准联盟发布Matter 1.3规范，新增对智能家电、充电桩等设备的支持，进一步统一智能家居生态。',
    content: `连接标准联盟（CSA）正式发布 Matter 1.3 规范，这是 Matter 协议的又一次重要更新。

## 新增设备类型

Matter 1.3 新增支持以下设备类型：
- 智能大家电（冰箱、洗衣机、烘干机等）
- 电动汽车充电桩
- 微波炉
- 洗碗机

## 性能优化

- 改善了设备配对体验
- 增强了跨平台兼容性
- 优化了本地控制响应速度

## 生态进展

目前已有超过 6000 款设备获得 Matter 认证，主流智能家居平台均已支持 Matter 协议。`,
    date: '2025-03-05',
    tags: ['技术标准'],
    image: 'https://picsum.photos/seed/matter/800/450',
    author: '山药泥酸奶',
  },
  {
    id: 'imxrt1180',
    title: 'NXP推出i.MX RT 1180跨界MCU：性能突破新高度',
    summary: '恩智浦半导体发布全新i.MX RT 1180系列，主频提升至600MHz，配备丰富的外设接口，瞄准工业与汽车应用。',
    content: `恩智浦半导体近日发布全新 i.MX RT 1180 系列跨界微控制器，这是 RT 系列的新旗舰产品。

## 核心升级

- **主频提升**：最高支持 600MHz Cortex-M7 内核
- **双核架构**：可选配 Cortex-M33 协处理器
- **存储接口**：支持 DDR4、LPDDR4，以及 QSPI NOR Flash

## 接口丰富

- 2x USB 3.0 + 2x USB 2.0
- 2x 千兆以太网（支持 TSN）
- 4x CAN FD
- MIPI CSI/LVDS 显示接口

## 应用领域

i.MX RT 1180 主要面向：
- 工业自动化（PLC、伺服控制）
- 汽车域控制器
- 人机界面（HMI）
- 边缘计算网关`,
    date: '2025-02-28',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/imxrt/800/450',
    author: '山药泥酸奶',
  },
  {
    id: 'rp2350',
    title: 'Raspberry Pi RP2350发布：双核M33架构性能提升显著',
    summary: '树莓派基金会推出RP2350芯片，采用双核ARM Cortex-M33设计，主频提升至150MHz，价格依旧亲民。',
    content: `树莓派基金会正式发布 RP2350 芯片，这是 RP2040 的全新升级继任者。

## 架构升级

- 双核 ARM Cortex-M33 设计
- 主频最高 150MHz
- 内置 520KB SRAM
- 支持高达 16MB 的外部 Flash

## 新增特性

- 内置 SHA-256 硬件加速
- 硬件随机数生成器
- 安全启动支持
- 8x 可编程 I/O (PIO) 状态机

## 定价与供货

RP2350 定价依然亲民，单芯片售价约 1 美元，预计将在 2025 年中开始供货。`,
    date: '2025-02-20',
    tags: ['芯片动态'],
    image: 'https://picsum.photos/seed/rp2350/800/450',
    author: '山药泥酸奶',
  },
  {
    id: 'thread',
    title: 'Thread协议成为智能家居首选低功耗Mesh方案',
    summary: '随着更多智能家居设备支持Thread协议，其低功耗、高稳定的Mesh网络特性得到广泛认可，市场份额快速增长。',
    content: `Thread 协议作为智能家居领域的重要无线协议，近年来发展迅速，已成为低功耗 Mesh 网络的首选方案。

## Thread 优势

- **低功耗**：得益于 IPv6 和 Mesh 网络特性
- **自组网**：支持设备自动组网，无需复杂配置
- **高稳定性**：Mesh 网络具有自动修复能力
- **本地运行**：不依赖云端，响应更快速

## 生态进展

主流智能家居平台都在积极推进 Thread 支持：
- Apple HomeKit 全面支持 Thread
- Google Home 深度集成 Thread
- Amazon Alexa 也在跟进

## 市场前景

据行业分析机构预测，到 2027 年 Thread 设备出货量将突破 10 亿台。`,
    date: '2025-02-15',
    tags: ['技术标准'],
    image: 'https://picsum.photos/seed/thread/800/450',
    author: '山药泥酸奶',
  },
];

export default function NewsDetail() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const newsId = params.get('id');
  const newsItem = newsItems.find(item => item.id === newsId);

  if (!newsItem) {
    return (
      <Layout title="文章不存在" description="您访问的文章不存在">
        <main className={styles.container}>
          <div className={styles.notFound}>
            <h1>文章不存在</h1>
            <p>您访问的文章可能已被删除或移动</p>
            <a href="/industry-news" className={styles.backButton}>
              返回列表
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={newsItem.title} description={newsItem.summary}>
      <main className={styles.container}>
        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.tags}>
              {newsItem.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>{tag}</span>
              ))}
            </div>
            <h1 className={styles.title}>{newsItem.title}</h1>
            <div className={styles.meta}>
              <span className={styles.author}>{newsItem.author}</span>
              <span className={styles.separator}>·</span>
              <span className={styles.date}>{newsItem.date}</span>
            </div>
          </header>

          <figure className={styles.cover}>
            <img src={newsItem.image} alt={newsItem.title} />
          </figure>

          <div className={styles.content}>
            {newsItem.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={index} className={styles.h2}>{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('- **')) {
                const items = paragraph.split('\n');
                return (
                  <ul key={index} className={styles.list}>
                    {items.map((item, i) => {
                      const clean = item.replace(/^- \*\*(.+?)\*\*(.+)$/, '$1：$2').replace(/^- /, '');
                      return <li key={i}>{clean}</li>;
                    })}
                  </ul>
                );
              }
              if (paragraph.match(/^\d+\./)) {
                const items = paragraph.split('\n').filter(Boolean);
                return (
                  <ol key={index} className={styles.list}>
                    {items.map((item, i) => {
                      const clean = item.replace(/^\d+\.\s*/, '');
                      return <li key={i}>{clean}</li>;
                    })}
                  </ol>
                );
              }
              return <p key={index} className={styles.paragraph}>{paragraph}</p>;
            })}
          </div>

          <footer className={styles.footer}>
            <a href="/industry-news" className={styles.backButton}>
              ← 返回行业动态
            </a>
          </footer>
        </article>
      </main>
    </Layout>
  );
}