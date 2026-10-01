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

  // Open dev login popover and sign in as Student
  console.log('Opening dev login popover and signing in as Student...');
  const devLoginBtn = await page.waitForSelector('button ::-p-text(Dev login)');
  await devLoginBtn.click();
  await new Promise(r => setTimeout(r, 400));

  const studentBtn = await page.waitForSelector('button[title*="Aanya Patel (Student)"]');
  await studentBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  for (const width of widths) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const focusPanel = document.querySelector('div.bg-\\[\\#FAFAFA\\]');
      const statStrip = document.querySelector('div.divide-x');

      return {
        hasFocusPanel: !!focusPanel,
        hasStatStrip: !!statStrip,
        hasHorizontalScroll: scrollWidth > clientWidth,
      };
    });

    console.log(`Student Dashboard at ${width}px:`, metrics);
    const screenshotPath = path.join(outDir, `student-${width}px.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);
  }

  await browser.close();
  console.log('Student dashboard verification complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
