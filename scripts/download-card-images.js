const fs = require('fs');
const path = require('path');
const https = require('https');

const pathToCatalog = path.join(__dirname, '..', 'src', 'lib', 'data', 'deck-catalog.ts');

function readCatalogKeys() {
  const txt = fs.readFileSync(pathToCatalog, 'utf8');
  const keyRegex = /key:\s*"([a-z0-9_\-]+)"/gi;
  const keys = new Set();
  let m;
  while ((m = keyRegex.exec(txt))) {
    keys.add(m[1]);
  }
  return Array.from(keys);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function downloadCard(key, dest) {
  const hyphen = key.replace(/_/g, '-');
  
  // Known card name overrides from the CDN
  const nameOverrides = {
    'log': 'the-log',
    'snowball': 'giant-snowball',
  };
  
  const altName = nameOverrides[key] || hyphen;
  const urls = [
    `https://royaleapi.github.io/cr-api-assets/cards-150/${altName}.png`,
    `https://royaleapi.github.io/cr-api-assets/cards-150/${hyphen}.png`,
    `https://royaleapi.github.io/cr-api-assets/cards-150/${key}.png`,
    `https://royaleapi.github.io/static/img/cards-150/${altName}.png`,
    `https://royaleapi.github.io/static/img/cards-150/${hyphen}.png`,
    `https://royaleapi.github.io/static/img/cards-150/${key}.png`,
  ];

  for (const u of urls) {
    try {
      const data = await fetchUrl(u);
      fs.writeFileSync(dest, data);
      console.log(`Saved ${dest} from ${u}`);
      return true;
    } catch (err) {
      // try next
    }
  }

  console.warn(`Failed to download ${key}`);
  return false;
}

async function main() {
  const outDir = path.join(__dirname, '..', 'public', 'cards');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const keys = readCatalogKeys();

  for (const key of keys) {
    const dest = path.join(outDir, `${key}.png`);
    if (fs.existsSync(dest)) {
      console.log(`Skipping existing ${dest}`);
      continue;
    }
    await downloadCard(key, dest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
