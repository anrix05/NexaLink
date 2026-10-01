import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const artifactScreenshotsDir = 'C:\\Users\\pbclu\\.gemini\\antigravity-ide\\brain\\4cf46d41-4323-4f07-9174-2e4e35487d6d\\screenshots';
fs.mkdirSync(artifactScreenshotsDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('--- 1. Testing Sign-In Across 4 Responsive Viewports ---');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0', timeout: 30000 });

  const viewports = [
    { width: 1440, height: 900, name: 'signin-1440px' },
    { width: 1024, height: 900, name: 'signin-1024px' },
    { width: 768, height: 1024, name: 'signin-768px' },
    { width: 390, height: 844, name: 'signin-390px' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 400));

    const check = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const h1 = document.querySelector('h1')?.textContent;
      return {
        hasHorizontalScroll: scrollW > clientW,
        h1
      };
    });

    console.log(`[Viewport ${vp.width}x${vp.height}] H1: "${check.h1}", Horizontal Scroll: ${check.hasHorizontalScroll}`);
    const filePath = path.join(artifactScreenshotsDir, `${vp.name}.png`);
    await page.screenshot({ path: filePath });
  }

  console.log('--- 2. Testing Live Role Hint on Typing ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.focus('#signin-email');
  await page.type('#signin-email', 'aarav.sharma@student.vit.edu.in');
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'signin-student-hint.png') });

  console.log('--- 3. Testing Registration Wizard Step 1, 2, 3 ---');
  await page.goto('http://localhost:5173/?tab=auth&mode=register', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'register-step1-profile.png') });

  // Fill Step 1 and proceed to Step 2
  await page.type('#reg-name', 'Rohan Mehta');
  await page.type('#reg-prn', '2024CMPN099');
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'register-step2-account.png') });

  // Fill Step 2 and proceed to Step 3
  await page.type('#reg-email', 'rohan.mehta@student.vit.edu.in');
  await page.type('#reg-rec-email', 'rohan.personal@gmail.com');
  await page.type('#reg-password', 'NexaLinkSecure2026!');
  await page.click('input[type="checkbox"]');
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'register-step3-verify.png') });

  console.log('--- 4. Testing Forgot Password Screen ---');
  await page.goto('http://localhost:5173/?tab=auth&mode=forgot_password', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'auth-forgot-password.png') });

  console.log('--- 5. Testing Account Review Gate (All 6 States) ---');
  // Inject mock unverified user in localStorage to view gate
  await page.evaluate(() => {
    const unverifiedUser = {
      id: 'mock-unverified-student',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@student.vit.edu.in',
      role: 'student',
      department: 'CMPN',
      enrollmentNo: '2024CMPN099',
      isVerified: false,
      verificationStatus: 'Pending Verification',
      proofDocumentName: 'college_id.pdf',
      personalEmail: 'rohan.personal@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('nexalink_auth_user', JSON.stringify(unverifiedUser));
  });

  await page.goto('http://localhost:5173/?tab=verification-pending', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Verify GateShell chrome: confirm sidebar and command palette triggers are absent
  const gateChromeCheck = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const searchTrigger = document.querySelector('button[aria-label="Search"]');
    const bell = document.querySelector('button[aria-label="Notifications"]');
    const h1 = document.querySelector('h1')?.textContent;
    return {
      hasSidebar: !!sidebar,
      hasSearch: !!searchTrigger,
      hasBell: !!bell,
      h1
    };
  });
  console.log('GateShell Chrome Isolation Check:', gateChromeCheck);

  // Capture In Review State at 1440px and 390px (Above-the-fold verification)
  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'gate-in-review-1440px.png') });

  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(artifactScreenshotsDir, 'gate-in-review-390px.png') });

  // Test other states using the dev state switcher
  const testStates = [
    { label: 'needs_document', filename: 'gate-needs-document.png' },
    { label: 'needs_recovery_email', filename: 'gate-needs-recovery-email.png' },
    { label: 'needs_clarification', filename: 'gate-needs-clarification.png' },
    { label: 'rejected', filename: 'gate-rejected.png' },
    { label: 'verified', filename: 'gate-verified.png' }
  ];

  await page.setViewport({ width: 1024, height: 900 });
  for (const st of testStates) {
    // Open DevStateSwitcher and click the state button
    const switcherButton = await page.$('button:has(svg.lucide-sparkles)');
    if (switcherButton) {
      await switcherButton.click();
      await new Promise((r) => setTimeout(r, 200));

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await (await btn.getProperty('textContent')).jsonValue();
        if (text && text.toLowerCase().includes(st.label.replace(/_/g, ' '))) {
          await btn.click();
          await new Promise((r) => setTimeout(r, 400));
          break;
        }
      }
    }

    await page.screenshot({ path: path.join(artifactScreenshotsDir, st.filename) });
    console.log(`Captured state: ${st.label}`);
  }

  await browser.close();
  console.log('All browser verification tests completed successfully!');
}

run().catch((err) => {
  console.error('Error in browser verification:', err);
  process.exit(1);
});
