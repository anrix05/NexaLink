import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase2');
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

  for (const width of widths) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const navbarSignInBtn = document.querySelector('header button span')?.textContent?.includes('Sign in');
      const submitBtn = document.querySelector('form button[type="submit"]');
      const submitBtnHeight = submitBtn ? submitBtn.offsetHeight : null;
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;

      return {
        navbarHasSignIn: !!navbarSignInBtn,
        submitBtnHeight,
        hasHorizontalScroll: scrollWidth > clientWidth,
      };
    });

    console.log(`Auth Screen at ${width}px:`, metrics);
    const screenshotPath = path.join(outDir, `auth-${width}px.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);
  }

  await browser.close();
  console.log('Auth screen verification complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
