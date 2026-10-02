import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/reproduce');
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

async function reproduce() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const logs = [];
  const networkRequests = [];

  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: err.toString() });
    console.error(`[BROWSER PAGEERROR]`, err);
  });

  page.on('requestfailed', req => {
    networkRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()
    });
    console.log(`[REQUEST FAILED] ${req.method()} ${req.url()}`, req.failure());
  });

  page.on('response', async res => {
    if (res.url().includes('supabase') || res.url().includes('chat') || res.status() >= 400) {
      let body = '';
      try {
        body = await res.text();
      } catch (e) {
        body = `[Could not read body: ${e.message}]`;
      }
      networkRequests.push({
        url: res.url(),
        status: res.status(),
        body: body.slice(0, 500)
      });
      console.log(`[RESPONSE] ${res.status()} ${res.url()} -> ${body.slice(0, 200)}`);
    }
  });

  console.log('1. Setting up Student User...');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => {
    localStorage.setItem('nexalink_auth_user', JSON.stringify(u));
  }, studentUser);

  // --- REPRODUCE MESSAGES ---
  console.log('\n2. Navigating to Messages (?tab=messages)...');
  await page.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const msgInitialShot = path.join(outDir, 'repro-messages-initial.png');
  await page.screenshot({ path: msgInitialShot });
  fs.copyFileSync(msgInitialShot, path.join(artifactScreenshotsDir, 'repro-messages-initial.png'));
  console.log('Saved repro-messages-initial.png');

  // Check state of Messages screen
  const messagesAudit = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('div')).filter(d => d.textContent?.includes('Not sent'));
    const failedTexts = bubbles.map(b => b.textContent?.trim());
    const placeholder = document.querySelector('textarea')?.getAttribute('placeholder');
    const privatePill = Array.from(document.querySelectorAll('span, div, button')).find(el => el.textContent?.trim() === 'Private');
    const timeElements = Array.from(document.querySelectorAll('time, span')).filter(el => el.textContent?.includes('ago') || el.textContent?.includes('am') || el.textContent?.includes('pm')).map(el => el.textContent?.trim());
    const homeNav = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Home'));
    const homeClasses = homeNav?.className;
    const homeComputedBg = homeNav ? window.getComputedStyle(homeNav).backgroundColor : null;

    return {
      failedCount: bubbles.length,
      failedTexts: failedTexts.slice(0, 5),
      placeholder,
      hasPrivatePill: !!privatePill,
      timeElements: timeElements.slice(0, 8),
      homeClasses,
      homeComputedBg
    };
  });
  console.log('Messages Audit Data:', JSON.stringify(messagesAudit, null, 2));

  // Now attempt to send a message
  console.log('Typing a test message into composer...');
  await page.focus('textarea');
  await page.keyboard.type('Hello, this is a diagnostic test message for Antigravity.');
  await new Promise(r => setTimeout(r, 400));

  const sendBtnFound = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Send message"], button[title="Send message"], button svg.lucide-send')?.closest('button');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked send button:', sendBtnFound);
  await new Promise(r => setTimeout(r, 2000));

  const msgAfterSendShot = path.join(outDir, 'repro-messages-after-send.png');
  await page.screenshot({ path: msgAfterSendShot });
  fs.copyFileSync(msgAfterSendShot, path.join(artifactScreenshotsDir, 'repro-messages-after-send.png'));
  console.log('Saved repro-messages-after-send.png');

  const afterSendAudit = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('div')).filter(d => d.textContent?.includes('Not sent'));
    return {
      failedCount: bubbles.length,
      failedElements: bubbles.map(b => b.innerText)
    };
  });
  console.log('After send audit:', JSON.stringify(afterSendAudit, null, 2));

  // --- REPRODUCE MENTORSHIP / GUIDANCE ---
  console.log('\n3. Navigating to Mentorship (?tab=mentorship)...');
  await page.goto('http://localhost:5173/?tab=mentorship', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const mentorShot = path.join(outDir, 'repro-mentorship-initial.png');
  await page.screenshot({ path: mentorShot });
  fs.copyFileSync(mentorShot, path.join(artifactScreenshotsDir, 'repro-mentorship-initial.png'));
  console.log('Saved repro-mentorship-initial.png');

  const mentorshipAudit = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent?.trim();
    const h1HasSvg = !!document.querySelector('h1 svg');
    const badge = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Mentorship') || b.textContent?.includes('Guidance'))?.textContent?.trim();
    const tabs = Array.from(document.querySelectorAll('button[role="tab"], button')).filter(b => b.textContent?.includes('Request') || b.textContent?.includes('Guidance') || b.textContent?.includes('Mentor')).map(b => b.textContent?.trim());
    const mentorCountNotice = document.body.innerText.match(/\d+ available mentors?/i)?.[0];
    const cardForm = !!document.querySelector('form, div.border.rounded-xl, div.border.rounded-2xl');

    return {
      h1,
      h1HasSvg,
      sidebarButtonText: badge,
      tabs: tabs.slice(0, 10),
      mentorCountNotice,
      cardForm
    };
  });
  console.log('Mentorship Audit Data:', JSON.stringify(mentorshipAudit, null, 2));

  // Save diagnostic report JSON
  const report = {
    messagesAudit,
    afterSendAudit,
    mentorshipAudit,
    networkRequests,
    recentLogs: logs.slice(-30)
  };

  fs.writeFileSync(path.join(outDir, 'diagnostic-report.json'), JSON.stringify(report, null, 2));
  console.log('Reproduction complete!');

  await browser.close();
}

reproduce().catch(err => {
  console.error('Reproduction failed:', err);
  process.exit(1);
});
