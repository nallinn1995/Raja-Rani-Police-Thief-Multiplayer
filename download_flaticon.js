import https from 'https';
import fs from 'fs';

function download(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const file = fs.createWriteStream(filename);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', reject);
  });
}

async function run() {
  await download("https://cdn-icons-png.flaticon.com/512/7006/7006900.png", "public/assets/crown.png");
  await download("https://cdn-icons-png.flaticon.com/512/1626/1626879.png", "public/assets/queen.png");
  await download("https://cdn-icons-png.flaticon.com/512/1417/1417898.png", "public/assets/police.png");
  await download("https://cdn-icons-png.flaticon.com/512/10/10925.png", "public/assets/robber.png");
  console.log("Done downloading direct Flaticon images");
}
run();
