import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Relavoi Documentation',
  tagline: 'Privacy communication platform for the Nigerian market',
  favicon: 'img/favicon.ico',

  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'icon', type: 'image/svg+xml', href: '/img/favicon.svg' },
    },
  ],

  future: { v4: true },

  url: 'https://docs.relavoi.com',
  baseUrl: '/',

  organizationName: 'relavoi',
  projectName: 'relavoi-docs',

  // Both throw rather than warn. A warning in a build log is a broken link
  // that ships: the build goes green, Vercel deploys, and the 404 is found by
  // a reader. Six broken docs deep links reached the marketing site that way
  // (see CLAIMS.md in relavoi-site), and nothing in this repository would have
  // stopped them.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    hooks: {
      // The top-level onBrokenMarkdownLinks is deprecated in Docusaurus 3 and
      // removed in 4; this is the same setting in its current home.
      onBrokenMarkdownLinks: 'throw',
    },
  },

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
          editUrl: 'https://github.com/cicanda/relavoi-docs/edit/main/',
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
      logo: {
        alt: 'Relavoi',
        src: 'img/logo-header.svg',
        srcDark: 'img/logo-footer.svg',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { type: 'docSidebar', sidebarId: 'api', position: 'left', label: 'API Reference' },
        { type: 'docSidebar', sidebarId: 'sdks', position: 'left', label: 'SDKs' },
        { href: 'https://github.com/cicanda', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      logo: {
        alt: 'Relavoi',
        src: 'img/logo-footer.svg',
        href: '/',
        height: 40,
      },
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
            { label: 'GitHub', href: 'https://github.com/cicanda' },
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
