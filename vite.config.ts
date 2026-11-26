import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mal-app/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,json}'] },
      manifest: {
        name: 'EnteTaino',
        short_name: 'EnteTaino',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        start_url: '/mal-app/',
        scope: '/mal-app/',
      },
    }),
  ],
});
