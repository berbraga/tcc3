import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'firefox',
    headless: true,
    trace: 'retain-on-failure'
  },
  webServer: [
    { command: 'node tests/e2e/start-api.mjs', url: 'http://127.0.0.1:3333/api/v1/health', timeout: 120_000, reuseExistingServer: false },
    { command: 'npm run dev -w @eduitsm/web -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', timeout: 120_000, reuseExistingServer: false, env: { VITE_API_URL: 'http://127.0.0.1:3333/api/v1' } }
  ]
});
