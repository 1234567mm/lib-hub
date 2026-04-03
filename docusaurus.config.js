// @ts-check

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

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
            docId: 'stm32/intro',
            position: 'left',
            label: 'STM32知识库',
          },
          {
            type: 'doc',
            docId: 'esp32/esp32-intro',
            position: 'left',
            label: 'ESP32知识库',
          },
          {
            type: 'doc',
            docId: 'sharing/intro',
            position: 'left',
            label: '干货分享',
          },
          {
            type: 'doc',
            docId: 'industry/intro',
            position: 'left',
            label: '行业动态',
          },
          {
            type: 'doc',
            docId: 'team/intro',
            position: 'left',
            label: '科研团队',
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
              { label: 'STM32知识库', to: '/docs/stm32/intro' },
              { label: 'ESP32知识库', to: '/docs/esp32/esp32-intro' },
              { label: '干货分享', to: '/docs/sharing/intro' },
              { label: '行业动态', to: '/docs/industry/intro' },
              { label: '科研团队', to: '/docs/team/intro' },
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
        ],
        copyright: `© ${new Date().getFullYear()} 山药泥酸奶 · Built with Docusaurus`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
});
