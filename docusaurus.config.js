// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').DocusaurusConfig} */
(module.exports = {
  title: '山药泥酸奶的技术窝',
  tagline: '嵌入式开发 | 智能硬件 | 技术分享',
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

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['zh', 'en'],
      },
    ],
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/1234567mm/lib-hub/edit/main/',
        },
        blog: {
          blogTitle: '技术博客',
          blogDescription: '嵌入式开发技术分享',
          blogSidebarCount: 10,
          postsPerPage: 10,
          showReadingTime: true,
          editUrl: 'https://github.com/1234567mm/lib-hub/edit/main/',
          feedOptions: {
            type: ['rss', 'atom'],
            title: '山药泥酸奶的技术博客',
            description: '嵌入式开发技术分享',
            language: 'zh-Hans',
          },
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
          { to: '/', label: '首页', position: 'left' },
          { to: '/tech-radar', label: '技术甄选', position: 'left' },
          {
            type: 'dropdown',
            label: 'STM32',
            position: 'left',
            items: [
              { to: '/docs/stm32/stm32-basics/intro', label: '基础知识' },
              { to: '/docs/stm32/stm32-peripherals/intro', label: '外设驱动' },
              { to: '/docs/stm32/stm32-projects/intro', label: '项目实战' },
            ],
          },
          { to: '/docs/esp32/esp32-intro', label: 'ESP32', position: 'left' },
          { to: '/docs/sharing/intro', label: '干货分享', position: 'left' },
          { to: '/docs/开发工具/WSL2安装与基础配置', label: '开发工具', position: 'left' },
          { to: '/docs/industry/news/intro', label: '行业动态', position: 'left' },
          { to: '/docs/intro', label: '关于', position: 'left' },
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
            title: '导航',
            items: [
              { label: '首页', to: '/' },
              { label: '博客', to: '/blog' },
              { label: '标签', to: '/blog/tags' },
              { label: '归档', to: '/blog/archive' },
              { label: '关于', to: '/docs/intro' },
            ],
          },
          {
            title: '内容分区',
            items: [
              { label: 'STM32', to: '/docs/stm32/stm32-basics/intro' },
              { label: 'ESP32', to: '/docs/esp32/esp32-intro' },
              { label: '干货分享', to: '/docs/sharing/intro' },
              { label: '行业动态', to: '/docs/industry/news/intro' },
              { label: '开发工具', to: '/docs/开发工具/WSL2安装与基础配置' },
            ],
          },
          {
            title: '社交媒体',
            items: [
              { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/5d0d7bfa000000001002850b' },
              { label: '哔哩哔哩', href: 'https://space.bilibili.com/511264524' },
              { label: 'GitHub', href: 'https://github.com/1234567mm/lib-hub' },
              { label: 'RSS', to: '/blog/rss.xml' },
            ],
          },
          {
            title: '联系方式',
            items: [
              { html: '邮箱：synsnneer@qq.com' },
              { html: 'QQ群：1007458214' },
              { html: '山药泥酸奶&amp;嵌入式技术交流群' },
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
