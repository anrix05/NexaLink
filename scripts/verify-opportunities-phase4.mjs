import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase4');
fs.mkdirSync(outDir, { recursive: true });

const artifactScreenshotsDir = 'C:\\Users\\pbclu\\.gemini\\antigravity-ide\\brain\\4cf46d41-4323-4f07-9174-2e4e35487d6d\\screenshots';
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

const studentUser = {
  id: 'user-student-1',
  name: 'Aanya Patel',
  email: 'aanya.patel@student.vit.edu.in',
  role: 'student',
  department: 'CMPN',
  isVerified: true,
  verificationStatus: 'Verified',
  currentYear: 'BE',
  semester: 'Semester 7',
  skills: ['Python', 'Distributed Systems', 'Go', 'Docker', 'React'],
  areasOfInterest: ['Distributed Systems', 'Cloud Infrastructure'],
  isActive: true,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
};

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log('Logging in as student...');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => {
    localStorage.setItem('nexalink_auth_user', JSON.stringify(u));
  }, studentUser);

  // 1. Opportunities on Desktop (1440px)
  console.log('Navigating to Opportunities on 1440px desktop...');
  await page.goto('http://localhost:5173/?tab=opportunities', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const listShot = path.join(outDir, 'opportunities-list-1440px.png');
  await page.screenshot({ path: listShot });
  fs.copyFileSync(listShot, path.join(artifactScreenshotsDir, 'opportunities-list-1440px.png'));
  console.log('Saved opportunities-list-1440px.png');

  // Verify elements on page
  const audit = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
    const hasTaxonomyPills = Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('Full-time'));
    const hasLocationSelect = !!document.querySelector('select');
    return {
      titles,
      hasTaxonomyPills,
      hasLocationSelect
    };
  });
  console.log('Opportunities audit:', audit);

  // 2. Click first row to open detail panel
  console.log('Clicking on first opportunity row...');
  await page.evaluate(() => {
    const firstRow = document.querySelector('div[role="button"]');
    if (firstRow) firstRow.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const panelShot = path.join(outDir, 'opportunities-detail-panel-1440px.png');
  await page.screenshot({ path: panelShot });
  fs.copyFileSync(panelShot, path.join(artifactScreenshotsDir, 'opportunities-detail-panel-1440px.png'));
  console.log('Saved opportunities-detail-panel-1440px.png');

  console.log('Current URL after selecting job:', page.url());

  // Test browser back button
  console.log('Testing browser back button closes detail panel...');
  await page.goBack();
  await new Promise(r => setTimeout(r, 500));
  console.log('URL after back button:', page.url());

  // 3. Mobile Viewport (390px)
  console.log('Testing mobile viewport (390px)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?tab=opportunities', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Click on first row to open mobile bottom sheet
  await page.evaluate(() => {
    const firstRow = document.querySelector('div[role="button"]');
    if (firstRow) firstRow.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileSheetShot = path.join(outDir, 'opportunities-mobile-sheet-390px.png');
  await page.screenshot({ path: mobileSheetShot });
  fs.copyFileSync(mobileSheetShot, path.join(artifactScreenshotsDir, 'opportunities-mobile-sheet-390px.png'));
  console.log('Saved opportunities-mobile-sheet-390px.png');

  await browser.close();
  console.log('Phase 4 Opportunities verification complete!');
}

run().catch(err => {
  console.error('Error in opportunities test:', err);
  process.exit(1);
});
