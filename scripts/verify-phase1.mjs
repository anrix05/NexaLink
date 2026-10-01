import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase1');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const widths = [390, 768, 1024, 1440];

  console.log('Navigating to http://localhost:5173/?tab=auth...');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0', timeout: 30000 });

  // Click Student demo login button
  console.log('Logging in as demo student...');
  await page.waitForSelector('button[title*="Aanya Patel (Student)"]');
  await page.click('button[title*="Aanya Patel (Student)"]');
  await new Promise(r => setTimeout(r, 1200));

  for (const width of widths) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const topBar = document.querySelector('header');
      const sidebar = document.querySelector('aside');
      const bottomNav = document.querySelector('nav[aria-label="Mobile Bottom Navigation"]');
      const main = document.querySelector('main');
      const sidebarComputed = sidebar ? window.getComputedStyle(sidebar) : null;
      const bottomNavComputed = bottomNav ? window.getComputedStyle(bottomNav) : null;

      return {
        topBarHeight: topBar ? topBar.offsetHeight : null,
        sidebarWidth: sidebar ? sidebar.offsetWidth : null,
        sidebarDisplay: sidebarComputed ? sidebarComputed.display : 'none',
        sidebarVisible: sidebarComputed ? sidebarComputed.display !== 'none' : false,
        bottomNavVisible: bottomNavComputed ? bottomNavComputed.display !== 'none' : false,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        mainPaddingLeft: main ? window.getComputedStyle(main).paddingLeft : null,
      };
    });

    console.log(`Width ${width}px:`, metrics);
    const screenshotPath = path.join(outDir, `shell-${width}px.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);
  }

  // Also test admin role to verify identical 240px geometry!
  console.log('\nTesting Admin role sidebar geometry at 1440px...');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0' });
  await page.waitForSelector('button[title*="Dr. Sunita Rawat (Admin)"]');
  await page.click('button[title*="Dr. Sunita Rawat (Admin)"]');
  await new Promise(r => setTimeout(r, 1200));
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 600));

  const adminMetrics = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    return {
      sidebarWidth: sidebar ? sidebar.offsetWidth : null,
      sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : 'none',
    };
  });
  console.log('Admin 1440px metrics:', adminMetrics);
  const adminScreenshotPath = path.join(outDir, 'shell-admin-1440px.png');
  await page.screenshot({ path: adminScreenshotPath, fullPage: false });
  console.log(`Saved admin screenshot to ${adminScreenshotPath}`);

  await browser.close();
  console.log('Phase 1 browser verification complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
