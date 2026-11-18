import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  use: { headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    {
      command: 'npm run dev -w @oneattend/web -- --port 5178 --strictPort',
      url: 'http://localhost:5178',
      reuseExistingServer: false,
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_APK_URL: '' },
    },
    {
      command:
        'npm exec -w @oneattend/mobile -- expo export --platform web --output-dir dist-test && npx serve apps/mobile/dist-test -l 4178 --no-clipboard',
      url: 'http://localhost:4178',
      reuseExistingServer: false,
      env: { EXPO_NO_DOTENV: '1', EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' },
      timeout: 120000,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
