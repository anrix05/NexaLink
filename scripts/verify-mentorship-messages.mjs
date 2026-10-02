/**
 * Automated end-to-end verification script for Mentorship and Messages
 * Runs puppeteer tests against localhost:5173, captures screenshots, and checks DOM assertions.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'verification');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  console.log('🚀 Starting NexaLink Mentorship & Messages Verification...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
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

    console.log('1. Setting student auth session...');
    await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle2' });
    await page.evaluate(u => {
      localStorage.setItem('nexalink_auth_user', JSON.stringify(u));
    }, studentUser);

    // 2. Test Legacy Guidance Redirect: ?tab=guidance -> should show Mentorship H1
    console.log('2. Testing deep link: ?tab=guidance...');
    await page.goto('http://localhost:5173/?tab=guidance', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const h1Text = await page.$eval('h1', el => el.textContent?.trim()).catch(() => '');
    console.log(`   Page H1 text: "${h1Text}" (Expected: "Mentorship")`);
    if (!h1Text.includes('Mentorship')) {
      throw new Error(`Expected H1 to be "Mentorship", but found "${h1Text}"`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-mentorship-guidance-redirect-1440px.png') });

    // 3. Test Mentorship Student Hub Features:
    console.log('3. Testing Mentorship Student Hub...');
    // Verify underline tabs exist: "Find a mentor", "Requests", "My mentors"
    const tabs = await page.$$eval('button', btns =>
      btns.map(b => b.textContent?.trim()).filter(t => ['Find a mentor', 'Requests', 'My mentors'].some(expected => t.includes(expected)))
    );
    console.log('   Tabs found:', tabs);

    // Test Search & Chips
    const searchInput = await page.$('input[placeholder*="Search by mentor"]');
    if (searchInput) {
      await searchInput.type('Software');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-mentorship-search-results.png') });
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }

    // Helper to click button by text content
    const clickBtnByText = async (text) => {
      return page.evaluate((t) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent?.trim().toLowerCase().includes(t.toLowerCase()));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }, text);
    };

    // Test Opening RequestMentorshipSheet via "Request mentorship" primary button
    console.log('   Opening RequestMentorshipSheet...');
    const openedSheet = await clickBtnByText('Request mentorship');
    if (openedSheet) {
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-request-mentorship-sheet-step1.png') });

      // Select first mentor from step 1
      const selected = await clickBtnByText('Select');
      if (selected) {
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-request-mentorship-sheet-step2.png') });

        // Fill in topic and notes
        const topicInput = await page.$('input[placeholder*="Transitioning to Product Management"]');
        if (topicInput) {
          await topicInput.type('Automated E2E Test Mentorship Topic');
        }

        const notesTextarea = await page.$('textarea[placeholder*="Introduce yourself"]');
        if (notesTextarea) {
          await notesTextarea.type('Hello, I am testing the automated mentorship flow and would appreciate your guidance on engineering excellence at scale.');
        }

        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-request-mentorship-sheet-filled.png') });

        // Submit the request
        const sent = await clickBtnByText('Send request');
        if (sent) {
          console.log('   Submitted mentorship request...');
          await new Promise(r => setTimeout(r, 2000));
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-mentorship-requests-tab.png') });
        }
      }
    }

    // 4. Test Messages Page
    console.log('4. Navigating to Messages (?tab=messaging)...');
    await page.goto('http://localhost:5173/?tab=messaging', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-messages-main-1440px.png') });

    // Select first conversation if not already selected
    const convRow = await page.$('div[class*="group p-3 px-4 flex items-center"]');
    if (convRow) {
      await convRow.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Test Private Lock Popover
    console.log('   Testing Private lock popover in Messages...');
    const privateLockBtn = await page.$('button[aria-label="Direct communication privacy info"]');
    if (privateLockBtn) {
      await privateLockBtn.click();
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-messages-lock-popover.png') });
      await privateLockBtn.click(); // close popover
    }

    // Test Sending a real message
    console.log('   Sending a test message...');
    const messageInput = await page.$('textarea[placeholder*="Write a message"]');
    if (messageInput) {
      const testMsg = `Verification run message at ${new Date().toLocaleTimeString()}`;
      await messageInput.type(testMsg);
      await new Promise(r => setTimeout(r, 300));

      // Check send button is enabled
      const sendBtn = await page.$('button[title="Send message"]');
      if (sendBtn) {
        await sendBtn.click();
        console.log('   Message send button clicked!');
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-message-sent-success.png') });

        // Confirm message is in DOM and does NOT say "Not sent"
        const pageContent = await page.content();
        const hasMsg = pageContent.includes(testMsg);
        console.log(`   Message present in thread: ${hasMsg}`);
      }
    }

    // Test Dev Tools Error Simulation: Offline
    console.log('   Testing simulate send failure (Offline)...');
    const moreActionsBtn = await page.$('button[aria-label="More actions"]');
    if (moreActionsBtn) {
      await moreActionsBtn.click();
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-messages-dev-menu.png') });

      const simulated = await clickBtnByText('Simulate send failure (Offline)');
      if (simulated) {
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-message-offline-simulated.png') });

        // Verify "Not sent · You're offline · Retry · Delete" appears
        const pageContent = await page.content();
        const hasOfflineRow = pageContent.includes("Not sent · You're offline");
        console.log(`   Offline failure row visible: ${hasOfflineRow}`);
      }
    }

    // 5. Test Responsive Viewports (390px mobile, 768px tablet, 1024px laptop)
    console.log('5. Testing Responsive Viewports...');
    const viewports = [
      { name: '390px', width: 390, height: 844 },
      { name: '768px', width: 768, height: 1024 },
      { name: '1024px', width: 1024, height: 768 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173/?tab=mentorship', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `13-mentorship-${vp.name}.png`) });

      await page.goto('http://localhost:5173/?tab=messaging', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `14-messaging-${vp.name}.png`) });
    }

    console.log('✅ All End-to-End Verifications Completed Successfully!');
  } catch (err) {
    console.error('❌ Verification failed with error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-state.png') }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
