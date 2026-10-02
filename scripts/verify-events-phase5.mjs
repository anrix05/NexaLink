import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase5');
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

  // 1. Events on Desktop (1440px)
  console.log('Navigating to Events on 1440px desktop...');
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const listShot = path.join(outDir, 'events-list-1440px.png');
  await page.screenshot({ path: listShot });
  fs.copyFileSync(listShot, path.join(artifactScreenshotsDir, 'events-list-1440px.png'));
  console.log('Saved events-list-1440px.png');

  // Audit elements
  const audit = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim());
    const hasTabs = ['Upcoming', 'Registered', 'Past events'].every(t =>
      document.body.innerText.includes(t)
    );
    const hasDateBlocks = !!document.querySelector('.w-14.h-14');
    const hasCategoryPill = Array.from(document.querySelectorAll('button')).some(b =>
      b.textContent?.includes('Alumni meet') || b.textContent?.includes('All categories')
    );
    return {
      titles,
      hasTabs,
      hasDateBlocks,
      hasCategoryPill
    };
  });
  console.log('Events audit results:', audit);

  // 2. Click Register on an event
  console.log('Clicking Register on the first event...');
  const rsvpSuccess = await page.evaluate(() => {
    const regBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Register');
    if (regBtn) {
      regBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Register button:', rsvpSuccess);
  await new Promise(r => setTimeout(r, 800));

  const registeredShot = path.join(outDir, 'events-registered-1440px.png');
  await page.screenshot({ path: registeredShot });
  fs.copyFileSync(registeredShot, path.join(artifactScreenshotsDir, 'events-registered-1440px.png'));
  console.log('Saved events-registered-1440px.png');

  // 3. Mobile Viewport (390px)
  console.log('Testing mobile viewport (390px)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const mobileShot = path.join(outDir, 'events-mobile-390px.png');
  await page.screenshot({ path: mobileShot });
  fs.copyFileSync(mobileShot, path.join(artifactScreenshotsDir, 'events-mobile-390px.png'));
  console.log('Saved events-mobile-390px.png');

  await browser.close();
  console.log('Phase 5 Events verification complete!');
}

run().catch(err => {
  console.error('Error running events test:', err);
  process.exit(1);
});
