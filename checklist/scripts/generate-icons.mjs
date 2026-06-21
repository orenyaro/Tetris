import { chromium } from 'playwright';

const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TILE = '#1A1B20'; // dark tile
const ORANGE = '#FFA94D'; // light-orange check

// Rounded tile (transparent corners) — used for the "any" icons.
const rounded = (check) => `
  <rect width="512" height="512" rx="116" fill="${TILE}"/>
  ${check}
`;
// Full-bleed tile — used for maskable + Apple (the OS applies its own mask).
const square = (check) => `
  <rect width="512" height="512" fill="${TILE}"/>
  ${check}
`;

const bigCheck = `<path d="M150 268 L223 341 L372 166" fill="none" stroke="${ORANGE}"
  stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>`;
// Smaller check kept inside the maskable "safe zone".
const safeCheck = `<path d="M178 272 L236 330 L342 188" fill="none" stroke="${ORANGE}"
  stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>`;

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">${inner}</svg>`;

const targets = [
  { file: 'icon-512.png', size: 512, body: rounded(bigCheck), transparent: true },
  { file: 'icon-192.png', size: 192, body: rounded(bigCheck), transparent: true },
  { file: 'icon-maskable-512.png', size: 512, body: square(safeCheck), transparent: false },
  { file: 'apple-touch-icon.png', size: 180, body: square(bigCheck), transparent: false },
  { file: 'favicon.png', size: 48, body: rounded(bigCheck), transparent: true },
];

const browser = await chromium.launch({ executablePath: EXEC });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  await page.setContent(
    `<body style="margin:0;width:${t.size}px;height:${t.size}px">${svg(t.body)}</body>`,
  );
  await page.screenshot({
    path: `public/${t.file}`,
    omitBackground: t.transparent,
    clip: { x: 0, y: 0, width: t.size, height: t.size },
  });
  await page.close();
  console.log('wrote public/' + t.file);
}
await browser.close();
