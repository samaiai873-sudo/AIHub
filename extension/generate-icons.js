import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve(__dirname, 'assets/icon.svg');
const outputDir = path.resolve(__dirname, 'assets');

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    await sharp(inputPath, { density: 300 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}.png`);
  }
  
  console.log('All icons generated!');
}

generateIcons().catch(console.error);