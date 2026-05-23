import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Relavoi Documentation',
  tagline: 'Privacy communication platform for the Nigerian market',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: 'https://docs.relavoi.com',
  baseUrl: '/',

  organizationName: 'relavoi',
  projectName: 'relavoi-docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/relavoi/relavoi-docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/relavoi-social.png',
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'Relavoi',
      logo: { alt: 'Relavoi', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { type: 'docSidebar', sidebarId: 'api', position: 'left', label: 'API Reference' },
        { type: 'docSidebar', sidebarId: 'sdks', position: 'left', label: 'SDKs' },
        { href: 'https://github.com/relavoi', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/introduction' },
            { label: 'Getting Started', to: '/getting-started/signup' },
            { label: 'API Reference', to: '/api-reference/authentication' },
          ],
        },
        {
          title: 'SDKs',
          items: [
            { label: 'Android (Kotlin)', to: '/sdks/android/installation' },
            { label: 'iOS (Swift)', to: '/sdks/ios/installation' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'Status', href: 'https://status.relavoi.com' },
            { label: 'GitHub', href: 'https://github.com/relavoi' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Relavoi.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['kotlin', 'swift', 'bash', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
