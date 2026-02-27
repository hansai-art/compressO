// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  site: "https://compresso.codeforreal.com",
  integrations: [mdx(), sitemap()],
  output: "static",
  outDir: "../dist",
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ["@resvg/resvg-js"],
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',

    },
  },
});
