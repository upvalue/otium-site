// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://otium.sh',
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
    },
  },
});
