import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/pbclu/.gemini/antigravity-ide/brain/4cf46d41-4323-4f07-9174-2e4e35487d6d/evidence/polish_pass_before';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1366x768_laptop', width: 1366, height: 768 },
  { name: '1536x864_125pct', width: 1536, height: 864 },
  { name: '1920x1080_desktop', width: 1920, height: 1080 },
  { name: '1024x768_tablet_land', width: 1024, height: 768 },
  { name: '768x1024_tablet_port', width: 768, height: 1024 },
  { name: '390x844_mobile', width: 390, height: 844 },
];

async function capture() {
  console.log('=== Capturing Polish Pass "Before" Screenshots & Diagnostics ===\n');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // Context 1: Student (Aanya Patel)
    // -------------------------------------------------------------
    console.log('[1/2] Authenticating Context 1: Student (Aanya Patel)...');
    const ctxStudent = await browser.createBrowserContext();
    const pageStudent = await ctxStudent.newPage();
    await pageStudent.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await pageStudent.evaluate(() => {
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

    for (const vp of VIEWPORTS) {
      console.log(`  -> Student at ${vp.width}x${vp.height} (${vp.name})...`);
      await pageStudent.setViewport({ width: vp.width, height: vp.height });
      await pageStudent.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));

      // Select first conversation if not selected
      await pageStudent.evaluate(() => {
        const conv = document.querySelector('div.cursor-pointer');
        if (conv) conv.click();
      });
      await new Promise(r => setTimeout(r, 400));

      await pageStudent.screenshot({ path: path.join(OUT_DIR, `student_${vp.name}.png`) });

      if (vp.name === '1920x1080_desktop') {
        const ta = await pageStudent.$('textarea');
        if (ta) {
          await ta.click();
          await new Promise(r => setTimeout(r, 300));
          await pageStudent.screenshot({ path: path.join(OUT_DIR, `student_1920x1080_composer_focused.png`) });
        }
      }
    }

    // Measure metrics on Student 1920x1080
    await pageStudent.setViewport({ width: 1920, height: 1080 });
    await pageStudent.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const metrics = await pageStudent.evaluate(() => {
      const listHeader = document.querySelector('div.border-r > div:first-child');
      const threadHeader = document.querySelector('div.flex-1 > div:first-child');
      
      const bubbles = Array.from(document.querySelectorAll('div.rounded-2xl, div[class*="rounded-"]')).filter(el => {
        return el.textContent && (el.classList.contains('bg-[#0A0A0A]') || el.classList.contains('bg-[#F3F4F6]'));
      });

      const mentorshipNavBtn = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent?.includes('Mentorship'));
      const mentorshipBadge = mentorshipNavBtn ? mentorshipNavBtn.querySelector('span.tabular-nums, span.rounded-full') : null;

      const allElements = Array.from(document.querySelectorAll('*'));
      const blackBgElements = allElements.filter(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return bg === 'rgb(10, 10, 10)' || bg === 'rgb(0, 0, 0)' || bg === '#0a0a0a';
      });

      let maxBubbleWidth = 0;
      let maxChars = 0;
      bubbles.forEach(b => {
        const rect = b.getBoundingClientRect();
        if (rect.width > maxBubbleWidth) maxBubbleWidth = rect.width;
        const text = b.textContent || '';
        if (text.length > maxChars) maxChars = text.length;
      });

      return {
        listHeaderHeight: listHeader ? Math.round(listHeader.getBoundingClientRect().height) : null,
        threadHeaderHeight: threadHeader ? Math.round(threadHeader.getBoundingClientRect().height) : null,
        maxBubbleWidth: Math.round(maxBubbleWidth),
        maxCharsInBubble: maxChars,
        mentorshipBadgeValue: mentorshipBadge ? mentorshipBadge.textContent?.trim() : null,
        totalBlackBgCount: blackBgElements.length
      };
    });

    console.log('\n--- Metrics on 1920x1080 Desktop ---');
    console.log(JSON.stringify(metrics, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, 'metrics_before.json'), JSON.stringify(metrics, null, 2));

    // -------------------------------------------------------------
    // Context 2: Alumni (Rushabh Sanghavi)
    // -------------------------------------------------------------
    console.log('\n[2/2] Authenticating Context 2: Alumni (Rushabh Sanghavi)...');
    const ctxAlumni = await browser.createBrowserContext();
    const pageAlumni = await ctxAlumni.newPage();
    await pageAlumni.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await pageAlumni.evaluate(() => {
      localStorage.setItem('nexalink_auth_user', JSON.stringify({
        id: 'user-alumni-1',
        name: 'Rushabh Sanghavi',
        email: 'rushabh.sanghavi@vit.edu.in',
        role: 'alumni',
        department: 'CMPN',
        company: 'Google',
        designation: 'Senior Software Engineer',
        graduationYear: 2018,
        isVerified: true,
        verificationStatus: 'Verified'
      }));
      sessionStorage.setItem('nexalink:intro:v1', 'true');
      document.documentElement.dataset.intro = 'skip';
    });

    for (const vp of [VIEWPORTS[2], VIEWPORTS[5]]) { // 1920x1080 and 390x844
      console.log(`  -> Alumni at ${vp.width}x${vp.height} (${vp.name})...`);
      await pageAlumni.setViewport({ width: vp.width, height: vp.height });
      await pageAlumni.goto('http://localhost:5173/?tab=messages', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000));

      await pageAlumni.evaluate(() => {
        const conv = document.querySelector('div.cursor-pointer');
        if (conv) conv.click();
      });
      await new Promise(r => setTimeout(r, 400));
      await pageAlumni.screenshot({ path: path.join(OUT_DIR, `alumni_${vp.name}.png`) });
    }

    console.log('\n=== All Before Screenshots & Metrics Captured Successfully! ===');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
