// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;
const dirs = require('./directories.json');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
(module.exports = {
  title: '山药泥酸奶的技术窝',
  tagline: '嵌入式开发 | 智能硬件 | 知识输出',
  url: 'https://1234567mm.github.io',
  baseUrl: '/lib-hub/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: '1234567mm',
  projectName: 'lib-hub',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: undefined,
        },
        blog: {
          showReadingTime: true,
          editUrl: undefined,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.jpg',
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: '山药泥酸奶',
        logo: {
          alt: 'Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: '博客介绍',
          },
          {
            type: 'doc',
            docId: `${dirs.stm32.dir}/stm32-basics/intro`,
            position: 'left',
            label: dirs.stm32.label,
          },
          {
            type: 'doc',
            docId: `${dirs.esp32.dir}/esp32-intro`,
            position: 'left',
            label: dirs.esp32.label,
          },
          {
            type: 'doc',
            docId: `${dirs.sharing.dir}/intro`,
            position: 'left',
            label: dirs.sharing.label,
          },
          {
            type: 'doc',
            docId: `${dirs.tools.dir}/WSL2安装与基础配置`,
            position: 'left',
            label: dirs.tools.label,
          },
          {
            href: '/industry-news',
            position: 'left',
            label: dirs.industry.label,
          },
          {
            type: 'doc',
            docId: `${dirs.team.dir}/intro`,
            position: 'left',
            label: dirs.team.label,
          },
          {
            href: 'https://github.com/1234567mm/lib-hub',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '内容分区',
            items: [
              { label: '博客介绍', to: '/docs/intro' },
              { label: dirs.stm32.label, to: `/docs/${dirs.stm32.dir}/stm32-basics/intro` },
              { label: dirs.esp32.label, to: `/docs/${dirs.esp32.dir}/esp32-intro` },
              { label: dirs.sharing.label, to: `/docs/${dirs.sharing.dir}/intro` },
              { label: dirs.industry.label, to: '/industry-news' },
              { label: dirs.team.label, to: `/docs/${dirs.team.dir}/intro` },
            ],
          },
          {
            title: '社交媒体',
            items: [
              { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/5d0d7bfa000000001002850b' },
              { label: '哔哩哔哩', href: 'https://space.bilibili.com/511264524' },
              { label: '抖音', href: 'https://www.douyin.com/user/self' },
              { label: 'GitHub', href: 'https://github.com/1234567mm/lib-hub' },
            ],
          },
          {
            title: '联系我们',
            items: [
              { html: '邮箱：synsnneer@qq.com' },
              { html: 'QQ群：1007458214' },
              { html: '山药泥酸奶&嵌入式技术交流群' },
              { html: '服务时间：工作日 10:00–18:00' },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} 山药泥酸奶 · 保留所有权利`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
});
