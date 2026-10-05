import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

const forbiddenPatterns = [
  { pattern: /482910/, description: 'Hardcoded test OTP (482910)' },
  { pattern: /DEMO_PERSONA_ACCESS/, description: 'Dev persona access header' },
];

let hasErrors = false;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(js|mjs|cjs|html|css|json|map|txt)$/i.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const { pattern, description } of forbiddenPatterns) {
        if (pattern.test(content)) {
          console.error(`Security Violation: Found ${description} in ${path.relative('.', fullPath)}`);
          hasErrors = true;
        }
      }
    }
  }
}

console.log('Running Production Bundle Security Guard on dist/...');
scanDir(distDir);

if (hasErrors) {
  console.error('Production bundle verification FAILED.');
  process.exit(1);
} else {
  console.log('Production bundle verification PASSED: Zero forbidden secrets or dev leaks found.');
}
