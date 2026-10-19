/**
 * render.mjs — 逐帧截取渲染器
 *
 * 原理：页面里每帧都是时间的纯函数，所以可以确定性出图，
 * 不受机器快慢、掉帧、vsync 影响。
 *
 * 环境变量：
 *   SCENE    场景文件（默认 scenes/smoke.html）
 *   W H      分辨率（默认 640x360）
 *   FPS      帧率（默认 24）
 *   SECONDS  时长（默认 2）
 *   SEED     随机种子（默认 20261019）
 *   FRAMEDIR 输出目录（默认 frames）
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const W = Number(process.env.W || 640);
const H = Number(process.env.H || 360);
const FPS = Number(process.env.FPS || 24);
const SECONDS = Number(process.env.SECONDS || 2);
const SEED = Number(process.env.SEED || 20261019);
const SCENE = process.env.SCENE || 'scenes/smoke.html';
const OUT = process.env.FRAMEDIR || 'frames';
const total = Math.round(FPS * SECONDS);

fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--force-color-profile=srgb'
  ]
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

const url =
  'file://' +
  path.resolve(SCENE) +
  '?fps=' + FPS +
  '&seconds=' + SECONDS +
  '&seed=' + SEED;

console.log('[render]', SCENE, W + 'x' + H, FPS + 'fps', SECONDS + 's', 'seed=' + SEED);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.__ready === true', { timeout: 120000 });

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.renderFrame(t), i / FPS);
  await page.screenshot({
    path: path.join(OUT, String(i).padStart(4, '0') + '.png'),
    type: 'png',
    optimizeForSpeed: true
  });
  if (i % 24 === 0) {
    console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}

await browser.close();
console.log(`DONE ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);