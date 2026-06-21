import { chromium } from 'playwright';

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:8080';

const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({
  viewport: { width: 412, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

// Home screen
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/home.png' });
console.log('saved screenshots/home.png');

// Open the first list -> list detail screen
const card = page.getByText('קניות לשבת').first();
await card.click();
await page.waitForTimeout(1800);
await page.screenshot({ path: 'screenshots/list.png' });
console.log('saved screenshots/list.png');

await browser.close();
