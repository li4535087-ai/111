import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const outDir = path.join(root, 'agent_out');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--allow-file-access-from-files',
    '--disable-dev-shm-usage'
  ]
});
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('[page]', m.type(), m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('requestfailed', (r) => console.error('[requestfailed]', r.url(), r.failure()?.errorText));

const url = 'file://' + path.join(root, 'scenes/forest3.html');
console.log('[capture]', url);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 120000 });

const shots = [
  [0.5, 'agent_out/shot_a.png'],
  [4, 'agent_out/shot_b.png'],
  [8, 'agent_out/shot_c.png']
];
for (const [t, file] of shots) {
  await page.evaluate((time) => window.renderFrame(time), t);
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: path.join(root, file), type: 'png' });
  console.log('[shot]', t, file);
}
await browser.close();
