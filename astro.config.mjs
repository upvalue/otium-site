// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  base: '/',
  integrations: [
    tailwind(), 
    preact({
      include: ['**/preact/*']
    }),
    react({
      include: ['**/components/*', '**/src/components/*']
    })
  ]
});
