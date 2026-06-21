import { chromium } from 'playwright';

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:8080/Tetris/';
const ITEMS = ['חלה', 'יין לקידוש', 'ירקות לסלט', 'עוף'];

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByText('קניות לשבת').first().click();
await page.waitForTimeout(1500);

async function order() {
  const ys = [];
  for (const t of ITEMS) {
    const box = await page.getByText(t, { exact: true }).first().boundingBox().catch(() => null);
    if (box) ys.push({ t, y: box.y });
  }
  return ys.sort((a, b) => a.y - b.y).map((o) => o.t);
}

console.log('before:', (await order()).join(' , '));

// Long-press "חלה" (top item) and drag it down past two items.
const handle = page.getByText('חלה', { exact: true }).first();
const box = await handle.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(320); // trigger long-press → drag
for (let i = 1; i <= 12; i++) {
  await page.mouse.move(cx, cy + (i * 200) / 12, { steps: 2 });
  await page.waitForTimeout(20);
}
await page.waitForTimeout(150);
await page.mouse.up();
await page.waitForTimeout(800);

console.log('after: ', (await order()).join(' , '));
await page.screenshot({ path: 'screenshots/after-drag.png' });
await browser.close();
