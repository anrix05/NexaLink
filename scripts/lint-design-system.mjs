import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');

const violations = [];

function scanFile(filePath) {
  const relPath = path.relative('.', filePath);
  // Allowed files that define the primitives or are explicitly exempted
  if (
    relPath.includes('Eyebrow.tsx') ||
    relPath.includes('IntroOverlay.tsx') ||
    relPath.includes('AlumniNetworkCanvas.tsx') ||
    relPath.includes('LogoMark.tsx') ||
    relPath.includes('NexaMark.tsx')
  ) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('{/*')) {
      return;
    }

    // Check uppercase outside Eyebrow
    if (/\bclass(Name)?=["'][^"']*\buppercase\b/i.test(line) && !line.includes('Eyebrow') && !line.includes('// lint-ignore')) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'UPPERCASE_VIOLATION',
        snippet: line.trim().slice(0, 100),
      });
    }

    // Check contrast violation: #9CA3AF used for text
    if (/\bclass(Name)?=["'][^"']*\b(text-\[#9CA3AF\]|text-gray-400)\b/i.test(line) && !line.includes('// lint-ignore')) {
      violations.push({
        file: relPath,
        line: lineNum,
        type: 'CONTRAST_VIOLATION',
        snippet: line.trim().slice(0, 100),
      });
    }
  });
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      scanFile(fullPath);
    }
  }
}

console.log('Scanning src/ for design system violations (uppercase, low-contrast)...');
traverse(srcDir);

if (violations.length > 0) {
  console.log(`Found ${violations.length} design system warnings/violations:`);
  violations.forEach(v => {
    console.log(`[${v.type}] ${v.file}:${v.line} -> ${v.snippet}`);
  });
} else {
  console.log('Zero design system violations found! All clean.');
}
