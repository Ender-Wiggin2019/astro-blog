import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import { THEME_CONFIG } from "./src/theme.config";
import robotsTxt from "astro-robots-txt";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: THEME_CONFIG.website,
  prefetch: true,
  markdown: {
    shikiConfig: {
      // 选择 Shiki 内置的主题（或添加你自己的主题）
      // https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: 'github-dark',
      // 另外，也提供了多种主题
      // https://shikiji.netlify.app/guide/dual-themes#light-dark-dual-themes
      // experimentalThemes: {
      //   light: 'github-light',
      //   dark: 'github-dark',
      // },
      // 添加自定义语言
      // 注意：Shiki 内置了无数语言，包括 .astro！
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      langs: [],
      // 启用自动换行，以防止水平滚动
      wrap: true,
    },
  },
  integrations: [
    UnoCSS({
      injectReset: true
    }),
    robotsTxt(),
    sitemap()
  ]
});
