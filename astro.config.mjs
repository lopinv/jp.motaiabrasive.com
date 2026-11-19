import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ar.motaiabrasive.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  // 冗長/低品質記事は生成時に直接削除（noindex不使用）、サイトマップに全3000件を収録
  integrations: [mdx(), sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
  })],
});