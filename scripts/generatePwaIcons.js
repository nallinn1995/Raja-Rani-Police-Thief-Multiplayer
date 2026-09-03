import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const iconsDir = path.join(projectRoot, 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  const sourceImage = path.join(projectRoot, 'public', 'assets', 'crown.png');

  console.log('Generating PWA icons...');

  // 1. 512x512 Standard Icon
  const crownResized512 = await sharp(sourceImage)
    .resize(380, 380, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create royal circular glow behind crown
  const svgGlow512 = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="royalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#782287" stop-opacity="0.6"/>
          <stop offset="60%" stop-color="#3F1152" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#080320" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FBE278"/>
          <stop offset="50%" stop-color="#EB9C09"/>
          <stop offset="100%" stop-color="#F9C933"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#080320" rx="96"/>
      <circle cx="256" cy="256" r="210" fill="url(#royalGlow)"/>
      <circle cx="256" cy="256" r="226" fill="none" stroke="url(#goldRing)" stroke-width="4" stroke-opacity="0.4"/>
    </svg>
  `);

  await sharp(svgGlow512)
    .composite([
      {
        input: crownResized512,
        top: 66,
        left: 66,
      }
    ])
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('✅ Created icon-512x512.png');

  // 2. 192x192 Standard Icon
  await sharp(path.join(iconsDir, 'icon-512x512.png'))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('✅ Created icon-192x192.png');

  // 3. 512x512 Maskable Icon
  const crownResizedMaskable = await sharp(sourceImage)
    .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const svgMaskableBg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="royalGlowMask" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#782287" stop-opacity="0.8"/>
          <stop offset="70%" stop-color="#21073F" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#080320" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FBE278"/>
          <stop offset="50%" stop-color="#EB9C09"/>
          <stop offset="100%" stop-color="#F9C933"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#080320"/>
      <circle cx="256" cy="256" r="200" fill="url(#royalGlowMask)"/>
      <circle cx="256" cy="256" r="190" fill="none" stroke="url(#goldBorder)" stroke-width="3" stroke-opacity="0.35"/>
    </svg>
  `);

  await sharp(svgMaskableBg)
    .composite([
      {
        input: crownResizedMaskable,
        top: 106,
        left: 106,
      }
    ])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));
  console.log('✅ Created icon-maskable-512x512.png');

  // 4. Apple Touch Icon (180x180)
  await sharp(path.join(iconsDir, 'icon-512x512.png'))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✅ Created apple-touch-icon.png');

  console.log('🎉 All PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
