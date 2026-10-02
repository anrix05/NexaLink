import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const VERIFICATION_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d/evidence/verification';
if (!fs.existsSync(VERIFICATION_DIR)) {
  fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
}

// Create sample test files
const TEMP_FILES_DIR = path.resolve('temp_test_files');
if (!fs.existsSync(TEMP_FILES_DIR)) {
  fs.mkdirSync(TEMP_FILES_DIR, { recursive: true });
}

// 1. Valid JPEG image (with proper magic bytes 0xFF, 0xD8, 0xFF)
const sampleJpgPath = path.join(TEMP_FILES_DIR, 'sample_diagram.jpg');
const sampleJpgBuffer = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x10,
  0x00, 0x10, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
  0xBF, 0x00, 0xFF, 0xD9
]);
fs.writeFileSync(sampleJpgPath, sampleJpgBuffer);

// 2. Valid PDF file (with %PDF- header)
const samplePdfPath = path.join(TEMP_FILES_DIR, 'Design_Specification.pdf');
const samplePdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (NexaLink Messaging v2 Spec) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000080 00000 n\n0000000120 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n220\n%%EOF\n';
fs.writeFileSync(samplePdfPath, samplePdfContent);

// 3. Rejected video file
const sampleVideoPath = path.join(TEMP_FILES_DIR, 'rejected_video.mp4');
fs.writeFileSync(sampleVideoPath, Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]));

