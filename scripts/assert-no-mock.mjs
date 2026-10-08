import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Security & Separation Guard (Section 5)
// Ensures zero mock data, seed markers, dev persona emails, or test OTPs leak into production.
const FORBIDDEN_UNIVERSAL = [
  { label: 'DEV_SEED_MARKER string', pattern: /NEXALINK_DEV_SEED_V1/ },
  { label: 'Folder path segment src/dev/mock', pattern: /src\/dev\/mock/ },
  { label: 'Demo OTP (482910)', pattern: /482910/ },
  { label: 'Dev persona email (Karan Mehta)', pattern: /karan\.mehta@(student\.vit\.edu\.in|example\.com)/ },
  { label: 'Dev persona email (Aarav Deshpande)', pattern: /aarav\.deshpande@(student\.vit\.edu\.in|example\.com)/ },
  { label: 'Dev persona email (Pooja Kulkarni)', pattern: /pooja\.kulkarni@(student\.vit\.edu\.in|example\.com)/ },
  { label: 'Dev persona email (Vikram Malhotra)', pattern: /vikram\.malhotra@(alumni\.vit\.edu\.in|example\.com)/ },
  { label: 'Dev persona email (Prof. Sneha Deshpande)', pattern: /sneha\.deshpande@(vit\.edu\.in|example\.com)/ },
  { label: 'Headline persona (Aanya Patel)', pattern: /Aanya Patel/ }
];

// Check for headline personas in mock-related chunks
const FORBIDDEN_MOCK_CHUNKS = [
  { label: 'Headline persona (Dr. Sunita Rawat in mock chunk)', pattern: /Dr\. Sunita Rawat/ },
  { label: 'Headline persona (Rushabh Sanghavi in mock chunk)', pattern: /Rushabh Sanghavi/ },
  { label: 'Headline persona (Dr. Ravindra Sangale in mock chunk)', pattern: /Dr\. Ravindra Sangale/ }
];

let scannedCount = 0;
let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(js|mjs|cjs|html|css|map)$/i.test(entry.name)) {
      scannedCount++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative('.', fullPath);

      for (const rule of FORBIDDEN_UNIVERSAL) {
        if (rule.pattern.test(content)) {
          violations.push({
            file: relativePath,
            reason: `Found forbidden ${rule.label}`
          });
        }
      }

      // Check mock chunks for headline persona leaks
      if (entry.name.includes('mock') || entry.name.includes('seed')) {
        for (const rule of FORBIDDEN_MOCK_CHUNKS) {
          if (rule.pattern.test(content)) {
            violations.push({
              file: relativePath,
              reason: `Found forbidden ${rule.label}`
            });
          }
        }
      }
    }
  }
}

scanDirectory(distDir);

if (violations.length > 0) {
  console.error('\n❌ BUILD GUARD VIOLATION: Mock data or dev secrets leaked into production dist/:\n');
  violations.forEach((v) => {
    console.error(`  - [${v.file}]: ${v.reason}`);
  });
  console.error('\nBuild guard failed with exit code 1. Clean the dynamic import or import.meta.env.DEV gate.\n');
  process.exit(1);
} else {
  console.log(`✅ [assert-no-mock] Production build passed separation guard: ${scannedCount} files verified clean.`);
}
