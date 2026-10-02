import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase7');
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

const viewports = [
  { name: '1440px', width: 1440, height: 900, scale: 1 },
  { name: '1024px', width: 1024, height: 768, scale: 1 },
  { name: '768px', width: 768, height: 1024, scale: 1 },
  { name: '390px', width: 390, height: 844, scale: 2 }
];

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Login
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/?tab=auth', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => {
    localStorage.setItem('nexalink_auth_user', JSON.stringify(u));
  }, studentUser);

  const tabs = [
    { tab: 'directory', name: 'directory' },
    { tab: 'messaging', name: 'messages' },
    { tab: 'opportunities', name: 'opportunities' },
    { tab: 'events', name: 'events' }
  ];

  for (const t of tabs) {
    for (const vp of viewports) {
      console.log(`Capturing ${t.name} at ${vp.name}...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.scale });
      await page.goto(`http://localhost:5173/?tab=${t.tab}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 600));

      const filename = `${t.name}-${vp.name}.png`;
      const localPath = path.join(outDir, filename);
      await page.screenshot({ path: localPath });
      fs.copyFileSync(localPath, path.join(artifactScreenshotsDir, filename));
    }
  }

  await browser.close();
  console.log('Full responsive suite verification complete!');
}

run().catch(err => {
  console.error('Error during full suite verification:', err);
  process.exit(1);
});
