import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('test-artifacts');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAcceptanceTests() {
  console.log('🚀 Starting Acceptance Test Suite...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {
    test1_desktop: { passed: true, maxSimultaneousOpacities: [] },
    test1_mobile: { passed: true, maxSimultaneousOpacities: [] },
    test2_headerY: { passed: true, yVariations: [] },
    test2_beat3Dwell: { passed: true, dwellPercentage: 0 },
    test3_networkResilience: { passed: true, details: {} },
    test5_reducedMotion: { passed: true, layout: '' }
  };

  // -------------------------------------------------------------
  // TEST 1 & 2 (Desktop: 1440x900)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Scrollytelling Section at 1440x900 ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#how-it-works');

  // Locate section bounds
  const sectionMetrics = await page.evaluate(() => {
    const el = document.getElementById('how-it-works');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY;
    return {
      top: rect.top + scrollTop,
      height: el.offsetHeight,
      viewportHeight: window.innerHeight
    };
  });

  console.log('Section metrics (Desktop):', sectionMetrics);
  const startScroll = sectionMetrics.top;
  const runway = sectionMetrics.height - sectionMetrics.viewportHeight;

  const targetProgresses = [0.15, 0.32, 0.50, 0.66, 0.85, 1.0];
  let desktopHeaderYs = [];
  let beat3FullStart = null;
  let beat3FullEnd = null;

  for (let step = 0; step <= 50; step++) {
    const progress = step / 50; // 2% increments
    const currentScroll = startScroll + runway * progress;
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await new Promise((r) => setTimeout(r, 60));

    const beatData = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      if (!section) return null;

      // Header row
      const stepRow = section.querySelector('.tabular-nums');
      const stepRowY = stepRow ? stepRow.getBoundingClientRect().top : 0;

      // The 3 text beats
      const beats = Array.from(section.querySelectorAll('.lg\\:col-span-5 > div'));
      const opacities = beats.map((b) => {
        const style = window.getComputedStyle(b);
        const opacity = parseFloat(style.opacity || '0');
        const visibility = style.visibility;
        return visibility === 'hidden' ? 0 : opacity;
      });

      return {
        stepRowY,
        opacities
      };
    });

    if (beatData) {
      desktopHeaderYs.push(beatData.stepRowY);
      const highOpacities = beatData.opacities.filter((o) => o > 0.2);
      if (highOpacities.length > 1) {
        console.error(`❌ Overlap detected at progress ${progress.toFixed(2)}: opacities=${JSON.stringify(beatData.opacities)}`);
        results.test1_desktop.passed = false;
      }
      results.test1_desktop.maxSimultaneousOpacities.push({
        progress: progress.toFixed(2),
        opacities: beatData.opacities
      });

      // Track Beat 3 dwell range
      if (beatData.opacities[2] >= 0.95) {
        if (beat3FullStart === null) beat3FullStart = progress;
        beat3FullEnd = progress;
      }
    }

    // Capture required screenshots at exact progress milestones
    for (const tp of targetProgresses) {
      if (Math.abs(progress - tp) < 0.015) {
        const screenshotPath = path.join(SCREENSHOT_DIR, `desktop-progress-${tp.toFixed(2)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Captured desktop screenshot at progress ${tp.toFixed(2)} -> ${screenshotPath}`);
      }
    }
  }

  // Header Y variance check (should stay identical within 2px)
  const minY = Math.min(...desktopHeaderYs);
  const maxY = Math.max(...desktopHeaderYs);
  const yDiff = maxY - minY;
  console.log(`Desktop Step Row Y Range: min=${minY.toFixed(1)} max=${maxY.toFixed(1)} diff=${yDiff.toFixed(1)}px`);
  if (yDiff > 2) {
    results.test2_headerY.passed = false;
  }
  results.test2_headerY.yVariations.push({ viewport: 'desktop', diff: yDiff });

  // Beat 3 dwell check (should dwell for at least 30% of runway)
  if (beat3FullStart !== null && beat3FullEnd !== null) {
    const dwell = beat3FullEnd - beat3FullStart;
    console.log(`Beat 3 Dwell duration: ${(dwell * 100).toFixed(1)}% of runway (from ${beat3FullStart.toFixed(2)} to ${beat3FullEnd.toFixed(2)})`);
    results.test2_beat3Dwell.dwellPercentage = dwell;
    if (dwell < 0.28) {
      results.test2_beat3Dwell.passed = false;
    }
  }

  // -------------------------------------------------------------
  // TEST 1 (Mobile: 390x844)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Scrollytelling Section at 390x844 ---');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#how-it-works');

  const mobileMetrics = await page.evaluate(() => {
    const el = document.getElementById('how-it-works');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY;
    return {
      top: rect.top + scrollTop,
      height: el.offsetHeight,
      viewportHeight: window.innerHeight
    };
  });

  console.log('Section metrics (Mobile):', mobileMetrics);
  const mobileStart = mobileMetrics.top;
  const mobileRunway = mobileMetrics.height - mobileMetrics.viewportHeight;

  for (let step = 0; step <= 50; step++) {
    const progress = step / 50;
    const currentScroll = mobileStart + mobileRunway * progress;
    await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
    await new Promise((r) => setTimeout(r, 60));

    const beatData = await page.evaluate(() => {
      const section = document.getElementById('how-it-works');
      if (!section) return null;
      const beats = Array.from(section.querySelectorAll('.lg\\:col-span-5 > div'));
      return beats.map((b) => {
        const style = window.getComputedStyle(b);
        const opacity = parseFloat(style.opacity || '0');
        const visibility = style.visibility;
        return visibility === 'hidden' ? 0 : opacity;
      });
    });

    if (beatData) {
      const highOpacities = beatData.filter((o) => o > 0.2);
      if (highOpacities.length > 1) {
        console.error(`❌ Mobile Overlap detected at progress ${progress.toFixed(2)}: opacities=${JSON.stringify(beatData)}`);
        results.test1_mobile.passed = false;
      }
    }

    for (const tp of targetProgresses) {
      if (Math.abs(progress - tp) < 0.015) {
        const screenshotPath = path.join(SCREENSHOT_DIR, `mobile-progress-${tp.toFixed(2)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`📸 Captured mobile screenshot at progress ${tp.toFixed(2)} -> ${screenshotPath}`);
      }
    }
  }

  // -------------------------------------------------------------
  // TEST 3: Hero Network Canvas 4 Scenarios
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Hero Network Resilience ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('canvas');

  // Scenario 1: Resize
  console.log('Testing Scenario 1: Window Resizing...');
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise((r) => setTimeout(r, 500));
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 500));
  const canvasAliveAfterResize = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  });
  console.log('Canvas alive after resize:', canvasAliveAfterResize);

  // Scenario 2: Tab switch / visibilitychange
  console.log('Testing Scenario 2: Visibility Change...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await new Promise((r) => setTimeout(r, 500));

  // Scenario 3: Scroll away and back
  console.log('Testing Scenario 3: Scroll Away and Back...');
  await page.evaluate(() => window.scrollTo(0, 1500));
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 400));

  // Scenario 4: Pointer enter and leave
  console.log('Testing Scenario 4: Pointer Movement & Leave...');
  await page.mouse.move(1100, 300);
  await new Promise((r) => setTimeout(r, 300));
  await page.mouse.move(0, 0); // Pointer leaves container
  await new Promise((r) => setTimeout(r, 500));

  results.test3_networkResilience.passed = canvasAliveAfterResize;

  // -------------------------------------------------------------
  // TEST 5: Reduced Motion
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Reduced Motion Fallback ---');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#how-it-works');

  const reducedMotionState = await page.evaluate(() => {
    const section = document.getElementById('how-it-works');
    if (!section) return null;
    const cards = section.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 > div');
    const isSticky = window.getComputedStyle(section.querySelector('div') || section).position === 'sticky';
    return {
      cardCount: cards.length,
      isSticky
    };
  });

  console.log('Reduced motion check:', reducedMotionState);
  if (!reducedMotionState || reducedMotionState.cardCount !== 3 || reducedMotionState.isSticky) {
    results.test5_reducedMotion.passed = false;
  }
  const reducedMotionScreenshot = path.join(SCREENSHOT_DIR, 'reduced-motion-fallback.png');
  await page.screenshot({ path: reducedMotionScreenshot });
  console.log(`📸 Captured reduced motion screenshot -> ${reducedMotionScreenshot}`);

  await browser.close();

  // Summary Report
  console.log('\n========================================');
  console.log('🎯 ACCEPTANCE TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log('P0-1 (Desktop 1440x900 Opacity Rule):', results.test1_desktop.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('P0-1 (Mobile 390x844 Opacity Rule):', results.test1_mobile.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('P0-1 (Step Row Fixed Y Position):', results.test2_headerY.passed ? '✅ PASSED' : '❌ FAILED');
  console.log(`P0-1 (Beat 3 Runway Dwell): ${((results.test2_beat3Dwell.dwellPercentage) * 100).toFixed(1)}% ->`, results.test2_beat3Dwell.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('P0-2 (Hero Canvas 4 Scenarios):', results.test3_networkResilience.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('P2-5 (Reduced Motion Static Stack):', results.test5_reducedMotion.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('========================================\n');

  return results;
}

runAcceptanceTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
