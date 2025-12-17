// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
      react(),
      starlight({
          title: 'otium',
          logo: {
              src: './public/otium-favicon.png',
          },
          components: {
              ThemeSelect: './src/components/ThemeSelect.astro',
          },
          customCss: [
              './src/styles/global.css',
              './src/styles/custom.css',
          ],
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/upvalue/otium' }],
          sidebar: [
              {
                  label: 'Demos',
                  items: [
                      { label: 'Operating system demo', slug: 'demos/os' },
                  ],
              },
              {
                label: 'Development log',
                link: 'https://upvalue.io/posts/tag/otium/',
              }
          ],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});