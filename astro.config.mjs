// @ts-check
import { defineConfig } from 'astro/config';
import otium from './src/syntax/otium.mjs';

export default defineConfig({
  site: 'https://otium.sh',
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
      langs: [otium],
    },
  },
});
