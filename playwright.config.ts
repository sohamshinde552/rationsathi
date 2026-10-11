import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Google Chrome Desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'Google Chrome Mobile Viewport',
      use: {
        ...devices['Pixel 7'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npx ts-node src/server.ts',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
