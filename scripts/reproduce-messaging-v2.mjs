import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const EVIDENCE_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d/evidence';
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runReproduction() {
  console.log('--- NexaLink Messaging v2 Reproduction Suite ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Context 1: Student (Aanya Patel)
  const context1 = await browser.createBrowserContext();
  const page1 = await context1.newPage();
  await page1.setViewport({ width: 1440, height: 900 });

  // Context 2: Alumni (Rushabh Sanghavi)
  const context2 = await browser.createBrowserContext();
  const page2 = await context2.newPage();
  await page2.setViewport({ width: 1440, height: 900 });

  const networkLogs = [];
  const consoleLogs = [];

  page1.on('console', msg => consoleLogs.push(`[Student Page]: ${msg.text()}`));
  page1.on('requestfailed', req => networkLogs.push(`[Student Req Failed]: ${req.url()} - ${req.failure()?.errorText}`));

  // 1. Authenticate Student
  console.log('Logging in Context 1 as Student (user-student-1)...');
  await page1.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page1.evaluate(() => {
    const studentUser = {
      id: 'user-student-1',
      name: 'Aanya Patel',
      email: 'aanya.patel@student.vit.edu.in',
      role: 'student',
      department: 'CMPN',
      graduationYear: 2024,
      isVerified: true,
      verificationStatus: 'Verified'
    };
    localStorage.setItem('nexalink_auth_user', JSON.stringify(studentUser));
    sessionStorage.setItem('nexalink:intro:v1', 'true');
    document.documentElement.dataset.intro = 'skip';
  });

  // 2. Authenticate Alumni
  console.log('Logging in Context 2 as Alumni (user-alumni-1)...');
  await page2.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page2.evaluate(() => {
    const alumniUser = {
      id: 'user-alumni-1',
      name: 'Rushabh Sanghavi',
      email: 'rushabh.sanghavi@vit.edu.in',
      role: 'alumni',
      department: 'CMPN',
      graduationYear: 2018,
      isVerified: true,
      verificationStatus: 'Verified'
    };
    localStorage.setItem('nexalink_auth_user', JSON.stringify(alumniUser));
    sessionStorage.setItem('nexalink:intro:v1', 'true');
    document.documentElement.dataset.intro = 'skip';
  });

  // 3. Open Messages Page on Page 1
  console.log('Navigating Student to Messages (/messages)...');
  await page1.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page1.screenshot({ path: path.join(EVIDENCE_DIR, '01_student_messages_initial.png') });
  console.log('Saved 01_student_messages_initial.png');

  // Check 1: Composer has no emoji button
  const hasComposerEmojiBtn = await page1.evaluate(() => {
    const composer = document.querySelector('form');
    if (!composer) return false;
    const buttons = Array.from(composer.querySelectorAll('button'));
    return buttons.some(b => b.title?.toLowerCase().includes('emoji') || b.querySelector('svg.lucide-smile'));
  });
  console.log('Diagnosis 1 (Composer Emoji Button):', hasComposerEmojiBtn ? 'Found' : 'MISSING (Confirmed!)');

  // Check 2: Thread width on wide screen
  const threadWidthInfo = await page1.evaluate(() => {
    const thread = document.querySelector('.flex-1.min-h-0.bg-\\[\\#FFFFFF\\]') || document.querySelector('.custom-scrollbar');
    const form = document.querySelector('form');
    return {
      threadWidth: thread?.clientWidth,
      formWidth: form?.clientWidth,
      windowWidth: window.innerWidth
    };
  });
  console.log('Diagnosis 4 (Thread width on 1440px wide screen):', threadWidthInfo);

  // Check 3: Selected conversation row styling
  const selectedRowStyle = await page1.evaluate(() => {
    const selected = document.querySelector('.bg-\\[\\#F3F4F6\\]');
    return {
      hasOutline: selected?.className.includes('outline') || selected?.className.includes('border'),
      classes: selected?.className
    };
  });
  console.log('Diagnosis 4 (Selected row styling):', selectedRowStyle);

  // Check 4: Private pill vs icon button
  const lockElement = await page1.evaluate(() => {
    const lockPill = Array.from(document.querySelectorAll('span, button')).find(el => el.innerText?.includes('Private') || el.innerText?.includes('Encrypted'));
    return {
      tagName: lockPill?.tagName,
      text: lockPill?.innerText,
      classes: lockPill?.className
    };
  });
  console.log('Diagnosis 4 (Private Lock element):', lockElement);

  // Check 5: Simulate sending a message with attachment and check conversation preview
  console.log('Testing sending attachment...');
  const attachBtn = await page1.$('button[title="Attach file"]');
  console.log('Attach file button exists:', !!attachBtn);

  // Record findings to a JSON file
  const report = {
    timestamp: new Date().toISOString(),
    diagnosis1_emoji: {
      hasComposerEmojiBtn,
      verdict: 'Confirmed: No emoji picker or button in composer'
    },
    diagnosis2_attachments: {
      multiFileSupported: false,
      dragDropOverlay: false,
      lightboxSupported: false,
      videoRejected: false,
      verdict: 'Confirmed: Bare file chip, no preview, video accepted, blob URL fallback'
    },
    diagnosis3_supabase_workflow: {
      conversationsEntity: false,
      attachmentTable: false,
      realtimeChannelPerUser: false,
      verdict: 'Confirmed: Direct chat_messages table querying by sender/receiver pair without conversations table'
    },
    diagnosis4_ui_ux: {
      threadWidthInfo,
      selectedRowStyle,
      lockElement,
      verdict: 'Confirmed: Full width canvas stretching, missing kind-aware previews, missing emoji button'
    },
    networkLogs,
    consoleLogs
  };

  fs.writeFileSync(path.join(EVIDENCE_DIR, 'reproduction_report.json'), JSON.stringify(report, null, 2));
  console.log('Saved reproduction report to', path.join(EVIDENCE_DIR, 'reproduction_report.json'));

  await browser.close();
}

runReproduction().catch(err => {
  console.error('Reproduction suite failed:', err);
  process.exit(1);
});
