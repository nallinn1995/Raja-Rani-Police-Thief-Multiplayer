import fs from 'fs';
import https from 'https';
import path from 'path';

const iconUrls = {
  queen: 'https://img.icons8.com/color/96/000000/queen.png',
  thief: 'https://img.icons8.com/color/96/000000/thief.png',
  robber: 'https://img.icons8.com/color/96/000000/robber.png',
  bandit: 'https://img.icons8.com/color/96/000000/bandit.png',
  princess: 'https://img.icons8.com/color/96/000000/princess.png'
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
        fs.unlink(dest, () => {});
        console.log(`Failed to load ${name}, status: ${response.statusCode}`);
    }
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${name}: ${err.message}`);
  });
});
