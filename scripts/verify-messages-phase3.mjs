import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase3');
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

  // 1. Messages on Desktop (1440px)
  console.log('Navigating to Messages on 1440px desktop...');
  await page.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const desktopShot = path.join(outDir, 'messages-desktop-1440px.png');
  await page.screenshot({ path: desktopShot });
  fs.copyFileSync(desktopShot, path.join(artifactScreenshotsDir, 'messages-desktop-1440px.png'));
  console.log('Saved messages-desktop-1440px.png');

  // Verify structure and styling
  const audit = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
    const hasAllTab = tabs.some(t => t?.includes('All'));
    const hasUnreadTab = tabs.some(t => t?.includes('Unread'));
    const hasStarredTab = tabs.some(t => t?.includes('Starred'));
    const selectedRow = document.querySelector('.bg-\\[\\#F3F4F6\\]');
    const hasObsidianBar = selectedRow ? selectedRow.classList.contains('border-l-2') : false;
    const composer = document.querySelector('textarea');
    return {
      hasAllTab,
      hasUnreadTab,
      hasStarredTab,
      hasSelectedRow: !!selectedRow,
      hasObsidianBar,
      hasComposer: !!composer
    };
  });
  console.log('Desktop audit results:', audit);

  // Test composer focus hint
  console.log('Testing composer focus helper hint...');
  await page.focus('textarea');
  await new Promise(r => setTimeout(r, 300));
  const hintVisibleOnFocus = await page.evaluate(() => {
    return document.body.innerText.includes('Press Enter to send, Shift + Enter for a new line');
  });
  console.log('Hint visible on focus:', hintVisibleOnFocus);

  // 2. Mobile Viewport (390px)
  console.log('Testing mobile viewport (390px)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // In mobile, list is shown first
  const mobileListShot = path.join(outDir, 'messages-mobile-list-390px.png');
  await page.screenshot({ path: mobileListShot });
  fs.copyFileSync(mobileListShot, path.join(artifactScreenshotsDir, 'messages-mobile-list-390px.png'));
  console.log('Saved messages-mobile-list-390px.png');

  // Click on the conversation to open thread
  console.log('Clicking on conversation row to push into thread...');
  await page.evaluate(() => {
    const row = document.querySelector('h3')?.closest('div[class*="cursor-pointer"]');
    if (row) row.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileThreadShot = path.join(outDir, 'messages-mobile-thread-390px.png');
  await page.screenshot({ path: mobileThreadShot });
  fs.copyFileSync(mobileThreadShot, path.join(artifactScreenshotsDir, 'messages-mobile-thread-390px.png'));
  console.log('Saved messages-mobile-thread-390px.png');

  // Click back button to see conversation list
  console.log('Clicking back button on mobile...');
  const backClicked = await page.evaluate(() => {
    const backBtn = document.querySelector('button[title="Back to conversations"]');
    if (backBtn) {
      backBtn.click();
      return true;
    }
    return false;
  });
  console.log('Back button clicked:', backClicked);
  await new Promise(r => setTimeout(r, 600));

  await browser.close();
  console.log('Phase 3 Messages verification complete!');
}

run().catch(err => {
  console.error('Error running messages test:', err);
  process.exit(1);
});
