import { chromium } from 'playwright';

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:8080/Tetris/';

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 412, height: 760 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByText('קניות לשבת').first().click();
await page.waitForTimeout(1200);

// Add several items so the list is taller than the viewport (to test scrolling).
const input = page.getByPlaceholder('פריט חדש…');
for (let i = 1; i <= 12; i++) {
  await input.click();
  await input.fill('פריט ' + i);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
}
await page.waitForTimeout(400);

// --- Scroll test: wheel down and confirm the scroll container moved.
const beforeTop = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('div'));
  const sc = els.find((e) => e.scrollHeight > e.clientHeight + 30 && e.clientHeight > 200);
  return sc ? sc.scrollTop : -1;
});
await page.mouse.move(206, 480);
await page.mouse.wheel(0, 600);
await page.waitForTimeout(500);
const afterTop = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('div'));
  const sc = els.find((e) => e.scrollHeight > e.clientHeight + 30 && e.clientHeight > 200);
  return sc ? sc.scrollTop : -1;
});
console.log('SCROLL: before=', beforeTop, 'after=', afterTop, '=>', afterTop > beforeTop ? 'WORKS' : 'BROKEN');

// Scroll back to top for the drag test.
await page.mouse.wheel(0, -1200);
await page.waitForTimeout(400);

const labels = async () => {
  const handles = await page.getByLabel('ידית גרירה').all();
  const out = [];
  for (const h of handles.slice(0, 4)) {
    const row = h.locator('xpath=ancestor::div[1]');
    out.push((await row.innerText()).replace(/\s+/g, ' ').trim().slice(0, 16));
  }
  return out;
};

// --- Drag test: grab the first row's handle and drag it down past 2 rows.
const firstHandle = page.getByLabel('ידית גרירה').first();
const box = await firstHandle.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
const before = await labels();
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(120);
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(cx, cy + (i * 180) / 10, { steps: 2 });
  await page.waitForTimeout(25);
}
await page.mouse.up();
await page.waitForTimeout(600);
const after = await labels();
console.log('DRAG before top rows:', JSON.stringify(before));
console.log('DRAG after  top rows:', JSON.stringify(after));
console.log('DRAG:', JSON.stringify(before) !== JSON.stringify(after) ? 'ORDER CHANGED' : 'NO CHANGE');

await browser.close();
