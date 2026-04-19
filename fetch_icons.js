import https from 'https';
import fs from 'fs';

async function searchAndDownload(query, filename) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:flaticon.com free icon png')}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cdnMatch = data.match(/https:\/\/cdn-icons-png\.flaticon\.com\/[a-zA-Z0-9\/_\-]+\.png/gi);
        if (cdnMatch) {
          const imgUrl = cdnMatch[0];
          console.log(`Found ${filename}: ${imgUrl}`);
          https.get(imgUrl, (imgRes) => {
            const file = fs.createWriteStream("public/assets/" + filename);
            imgRes.pipe(file);
            file.on('finish', () => { file.close(); resolve(true); });
          }).on('error', reject);
        } else {
          console.log(`Not found for ${filename}`);
          resolve(false);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  await searchAndDownload('gold crown', 'crown2.png');
  await searchAndDownload('chess queen piece', 'queen2.png');
  await searchAndDownload('police badge shield', 'police2.png');
  await searchAndDownload('thief bandit avatar money bag', 'robber2.png');
}
run();
