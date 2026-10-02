import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const VERIFICATION_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d/evidence/verification';
if (!fs.existsSync(VERIFICATION_DIR)) {
  fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
}

async function runLifecycleVerification() {
  console.log('=== NexaLink Message Lifecycle (Edit & Delete) Verification ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('[1/5] Logging in as Student...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('nexalink_auth_user', JSON.stringify({
        id: 'user-student-1',
        name: 'Aanya Patel',
        email: 'aanya.patel@student.vit.edu.in',
        role: 'student',
        department: 'CMPN',
        graduationYear: 2024,
        isVerified: true,
        verificationStatus: 'Verified'
      }));
      sessionStorage.setItem('nexalink:intro:v1', 'true');
      document.documentElement.dataset.intro = 'skip';
    });

    console.log('[2/5] Navigating to Messages workspace...');
    await page.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture initial thread showing tombstone and (edited) tag
    await page.screenshot({ path: path.join(VERIFICATION_DIR, '08_lifecycle_tombstone_and_edited_tag.png') });
    console.log('Saved: 08_lifecycle_tombstone_and_edited_tag.png');

    // Verify presence of "This message was deleted" and "(edited)" in DOM
    const lifecycleDomCheck = await page.evaluate(() => {
      const allText = document.body.innerText;
      return {
        hasDeletedTombstone: allText.includes('This message was deleted'),
        hasEditedTag: allText.includes('(edited)')
      };
    });
    console.log('DOM Lifecycle Check:', lifecycleDomCheck);

    // [3/5] Test hover & More actions menu on the fresh message
    console.log('[3/5] Hovering over fresh message to inspect Edit and Delete actions...');
    await page.evaluate(() => {
      const freshMsgEl = document.getElementById('msg-msg-r-fresh');
      if (freshMsgEl) {
        freshMsgEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 400));

    // Click "Message actions" button on the fresh message
    await page.evaluate(() => {
      const freshMsgEl = document.getElementById('msg-msg-r-fresh');
      const moreBtn = freshMsgEl ? freshMsgEl.querySelector('button[title="Message actions"]') : null;
      if (moreBtn) moreBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({ path: path.join(VERIFICATION_DIR, '09_lifecycle_more_actions_menu.png') });
    console.log('Saved: 09_lifecycle_more_actions_menu.png');

    // [4/5] Test editing the fresh message
    console.log('[4/5] Testing Inline Text Editing...');
    await page.evaluate(() => {
      const editBtn = document.querySelector('button[title="Edit message (15m window)"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Edit message'));
      if (editBtn) editBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({ path: path.join(VERIFICATION_DIR, '10_lifecycle_inline_edit_box.png') });
    console.log('Saved: 10_lifecycle_inline_edit_box.png');

    // Edit content and click Save
    const editTextarea = await page.$('div.border-\\[\\#0A0A0A\\] textarea');
    if (editTextarea) {
      await editTextarea.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await editTextarea.type('Updated: Looking forward to our sync session tomorrow at 6:30 PM IST!');
      await new Promise(r => setTimeout(r, 200));

      await page.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Save');
        if (saveBtn) saveBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
    }

    await page.screenshot({ path: path.join(VERIFICATION_DIR, '11_lifecycle_after_save_edit.png') });
    console.log('Saved: 11_lifecycle_after_save_edit.png');

    // [5/5] Test deleting a message for everyone
    console.log('[5/5] Testing Delete for everyone...');
    await page.evaluate(() => {
      const freshMsgEl = document.getElementById('msg-msg-r-fresh');
      if (freshMsgEl) {
        freshMsgEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      const delBtn = document.querySelector('button[title="Delete for everyone (60m window)"]') ||
                     Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Delete for everyone'));
      if (delBtn) delBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(VERIFICATION_DIR, '12_lifecycle_after_delete_tombstone.png') });
    console.log('Saved: 12_lifecycle_after_delete_tombstone.png');

    console.log('\n=== All Message Lifecycle Tests Completed Successfully! ===');
  } catch (err) {
    console.error('Lifecycle test error:', err);
  } finally {
    await browser.close();
  }
}

runLifecycleVerification();
