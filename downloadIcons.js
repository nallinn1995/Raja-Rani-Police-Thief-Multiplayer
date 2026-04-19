import fs from 'fs';
import https from 'https';
import path from 'path';

const iconUrls = {
  crown: 'https://img.icons8.com/color/96/000000/crown.png',
  queen: 'https://img.icons8.com/color/96/000000/queen_uk.png',
  police: 'https://img.icons8.com/color/96/000000/police-badge.png', // Using badge instead to make it cool
  thief: 'https://img.icons8.com/color/96/000000/burglar.png',
  trophy: 'https://img.icons8.com/color/96/000000/trophy.png',
  coins: 'https://img.icons8.com/color/96/000000/coins.png'
};

const dir = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

Object.entries(iconUrls).forEach(([name, url]) => {
  const dest = path.join(dir, `${name}.png`);
  const file = fs.createWriteStream(dest);
  
  https.get(url, (response) => {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${name}.png`);
        });
    } else {
        // Retry with alternative mapping if 404
        console.log(`Failed to load ${name}, status: ${response.statusCode}`);
    }
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${name}: ${err.message}`);
  });
});
