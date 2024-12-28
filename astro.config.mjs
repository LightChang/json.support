import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
export default defineConfig({
  site: 'https://json.support',
  base: '/',
  integrations: [
    tailwind(),
    sitemap({
      serialize: (page) => {
        page.changefreq = 'daily';
        page.priority = 1;
        for (const {regex, setting} of [
          { regex: /\/\d{4}\/\d{2}\/\d{2}\/$/, setting: { changefreq: 'yearly', priority: 0.5 } }, // URL 中包含日期，為不常變動的頁面。
          { regex: /\/\w{2}\/$/, setting: { changefreq: 'daily', priority: 0.8 } }, // URL 為類似 `/EG/` 的地區頁面，每日更新最新資料。
        ]) {
          if (regex.test(page.url)) {
            for (const [key, value] of Object.entries(setting)) {
              if (page.hasOwnProperty(key)) {
                page[key] = value;
              }
            }
            break;
          }
        }
        return page;
      }
    })
  ]
});