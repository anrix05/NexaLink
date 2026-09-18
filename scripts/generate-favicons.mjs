import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputSvg = path.resolve('public', 'favicon.svg');
const outDir = path.resolve('public');

async function generate() {
  if (!fs.existsSync(inputSvg)) {
    console.error('favicon.svg not found');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(inputSvg);

  // 16x16 PNG
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(outDir, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');

  // 32x32 PNG
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(outDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  // Apple Touch Icon
  // For Apple Touch Icon, we often want a solid background. 
  // Our SVG already has #0A0A0A background <rect width="120" height="120" rx="28" fill="#0A0A0A" />.
  // It will scale perfectly.
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
  
  // favicon.ico (fallback) - Just use 32x32 png, rename to .ico (browsers support PNG in .ico extension often, or just don't strictly need .ico if .svg is present)
  // Sharp doesn't directly encode ICO, but we can just use 32x32. 
  fs.copyFileSync(path.join(outDir, 'favicon-32x32.png'), path.join(outDir, 'favicon.ico'));
  console.log('Generated favicon.ico (fallback)');
}

generate().catch(console.error);
