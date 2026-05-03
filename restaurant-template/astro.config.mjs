import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import node from '@astrojs/node';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  output: 'server',
  adapter: isDev ? node({ mode: 'middleware' }) : netlify(),
  integrations: [react()],
  vite: {
    define: {
      __DEFINES__: '{}',
    },
  },
  security: { checkOrigin: false },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
