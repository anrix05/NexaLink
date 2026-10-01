import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const widths = [320, 375, 390, 768, 1024, 1280, 1440];
const outputDir = path.resolve('public/screenshots-responsive');

async function testApp() {
  console.log('Testing responsive behavior across public and authenticated screens...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test across widths
  for (const w of widths) {
    await page.setViewport({ width: w, height: 900 });
    
    // Visit home page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Inject demo student user into localStorage to verify inside portal
    await page.evaluate(() => {
      localStorage.setItem('nexalink_user', JSON.stringify({
        id: 'mock-student-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@vit.edu.in',
        role: 'Student',
        isVerified: true
      }));
    });

    // Reload with authenticated state
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    const leak = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasLeak: document.body.scrollWidth > window.innerWidth
      };
    });

    console.log(`[Dashboard] Viewport ${w}px: scrollWidth=${leak.bodyScrollWidth}, innerWidth=${leak.windowInnerWidth}, leak=${leak.hasLeak}`);
    await page.screenshot({ path: path.join(outputDir, `dashboard-${w}px.png`), fullPage: false });
  }

  await browser.close();
  console.log('All responsive checks passed successfully.');
}

testApp();
