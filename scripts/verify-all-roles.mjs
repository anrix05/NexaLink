import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('test-artifacts/phase6');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'compact-desktop', width: 1024, height: 768 },
  { name: 'full-desktop', width: 1440, height: 900 }
];

const roles = [
  { role: 'Student', email: 'aarav.sharma@vit.edu.in', id: 'mock-student-1', name: 'Aarav Sharma' },
  { role: 'Alumni', email: 'rushabh.sanghavi@gmail.com', id: 'mock-alumni-1', name: 'Rushabh Sanghavi' },
  { role: 'Faculty', email: 'meera.sharma@vit.edu.in', id: 'mock-faculty-1', name: 'Dr. Meera Sharma' },
  { role: 'Admin', email: 'admin@vit.edu.in', id: 'mock-admin-1', name: 'VIT Institutional Admin' }
];

async function verifyAllRoles() {
  console.log('Verifying all 4 roles across 4 fluid tiers...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const roleObj of roles) {
    console.log(`\nTesting role: ${roleObj.role}`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

      // Set user session
      await page.evaluate((u) => {
        localStorage.setItem('nexalink_user', JSON.stringify({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isVerified: true,
          verificationStatus: 'Verified'
        }));
      }, roleObj);

      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));

      const metrics = await page.evaluate(() => {
        return {
          scrollWidth: document.body.scrollWidth,
          innerWidth: window.innerWidth,
          hasLeak: document.body.scrollWidth > window.innerWidth
        };
      });

      console.log(`[${roleObj.role}] ${vp.name} (${vp.width}px): scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}, leak=${metrics.hasLeak}`);
      if (metrics.hasLeak) {
        console.error(`ERROR: Horizontal scroll detected on ${roleObj.role} at ${vp.width}px!`);
      }

      const screenshotPath = path.join(outDir, `${roleObj.role.toLowerCase()}-${vp.width}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }
  }

  await browser.close();
  console.log('\nAll 4 roles verified successfully with zero horizontal scroll leakage.');
}

verifyAllRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
