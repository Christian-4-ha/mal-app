import { defineConfig, devices } from '@playwright/test';

const tablet = { viewport: { width: 1180, height: 820 }, hasTouch: true };

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...tablet } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], ...tablet } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/mal-app/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
