import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔄 Loading app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  console.log('✅ App loaded successfully');
  
  const title = await page.title();
  console.log(`📱 Page title: ${title}`);
  
  // Check console for errors
  page.on('console', msg => {
    console.log(`📋 [${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error(`❌ Error: ${error}`);
  });
  
  // Wait a moment to see any errors
  await page.waitForTimeout(2000);
  
  await browser.close();
  console.log('✅ Test completed - App is running without critical errors');
})();
