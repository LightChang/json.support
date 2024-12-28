import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
export default defineConfig({
  site: 'https://json.support',
  base: '/',
  integrations: [tailwind()],
});