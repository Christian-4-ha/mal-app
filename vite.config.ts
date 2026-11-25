import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mal-app/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,json}'] },
      manifest: {
        name: 'Taino',
        short_name: 'Taino',
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
