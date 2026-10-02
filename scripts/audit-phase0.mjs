import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase0');
fs.mkdirSync(outDir, { recursive: true });

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

  console.log('Setting authenticated session...');
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => {
    localStorage.setItem('nexalink_auth_user', JSON.stringify(u));
  }, studentUser);

  // 1. Directory & Profile Modal
  console.log('Testing Directory & Profile Modal...');
  await page.goto('http://localhost:5173/?tab=directory', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot directory list
  await page.screenshot({ path: path.join(outDir, 'audit-directory-list.png') });
  console.log('Captured audit-directory-list.png');

  // Open modal by clicking on a member card (e.g. Dr. Ravindra Sangale or Rushabh Sanghavi)
  const viewCardBtn = await page.$('button ::-p-text(Request Guidance), button ::-p-text(View profile)');
  if (viewCardBtn) {
    await viewCardBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, 'audit-directory-modal.png') });
    console.log('Captured audit-directory-modal.png');
  }

  // 2. Messages (NexaChats)
  console.log('Testing Messages...');
  await page.goto('http://localhost:5173/?tab=messaging', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'audit-messages.png') });
  console.log('Captured audit-messages.png');

  // 3. Opportunities
  console.log('Testing Opportunities...');
  await page.goto('http://localhost:5173/?tab=opportunities', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'audit-opportunities.png') });
  console.log('Captured audit-opportunities.png');

  // 4. Events
  console.log('Testing Events...');
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, 'audit-events.png') });
  console.log('Captured audit-events.png');

  await browser.close();
  console.log('All Phase 0 audit screenshots captured successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
