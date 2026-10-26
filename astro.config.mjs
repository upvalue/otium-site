// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { documentTitle, documentLinks, redirects } from './src/docs.mjs';
import validateLinks from './scripts/check-links.mjs';
import otium from './src/syntax/otium.mjs';

export default defineConfig({
  site: 'https://otium.sh',
  redirects,
  integrations: [validateLinks()],
  markdown: {
    processor: satteri({ mdastPlugins: [documentLinks, documentTitle] }),
    shikiConfig: {
      theme: 'tokyo-night',
      langs: [otium],
    },
  },
});
