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
                      { label: 'Operating system demo', slug: 'demos/os' },
                      { label: 'Language demo', slug: 'demos/lang' },
                  ],
              },
              {
                label: 'Operating system',
                items: [
                    { label: 'About, building & running', slug: 'os/about', }
                ],
              },
              {
                label: 'Language',
                items: [    
                    { label: 'About', slug: 'lang/guide'},
                ]
              },
              {
                label: 'Development log',
                link: 'https://upvalue.io/posts/tag/otium/',
              }

              /*{
                label: 'Language',
                items: [
                    { about: 'Guide', slug:'lang/guide'},
                ]
              }*/


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