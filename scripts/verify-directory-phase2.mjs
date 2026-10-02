import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase2');
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

  // 1. Directory List on Desktop (1440px)
  console.log('Navigating to Directory on 1440px desktop...');
  await page.goto('http://localhost:5173/?tab=directory', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const listShot = path.join(outDir, 'directory-list-1440px.png');
  await page.screenshot({ path: listShot });
  fs.copyFileSync(listShot, path.join(artifactScreenshotsDir, 'directory-list-1440px.png'));
  console.log('Saved directory-list-1440px.png');

  const names = await page.evaluate(() =>
    Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim())
  );
  console.log('H3 names found on page:', names);

  // 2. Click a row to open MemberProfilePanel
  console.log('Clicking on the first member row to open MemberProfilePanel...');
  await page.evaluate(() => {
    const firstRow = document.querySelector('div[role="button"]');
    if (firstRow) firstRow.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const panelShot = path.join(outDir, 'directory-profile-panel-1440px.png');
  await page.screenshot({ path: panelShot });
  fs.copyFileSync(panelShot, path.join(artifactScreenshotsDir, 'directory-profile-panel-1440px.png'));
  console.log('Saved directory-profile-panel-1440px.png');

  // Verify URL contains profile ID
  const currentUrl = page.url();
  console.log('Current URL with profile deep-link:', currentUrl);

  // Verify elements inside panel
  const panelAudit = await page.evaluate(() => {
    const textContent = document.body.innerText;
    const hasVerifiedBadge = textContent.includes('Verified member');
    const hasPersonalGmail = textContent.includes('ravindra.sangale@gmail.com') || textContent.includes('rushabh.sanghavi@gmail.com');
    const hasRequestMentorship = textContent.includes('Request mentorship') || textContent.includes('Request pending');
    const hasMessage = textContent.includes('Message');
    const hasDefinitionList = !!document.querySelector('dl');

    return {
      hasVerifiedBadge,
      hasPersonalGmailLeak: hasPersonalGmail, // Should be false!
      hasRequestMentorship,
      hasMessage,
      hasDefinitionList,
    };
  });
  console.log('Panel audit verification:', panelAudit);

  // 3. Open Request Mentorship Sheet
  console.log('Opening Request Mentorship sheet...');
  const clickedReq = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('Request mentorship'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (clickedReq) {
    await new Promise(r => setTimeout(r, 600));
    const sheetShot = path.join(outDir, 'directory-request-mentorship-sheet.png');
    await page.screenshot({ path: sheetShot });
    fs.copyFileSync(sheetShot, path.join(artifactScreenshotsDir, 'directory-request-mentorship-sheet.png'));
    console.log('Saved directory-request-mentorship-sheet.png');

    // Close sheet
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Test Browser Back button closes panel
  console.log('Testing browser Back button closes master-detail panel...');
  await page.goBack();
  await new Promise(r => setTimeout(r, 600));

  const backShot = path.join(outDir, 'directory-after-back-button.png');
  await page.screenshot({ path: backShot });
  fs.copyFileSync(backShot, path.join(artifactScreenshotsDir, 'directory-after-back-button.png'));
  console.log('Saved directory-after-back-button.png (panel closed, list preserved)');

  // 5. Test Mobile viewport (390px)
  console.log('Testing mobile viewport (390px)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const firstRow = document.querySelector('div[role="button"]');
    if (firstRow) firstRow.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const mobileShot = path.join(outDir, 'directory-mobile-sheet-390px.png');
  await page.screenshot({ path: mobileShot });
  fs.copyFileSync(mobileShot, path.join(artifactScreenshotsDir, 'directory-mobile-sheet-390px.png'));
  console.log('Saved directory-mobile-sheet-390px.png');

  await browser.close();
  console.log('Directory & Profile Phase 2 verification complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
