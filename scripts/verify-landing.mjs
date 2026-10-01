import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const breakpoints = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
const screenshotsDir = path.resolve('public/screenshots-landing');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function runVerification() {
  console.log('=== STARTING NEXALINK LANDING PAGE VERIFICATION ===');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Responsive & Overflow Sweep across all 8 breakpoints
  console.log('\n--- 1. Responsive & Horizontal Overflow Check ---');
  for (const width of breakpoints) {
    await page.setViewport({ width, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Wait a brief moment for intro completion or skip
    await page.evaluate(() => {
      // Clear intro to view landing directly
      sessionStorage.setItem('nexalink:intro:v1', 'true');
      document.documentElement.dataset.intro = 'done';
      const root = document.getElementById('root');
      if (root) root.removeAttribute('inert');
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('nexalink:intro-done'));
    });

    await new Promise((r) => setTimeout(r, 400));

    const metrics = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const innerW = window.innerWidth;
      const bodyScrollW = document.body.scrollWidth;
      return {
        innerWidth: innerW,
        scrollWidth: Math.max(scrollW, bodyScrollW),
        overflow: Math.max(scrollW, bodyScrollW) > innerW,
      };
    });

    console.log(
      `Breakpoint ${width}px: innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}, overflow=${metrics.overflow}`
    );

    if (width === 390 || width === 1440) {
      // Capture top hero screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `landing-${width}px-hero.png`),
      });

      // Scroll to features
      await page.evaluate(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView();
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(screenshotsDir, `landing-${width}px-features.png`),
      });

      // Scroll to accreditation
      await page.evaluate(() => {
        const el = document.getElementById('academic');
        if (el) el.scrollIntoView();
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(screenshotsDir, `landing-${width}px-academic.png`),
      });

      // Scroll to footer
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.screenshot({
        path: path.join(screenshotsDir, `landing-${width}px-footer.png`),
      });
    }
  }

  // 2. Navigation & Anchor Verification
  console.log('\n--- 2. Anchor & Navigation Verification ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  const anchors = ['overview', 'features', 'benefits', 'academic', 'departments', 'campus', 'roles'];
  for (const id of anchors) {
    const exists = await page.evaluate((elId) => {
      return Boolean(document.getElementById(elId));
    }, id);
    console.log(`Anchor #${id} exists in DOM: ${exists}`);
  }

  // 3. Touch Target Verification on 390px
  console.log('\n--- 3. Mobile Touch Target Size Verification ---');
  await page.setViewport({ width: 390, height: 844 });
  const sub44Targets = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const smallTargets = [];
    buttons.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      // Ignore hidden or 0x0 elements
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 40 || rect.height < 40) {
          // If it has touch-target-44 or is within an accessible wrapper
          const text = btn.textContent?.trim().slice(0, 30) || btn.getAttribute('aria-label') || 'unnamed';
          smallTargets.push({ text, width: rect.width, height: rect.height });
        }
      }
    });
    return smallTargets.slice(0, 10);
  });
  console.log(`Small touch targets found: ${sub44Targets.length}`);
  if (sub44Targets.length > 0) {
    console.log('Sample small targets:', sub44Targets);
  }

  // 4. Reduced Motion Toggle Verification
  console.log('\n--- 4. Reduced Motion Toggle Verification ---');
  await page.evaluate(() => {
    const footerToggle = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reduce motion')
    );
    if (footerToggle) footerToggle.click();
  });
  const motionFlag = await page.evaluate(() => {
    return {
      storage: localStorage.getItem('nexalink:reduce-motion'),
      dataset: document.documentElement.dataset.reduceMotion,
      classList: document.documentElement.classList.contains('reduce-motion'),
    };
  });
  console.log('Reduced motion toggle result:', motionFlag);

  await browser.close();
  console.log('\n=== VERIFICATION FINISHED SUCCESSFULLY ===');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
