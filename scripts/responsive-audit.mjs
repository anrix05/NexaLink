#!/usr/bin/env node
/**
 * NexaLink Responsive Audit Script
 * ─────────────────────────────────
 * Runs Puppeteer against the local dev server (must be running on port 5173)
 * and checks each viewport for:
 *   1. Horizontal overflow (no content wider than the viewport)
 *   2. Touch-target size (interactive elements ≥ 44×44 px per WCAG 2.5.5)
 *   3. Viewport meta present
 *   4. Screenshots saved to docs/responsive/
 *
 * Usage:
 *   npm run audit:responsive
 *
 * Prerequisites:
 *   - Dev server running: `npm run dev`
 *   - Puppeteer installed (already in devDependencies)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'docs', 'responsive');
const BASE_URL = process.env.AUDIT_URL || 'http://localhost:5173';

// ─── Viewport matrix ─────────────────────────────────────────────────────────
const VIEWPORTS = [
  // Mobile phones
  { name: '320-phone',     width: 320,  height: 568  },
  { name: '360-phone',     width: 360,  height: 800  },
  { name: '375-phone',     width: 375,  height: 667  },
  { name: '390-phone',     width: 390,  height: 844  },
  { name: '430-phone',     width: 430,  height: 932  },
  { name: '844-landscape', width: 844,  height: 390  },
  // Tablets
  { name: '744-tablet',    width: 744,  height: 1133 },
  { name: '820-tablet',    width: 820,  height: 1180 },
  // Laptops
  { name: '1024-laptop',   width: 1024, height: 768  },
  { name: '1194-laptop',   width: 1194, height: 834  },
  // Desktops
  { name: '1280-desktop',  width: 1280, height: 720  },
  { name: '1366-desktop',  width: 1366, height: 768  },
  { name: '1440-desktop',  width: 1440, height: 900  },
  { name: '1920-desktop',  width: 1920, height: 1080 },
];

// ─── Pages to test (URL hash/path appended to BASE_URL) ──────────────────────
const PAGES = [
  { name: 'landing',      path: '/'              },
  { name: 'auth',         path: '/?tab=auth'     },
  { name: 'privacy',      path: '/privacy'       },
  { name: 'terms',        path: '/terms'         },
  { name: 'data-gov',     path: '/data-governance' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function checkHorizontalOverflow(page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const vpWidth  = window.innerWidth;
    return { overflow: docWidth > vpWidth + 2, docWidth, vpWidth };
  });
}

async function checkTouchTargets(page) {
  return page.evaluate(() => {
    const MIN = 44;
    const interactive = [
      ...document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"]'
      )
    ];
    const violations = [];
    for (const el of interactive) {
      const rect = el.getBoundingClientRect();
      // Skip hidden / zero-size elements
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.width < MIN || rect.height < MIN) {
        const label = el.getAttribute('aria-label')
          || el.textContent?.trim().slice(0, 30)
          || el.tagName;
        violations.push({ label, w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    }
    return violations;
  });
}

async function checkViewportMeta(page) {
  return page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? meta.getAttribute('content') : null;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  ensureDir(SCREENSHOTS_DIR);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  let totalPass = 0;
  let totalFail = 0;

  console.log(`\n🔍 NexaLink Responsive Audit — ${new Date().toISOString()}`);
  console.log(`   Base URL : ${BASE_URL}`);
  console.log(`   Viewports: ${VIEWPORTS.length}`);
  console.log(`   Pages    : ${PAGES.length}`);
  console.log('─'.repeat(72));

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });

    for (const pg of PAGES) {
      const url = `${BASE_URL}${pg.path}`;
      const key  = `${vp.name}__${pg.name}`;
      const row  = { viewport: vp.name, page: pg.name, url, checks: {} };

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20_000 });
        // Allow animations to settle
        await new Promise(r => setTimeout(r, 600));

        // 1. Horizontal overflow
        const overflow = await checkHorizontalOverflow(page);
        row.checks.noHorizontalOverflow = !overflow.overflow;
        if (overflow.overflow) {
          row.checks.noHorizontalOverflow_detail =
            `docWidth=${overflow.docWidth} vpWidth=${overflow.vpWidth}`;
        }

        // 2. Touch targets (only on narrow viewports where it matters most)
        if (vp.width <= 820) {
          const violations = await checkTouchTargets(page);
          row.checks.touchTargets = violations.length === 0;
          if (violations.length > 0) {
            row.checks.touchTargets_violations = violations.slice(0, 5);
          }
        }

        // 3. Viewport meta
        const vpMeta = await checkViewportMeta(page);
        row.checks.viewportMeta = vpMeta !== null;

        // 4. Screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${key}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        row.screenshot = path.relative(ROOT, screenshotPath);

        // Summarise
        const failed = Object.entries(row.checks)
          .filter(([k, v]) => !k.endsWith('_detail') && !k.endsWith('_violations') && v === false);
        row.pass = failed.length === 0;

        if (row.pass) {
          totalPass++;
          process.stdout.write(`  ✅ ${key.padEnd(45)}\n`);
        } else {
          totalFail++;
          const reasons = failed.map(([k]) => k).join(', ');
          process.stdout.write(`  ❌ ${key.padEnd(45)} — ${reasons}\n`);
          // Print touch target violations
          if (row.checks.touchTargets_violations) {
            for (const v of row.checks.touchTargets_violations) {
              process.stdout.write(
                `       touch-target: "${v.label}" ${v.w}×${v.h}px\n`
              );
            }
          }
          if (row.checks.noHorizontalOverflow_detail) {
            process.stdout.write(
              `       overflow: ${row.checks.noHorizontalOverflow_detail}\n`
            );
          }
        }

        results.push(row);
      } catch (err) {
        totalFail++;
        row.pass  = false;
        row.error = err.message;
        process.stdout.write(`  💥 ${key.padEnd(45)} — ${err.message}\n`);
        results.push(row);
      }
    }

    await page.close();
  }

  await browser.close();

  // ─── JSON report ──────────────────────────────────────────────────────────
  const reportPath = path.join(SCREENSHOTS_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ generated: new Date().toISOString(), totalPass, totalFail, results }, null, 2));

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('─'.repeat(72));
  console.log(`\n  Passed : ${totalPass}`);
  console.log(`  Failed : ${totalFail}`);
  console.log(`  Report : docs/responsive/report.json`);
  console.log(`  Shots  : docs/responsive/\n`);

  if (totalFail > 0) {
    console.error(`\n❌ Audit finished with ${totalFail} failure(s). Fix before release.\n`);
    process.exit(1);
  } else {
    console.log('✅ All responsive checks passed.\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
