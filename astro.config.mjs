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
          customCss: [
              './src/styles/global.css',
              './src/styles/custom.css',
          ],
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/upvalue/otium' }],
          sidebar: [
              {
                  label: 'Demos',
                  items: [
                      { label: 'Operating System', slug: 'demos/os' },
                      { label: 'Language', slug: 'demos/lang' },
                  ],
              },
              /*{
                  label: 'Guides',
                  items: [
                      // Each item here is one entry in the navigation menu.
                      { label: 'Example Guide', slug: 'guides/example' },
                  ],
              },
              {
                  label: 'Reference',
                  autogenerate: { directory: 'reference' },
              },*/
          ],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});