const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = 'C:\\Users\\prana\\.gemini\\antigravity-ide\\brain\\fc4189aa-ce90-41dd-8e21-0a7957d04fda';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    if (msg.text().includes('[AvatarPanel]') || msg.text().includes('PropertyBinding')) {
      console.log('BROWSER:', msg.text());
    }
  });

  // Try port 5174 first
  try {
    await page.goto('http://localhost:5174/', { timeout: 5000 });
    const title = await page.title();
    console.log('Port 5174 title:', title);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'port5174_test.png') });
  } catch(e) {
    console.log('Port 5174 failed:', e.message);
  }

  await browser.close();
})();
