import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.resolve('test-artifacts/baselines');
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

const DESKTOP_VIEWPORTS = [
  { name: '1024px', width: 1024, height: 768 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 }
];

async function runDesktopParityHarness() {
  console.log('🧪 Starting Desktop Parity Regression Harness...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  let allPassed = true;

  for (const vp of DESKTOP_VIEWPORTS) {
    console.log(`\nEvaluating desktop viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    
    // Visit landing page with intro completed flag in session to bypass waiting
    await page.goto('http://localhost:5173/?freeze=1', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.setItem('hasShownWelcomeThisSession', 'true');
      const root = document.getElementById('root');
      if (root) root.removeAttribute('inert');
      document.body.style.overflow = '';
      document.documentElement.dataset.intro = 'done';
    });
    // Reload once to apply cleared local storage
    await page.goto('http://localhost:5173/?freeze=1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Capture baseline layout rects
    const metrics = await page.evaluate(() => {
      const heroHeadline = document.querySelector('#overview h1');
      const heroCtas = document.querySelector('#overview button');
      const metricsStrip = document.getElementById('metrics') || document.querySelector('[class*="tabular-nums"]')?.closest('section');
      const scrollytelling = document.getElementById('how-it-works');
      const features = document.getElementById('features');
      const departments = document.getElementById('departments');

      return {
        headlineRect: heroHeadline ? {
          width: Math.round(heroHeadline.getBoundingClientRect().width),
          height: Math.round(heroHeadline.getBoundingClientRect().height)
        } : null,
        ctaVisible: !!heroCtas,
        scrollytellingHeight: scrollytelling ? scrollytelling.offsetHeight : null,
        featuresExists: !!features,
        departmentsExists: !!departments,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });

    console.log(`Metrics for ${vp.name}:`, metrics);

    if (metrics.hasHorizontalOverflow) {
      console.error(`❌ Horizontal overflow detected on ${vp.name}!`);
      allPassed = false;
    } else {
      console.log(`✅ No horizontal overflow on ${vp.name}.`);
    }

    if (!metrics.headlineRect || !metrics.ctaVisible || !metrics.scrollytellingHeight) {
      console.error(`❌ Critical desktop layout elements missing on ${vp.name}!`);
      allPassed = false;
    } else {
      console.log(`✅ Core layout elements validated on ${vp.name}.`);
    }

    const shotPath = path.join(BASELINE_DIR, `desktop-${vp.width}px.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved desktop baseline screenshot to ${shotPath}`);
  }

  await browser.close();

  if (!allPassed) {
    console.error('\n❌ Desktop Parity Suite FAILED!');
    process.exit(1);
  } else {
    console.log('\n✅ Desktop Parity Suite PASSED with 0 regressions!');
  }
}

runDesktopParityHarness().catch(err => {
  console.error('Error running desktop parity test:', err);
  process.exit(1);
});