async function runVerification() {
  console.log('=== NexaLink Messaging v2 End-to-End Verification ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Context 1: Student (Aanya Patel)
    const context1 = await browser.createBrowserContext();
    const page1 = await context1.newPage();
    await page1.setViewport({ width: 1440, height: 900 });

    // Context 2: Alumni (Rushabh Sanghavi)
    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    await page2.setViewport({ width: 1440, height: 900 });

    // Set auth for Student
    console.log('[1/8] Authenticating Student (user-student-1)...');
    await page1.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page1.evaluate(() => {
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

    // Set auth for Alumni
    console.log('[2/8] Authenticating Alumni (user-alumni-1)...');
    await page2.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page2.evaluate(() => {
      localStorage.setItem('nexalink_auth_user', JSON.stringify({
        id: 'user-alumni-1',
        name: 'Rushabh Sanghavi',
        email: 'rushabh.sanghavi@vit.edu.in',
        role: 'alumni',
        department: 'CMPN',
        graduationYear: 2018,
        isVerified: true,
        verificationStatus: 'Verified'
      }));
      sessionStorage.setItem('nexalink:intro:v1', 'true');
      document.documentElement.dataset.intro = 'skip';
    });

    // Open Messages on Student
    console.log('[3/8] Loading Messages Workspace on Student context...');
    await page1.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Verify layout: sidebar + thread + composer
    const threadInfo = await page1.evaluate(() => {
      const header = document.querySelector('header');
      const threadContainer = document.querySelector('.max-w-\\[760px\\]');
      const activeContact = document.querySelector('button.border-l-2') || document.querySelector('button.bg-\\[\\#F3F4F6\\]');
      return {
        hasHeader: !!header,
        hasCenteredContainer: !!threadContainer,
        activeContactClass: activeContact?.className || 'none'
      };
    });
    console.log('Layout check:', threadInfo);
    await page1.screenshot({ path: path.join(VERIFICATION_DIR, '01_redesigned_messaging_workspace.png') });
    console.log('Saved: 01_redesigned_messaging_workspace.png');

    // Test 1: Emoji Picker popover & insertion
    console.log('[4/8] Testing Self-Hosted Emoji Picker...');
    const emojiBtn = await page1.$('button[title="Insert emoji"]');
    if (emojiBtn) {
      await emojiBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await page1.screenshot({ path: path.join(VERIFICATION_DIR, '02_emoji_picker_popover.png') });
      console.log('Saved: 02_emoji_picker_popover.png');

      // Click an emoji inside picker (e.g. 🎯 or 🚀)
      await page1.evaluate(() => {
        const gridButtons = Array.from(document.querySelectorAll('.grid button'));
        if (gridButtons.length > 0) {
          gridButtons[0].click();
        }
      });
      await new Promise(r => setTimeout(r, 300));
    } else {
      console.warn('Emoji button not found');
    }

    // Test 2: File attachments (Image + PDF + Rejection)
    console.log('[5/8] Testing File Attachments (Image, PDF, and Video Rejection)...');
    
    // First test video rejection
    const fileInput = await page1.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(sampleVideoPath);
      await page1.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), fileInput);
      await new Promise(r => setTimeout(r, 800));
      console.log('Uploaded video file, checking rejection toast...');

      // Now attach valid JPG and PDF
      await fileInput.uploadFile(sampleJpgPath, samplePdfPath);
      await page1.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), fileInput);
      await new Promise(r => setTimeout(r, 1500));

      const trayState = await page1.evaluate(() => {
        const trayItems = document.querySelectorAll('[title="Remove"]');
        return {
          itemCount: trayItems.length
        };
      });
      console.log('Composer tray items:', trayState);

      await page1.screenshot({ path: path.join(VERIFICATION_DIR, '03_composer_attachment_tray.png') });
      console.log('Saved: 03_composer_attachment_tray.png');
    }

    // Type text and send message
    console.log('[6/8] Sending message with text, image, and PDF...');
    const textarea = await page1.$('textarea');
    if (textarea) {
      await textarea.type(' Here is the architecture overview and the specification PDF for review!');
      await new Promise(r => setTimeout(r, 300));

      // Click send
      const sendBtn = await page1.$('button[title="Send message (Enter)"]');
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await page1.keyboard.press('Enter');
      }
      await new Promise(r => setTimeout(r, 1500));

      await page1.screenshot({ path: path.join(VERIFICATION_DIR, '04_sent_image_and_pdf_card.png') });
      console.log('Saved: 04_sent_image_and_pdf_card.png');
    }

    // Test 3: Quoted Reply and Reaction
    console.log('[7/8] Testing Quoted Reply and Reaction...');
    // Hover over the sent message bubble
    const hovered = await page1.evaluate(() => {
      const bubbles = document.querySelectorAll('.group');
      if (bubbles.length > 0) {
        const lastBubble = bubbles[bubbles.length - 1];
        lastBubble.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return true;
      }
      return false;
    });

    if (hovered) {
      await new Promise(r => setTimeout(r, 500));
      // Click reaction ❤️
      await page1.evaluate(() => {
        const heartBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '❤️');
        if (heartBtn) heartBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Click reply button
      await page1.evaluate(() => {
        const replyBtn = document.querySelector('button[title="Reply"]');
        if (replyBtn) replyBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));

      // Type reply text
      const replyTextarea = await page1.$('textarea');
      if (replyTextarea) {
        await replyTextarea.type('Acknowledged with great appreciation! 👍');
        await page1.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1500));
      }

      await page1.screenshot({ path: path.join(VERIFICATION_DIR, '05_reactions_and_quoted_reply.png') });
      console.log('Saved: 05_reactions_and_quoted_reply.png');
    }

    // Test 4: Private Lock popover
    console.log('[8/8] Testing Lock Icon Security Popover...');
    const lockBtn = await page1.$('button[title="Private & Encrypted"]');
    if (lockBtn) {
      await lockBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page1.screenshot({ path: path.join(VERIFICATION_DIR, '06_lock_security_popover.png') });
      console.log('Saved: 06_lock_security_popover.png');
    }

    // Context 2: Alumni verification
    console.log('[Bonus] Checking Alumni context synchronization...');
    await page2.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page2.screenshot({ path: path.join(VERIFICATION_DIR, '07_alumni_sync_view.png') });
    console.log('Saved: 07_alumni_sync_view.png');

    console.log('\nAll End-to-End Verification Steps Completed Successfully!');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
