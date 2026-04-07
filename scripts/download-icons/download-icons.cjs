#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const ICON_SETS = [
  'ant-design',
  'simple-icons',
  'mdi',
  'material-symbols',
  'tabler',
  'ph',
  'lucide'
];

const OUTPUT_DIR = path.join(__dirname, '../../public/icons');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function downloadIconSet(prefix) {
  try {
    console.log(`Downloading ${prefix} icons...`);
    
    const data = await fetchJson(`https://api.iconify.design/collection?prefix=${prefix}`);
    
    const iconList = data.uncategorized || [];
    if (data.categories) {
      for (const category in data.categories) {
        iconList.push(...(data.categories[category] || []));
      }
    }
    
    const icons = iconList.map(v => `${prefix}:${v}`);
    
    const outputPath = path.join(OUTPUT_DIR, `${prefix}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    
    console.log(`✓ Downloaded ${icons.length} ${prefix} icons to ${outputPath}`);
    return icons;
  } catch (error) {
    console.error(`✗ Failed to download ${prefix} icons:`, error.message);
    return [];
  }
}

async function downloadAllIcons() {
  console.log('Starting icon download...\n');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const allIcons = {};
  
  for (const prefix of ICON_SETS) {
    const icons = await downloadIconSet(prefix);
    if (icons.length > 0) {
      allIcons[prefix] = icons;
    }
  }
  
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(allIcons, null, 2));
  
  console.log(`\n✓ All icons downloaded successfully!`);
  console.log(`✓ Index file created at ${indexPath}`);
  console.log(`\nTotal icon sets: ${Object.keys(allIcons).length}`);
  console.log(`Total icons: ${Object.values(allIcons).reduce((sum, icons) => sum + icons.length, 0)}`);
}

downloadAllIcons().catch(console.error);
