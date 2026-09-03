import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const iconsDir = path.join(projectRoot, 'public', 'icons');
const sourceImage = path.join(projectRoot, 'public', 'assets', 'appicon.png');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log(`Generating PWA icons from: ${sourceImage}`);

  // 1. 512x512 Standard Icon
  await sharp(sourceImage)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('✅ Created icon-512x512.png');

  // 2. 192x192 Standard Icon
  await sharp(sourceImage)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('✅ Created icon-192x192.png');

  // 3. Apple Touch Icon (180x180)
  await sharp(sourceImage)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✅ Created apple-touch-icon.png');

  // 4. 512x512 Maskable Icon with safe-zone margin
  // Android safe-zone is 80% circle (diameter 410px out of 512px)
  const innerIcon = await sharp(sourceImage)
    .resize(420, 420, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 1, g: 0, b: 2, alpha: 1 },
    },
  })
    .composite([
      {
        input: innerIcon,
        top: 46,
        left: 46,
      },
    ])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));
  console.log('✅ Created icon-maskable-512x512.png');

  // 5. Update public/favicon.png
  await sharp(sourceImage)
    .resize(192, 192)
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon.png'));
  console.log('✅ Updated public/favicon.png');

  console.log('🎉 All icons updated successfully with new appicon.png!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
