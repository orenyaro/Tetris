import { chromium } from 'playwright';

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:8080/Tetris/';

const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: 412, height: 760 }, deviceScaleFactor: 2 });
let ticks = 0;
page.on('console', (m) => {
  const t = m.text();
  if (t.startsWith('AS tick')) { ticks++; if (ticks <= 3 || ticks % 20 === 0) console.log('  [b]', t); }
  else if (t.startsWith('AS dir')) console.log('  [b]', t);
});

const scrollTop = () =>
  page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('div'));
    const sc = els.find((e) => e.scrollHeight > e.clientHeight + 30 && e.clientHeight > 200);
    return sc ? Math.round(sc.scrollTop) : -1;
  });

const topRows = async () => {
  const handles = await page.getByLabel('ידית גרירה').all();
  const out = [];
  for (const h of handles.slice(0, 4)) {
    const row = h.locator('xpath=ancestor::div[1]');
    out.push((await row.innerText()).replace(/\s+/g, ' ').trim().slice(0, 14));
  }
  return out;
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByText('קניות לשבת').first().click();
await page.waitForTimeout(1000);

const input = page.getByPlaceholder('פריט חדש…');
for (let i = 1; i <= 14; i++) {
  await input.click();
  await input.fill('פריט ' + i);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(45);
}
await page.mouse.move(206, 380);
await page.mouse.wheel(0, -1500);
await page.waitForTimeout(300);

// ---- Test A: drag-to-reorder (commit on release) ----
const before = await topRows();
let h = page.getByLabel('ידית גרירה').first();
let box = await h.boundingBox();
let cx = box.x + box.width / 2;
let cy = box.y + box.height / 2;
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(120);
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(cx, cy + (i * 170) / 10, { steps: 2 });
  await page.waitForTimeout(20);
}
await page.mouse.up();
await page.waitForTimeout(500);
const after = await topRows();
console.log('REORDER before:', JSON.stringify(before));
console.log('REORDER after :', JSON.stringify(after));
console.log('REORDER:', JSON.stringify(before) !== JSON.stringify(after) ? 'WORKS' : 'NO CHANGE');

// ---- Test B: auto-scroll while holding at the bottom edge ----
await page.mouse.move(206, 380);
await page.mouse.wheel(0, -1500);
await page.waitForTimeout(300);
h = page.getByLabel('ידית גרירה').first();
box = await h.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(120);
for (let i = 1; i <= 6; i++) {
  await page.mouse.move(206, box.y + (i * 320) / 6, { steps: 2 });
  await page.waitForTimeout(25);
}
const beforeHold = await scrollTop();
for (let k = 0; k < 10; k++) {
  await page.mouse.move(206, 690 + (k % 2), { steps: 1 });
  await page.waitForTimeout(120);
}
const afterHold = await scrollTop();
await page.mouse.up();
console.log('AUTOSCROLL before-hold=', beforeHold, 'after-hold=', afterHold, '=>', afterHold > beforeHold + 20 ? 'SCROLLS WHILE DRAGGING' : 'NO AUTOSCROLL');

await browser.close();
