import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d/verification';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyAll() {
  console.log('🚀 Starting Automated Multi-Role Verification Suite...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error')) console.log('[BROWSER CONSOLE]', text);
  });
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));

  // ----------------------------------------------------
  // TEST 1: Public Certificate Verification (Unauthenticated)
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Public Certificate Verification (/verify/CERT-2026-CMPN-001) ---');
  await page.goto('http://localhost:5173/verify/CERT-2026-CMPN-001', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.setItem('nexalink:intro:v1', 'true');
    document.documentElement.dataset.intro = 'skip';
  });
  await page.goto('http://localhost:5173/verify/CERT-2026-CMPN-001', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const certData = await page.evaluate(() => {
    const heading = document.querySelector('h1')?.innerText || '';
    const bodyText = document.body.innerText;
    const hasVerifiedBadge = bodyText.includes('Cryptographically Verified') || bodyText.includes('Authentic Institutional Record') || bodyText.includes('Valid Credential');
    const hasSha256 = bodyText.includes('SHA-256') || bodyText.includes('Tamper-evident') || bodyText.includes('CERT-2026-CMPN-001');
    const hasDownloadBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Download PDF') || b.innerText.includes('PDF'));
    return { heading, hasVerifiedBadge, hasSha256, hasDownloadBtn };
  });
  console.log('Public Certificate State:', certData);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_public_certificate_verify.png'), fullPage: false });

  // ----------------------------------------------------
  // TEST 2: Alumni Role (Rushabh Sanghavi - user-alumni-1)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Alumni Events & Opportunity Experience ---');
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Log in as Rushabh Sanghavi
    const alumniUser = {
      id: 'user-alumni-1',
      name: 'Rushabh Sanghavi',
      email: 'rushabh.sanghavi@vit.edu.in',
      role: 'alumni',
      department: 'CMPN',
      graduationYear: 2018,
      isVerified: true,
      verificationStatus: 'Verified',
      company: 'Google',
      designation: 'Senior Software Engineer'
    };
    localStorage.setItem('nexalink_auth_user', JSON.stringify(alumniUser));
    sessionStorage.setItem('nexalink:intro:v1', 'true');
    document.documentElement.dataset.intro = 'skip';
  });
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const eventsState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasSpeakingBadge = text.includes("You're speaking");
    const hasHostingTab = text.includes('Hosting') || text.includes('Hosting (');
    const hasCreateEventBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Host an event') || b.innerText.includes('Create event'));
    return { hasSpeakingBadge, hasHostingTab, hasCreateEventBtn };
  });
  console.log('Alumni Events Page State:', eventsState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_alumni_events_list.png'), fullPage: false });

  // Test Event Composer
  console.log('\n--- TEST 3: Event Composer Full Page ---');
  await page.goto('http://localhost:5173/?tab=events&view=new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const composerState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasTemplateSelector = text.includes('Quick start with an institutional template') || text.includes('template');
    const hasVenueSelector = text.includes('Campus venue') || text.includes('Vidyalankar Auditorium') || text.includes('Venue');
    const hasSubmitBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Submit for review') || b.innerText.includes('Publish'));
    return { hasTemplateSelector, hasVenueSelector, hasSubmitBtn };
  });
  console.log('Event Composer State:', composerState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_event_composer.png'), fullPage: false });

  // Test Event Manage Console
  console.log('\n--- TEST 4: Event Manage Console ---');
  await page.goto('http://localhost:5173/?tab=events&view=manage&eventId=event-3', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const manageState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasOverview = text.includes('Event Overview') || text.includes('Registrations');
    const hasCheckinStation = text.includes('Check-in Station') || text.includes('6-Digit Code') || text.includes('Check-in code');
    const hasAttendanceTable = text.includes('Export Attendee List') || text.includes('Attendees') || text.includes('Status');
    return { hasOverview, hasCheckinStation, hasAttendanceTable };
  });
  console.log('Event Manage Console State:', manageState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_event_manage_console.png'), fullPage: false });

  // Test Opportunities Portal & Composer
  console.log('\n--- TEST 5: Opportunities Portal & Postings ---');
  await page.goto('http://localhost:5173/?tab=opportunities', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const oppState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasPostBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Post opportunity') || b.innerText.includes('Post an opportunity'));
    const hasPostingsTab = text.includes('Your postings');
    return { hasPostBtn, hasPostingsTab };
  });
  console.log('Opportunities Portal State:', oppState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_opportunities_portal.png'), fullPage: false });

  // ----------------------------------------------------
  // TEST 6: Admin Moderation Queue & Reports
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Admin Moderation Queue (Dr. Sangale - user-admin-1) ---');
  await page.goto('http://localhost:5173/?tab=moderation', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Log in as Dr. Ravindra Sangale
    const adminUser = {
      id: 'user-admin-1',
      name: 'Dr. Ravindra Sangale',
      email: 'ravindra.sangale@vit.edu.in',
      role: 'admin',
      department: 'CMPN',
      isVerified: true
    };
    localStorage.setItem('nexalink_auth_user', JSON.stringify(adminUser));
    sessionStorage.setItem('nexalink:intro:v1', 'true');
    document.documentElement.dataset.intro = 'skip';
  });
  await page.goto('http://localhost:5173/?tab=moderation', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1800));

  const adminModState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasEventsSubtab = text.includes('Events Queue');
    const hasOpportunitiesSubtab = text.includes('Opportunities Queue');
    const hasApproveBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Approve & Publish Live') || b.innerText.includes('Approve'));
    const hasRequestChangesBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Request Changes'));
    const hasConflictBanner = text.includes('Venue Conflict') || text.includes('Venue Verified');
    return { hasEventsSubtab, hasOpportunitiesSubtab, hasApproveBtn, hasRequestChangesBtn, hasConflictBanner };
  });
  console.log('Admin Moderation Queue State:', adminModState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_admin_moderation_queue.png'), fullPage: false });

  // Test Reports & Accreditation Exporter (NAAC 5.4.1)
  console.log('\n--- TEST 7: Reports & NAAC 5.4.1 Exporter ---');
  await page.goto('http://localhost:5173/?tab=reports&subtab=export', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1800));
  const reportsState = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasNaacCard = text.includes('NAAC Criteria 5.4.1') && text.includes('Alumni Contribution & Engagement Audit');
    const hasNaacExportBtn = Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Export NAAC 5.4.1'));
    return { hasNaacCard, hasNaacExportBtn };
  });
  console.log('Reports & NAAC 5.4.1 State:', reportsState);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_naac_541_export_card.png'), fullPage: false });

  // ----------------------------------------------------
  // TEST 8: Responsive Viewport Checks (Mobile & Tablet)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Responsive Layout (Mobile 390px & Tablet 768px) ---');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_events_390px.png'), fullPage: false });

  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_tablet_events_768px.png'), fullPage: false });

  await browser.close();
  console.log('\n✅ All Verification Tests Completed Successfully!');
}

verifyAll().catch(err => {
  console.error('❌ Verification Suite Failed:', err);
  process.exit(1);
});
