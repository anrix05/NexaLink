import puppeteer from 'puppeteer';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Authenticating as Alumni...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
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

  console.log('Navigating to Events list...');
  await page.goto('http://localhost:5173/?tab=events', { waitUntil: 'networkidle2' });

  // Wait for loading spinner to disappear and event cards to be present
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Loading event schedules...') &&
           document.querySelectorAll('.aspect-video').length > 0;
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 800));

  // 1. Screenshot Events list showing 16:9 banner thumbnails
  const listPath = path.join(SCREENSHOT_DIR, 'events_list_with_banners.png');
  await page.screenshot({ path: listPath });
  console.log('Saved', listPath);

  // 2. Click on the first event thumbnail to open Session Detail Modal
  const thumbnails = await page.$$('.aspect-video.cursor-pointer');
  console.log(`Found ${thumbnails.length} event banner thumbnails on Events Page`);
  if (thumbnails.length > 0) {
    console.log('Clicking first event banner thumbnail...');
    await thumbnails[0].click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 600));

    const modalPath = path.join(SCREENSHOT_DIR, 'event_detail_modal.png');
    await page.screenshot({ path: modalPath });
    console.log('Saved', modalPath);

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close modal"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 3. Navigate to Event Composer
  console.log('Navigating to Event Composer...');
  await page.goto('http://localhost:5173/?tab=events&view=new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot Composer with banner uploader & live preview
  const composerPath = path.join(SCREENSHOT_DIR, 'composer_banner_uploader.png');
  await page.screenshot({ path: composerPath });
  console.log('Saved', composerPath);

  await browser.close();
  console.log('All verification checks completed successfully!');
}

run().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
