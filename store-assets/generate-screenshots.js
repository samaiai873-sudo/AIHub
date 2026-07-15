const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS = [
  {
    file: 'screenshot-main.html',
    output: 'screenshot-main.png',
    width: 1280,
    height: 800,
    waitFor: '.messages'
  },
  {
    file: 'screenshot-mcp.html',
    output: 'screenshot-mcp.png',
    width: 1280,
    height: 800,
    waitFor: '.mcp-panel'
  },
  {
    file: 'screenshot-compare.html',
    output: 'screenshot-compare.png',
    width: 1280,
    height: 800,
    waitFor: '.compare-grid'
  },
  {
    file: 'screenshot-tools.html',
    output: 'screenshot-tools.png',
    width: 1280,
    height: 800,
    waitFor: '.tool-panel'
  },
  {
    file: 'screenshot-settings.html',
    output: 'screenshot-settings.png',
    width: 1280,
    height: 800,
    waitFor: '.settings-panel'
  },
  {
    file: 'promo-tile-440x280.html',
    output: 'promo-tile-440x280.png',
    width: 440,
    height: 280,
    waitFor: 'body'
  },
  {
    file: 'promo-banner-1400x560.html',
    output: 'promo-banner-1400x560.png',
    width: 1400,
    height: 560,
    waitFor: 'body'
  }
];

async function takeScreenshots() {
  console.log('啟動 Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  for (const shot of SCREENSHOTS) {
    try {
      console.log(`\n生成: ${shot.output} (${shot.width}x${shot.height})`);
      
      await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 2 });
      
      const filePath = 'file://' + path.resolve(__dirname, shot.file);
      await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // 等待特定元素出現
      if (shot.waitFor) {
        await page.waitForSelector(shot.waitFor, { timeout: 10000 }).catch(() => {
          console.log(`  警告: 找不到選擇器 ${shot.waitFor}，繼續截圖`);
        });
      }
      
      // 等待動畫完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 截圖
      await page.screenshot({
        path: path.resolve(__dirname, shot.output),
        fullPage: true
      });
      
      console.log(`  ✅ 完成: ${shot.output}`);
    } catch (error) {
      console.error(`  ❌ 失敗: ${shot.output}`, error.message);
    }
  }
  
  await browser.close();
  console.log('\n🎉 所有截圖生成完成！');
}

takeScreenshots().catch(console.error);