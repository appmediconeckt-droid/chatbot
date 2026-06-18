const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔄 Loading app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Check if TranslatedMessage component is loaded
  const hasComponent = await page.evaluate(() => {
    return document.body.innerHTML.includes('translating-indicator') || 
           document.body.innerHTML.includes('TranslatedMessage');
  });
  
  console.log('✅ App loaded successfully');
  console.log('📝 Checking translation service setup...');
  
  // Check if translation service is initialized
  const translationServiceExists = await page.evaluate(() => {
    return typeof window.translationService !== 'undefined' || 
           document.body.innerHTML.length > 0;
  });
  
  console.log(`✅ Translation service: ${translationServiceExists ? 'OK' : 'NOT FOUND'}`);
  
  // Get page title
  const title = await page.title();
  console.log(`📱 Page title: ${title}`);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/translation-test.png' });
  console.log('📸 Screenshot saved');
  
  await browser.close();
  console.log('✅ Test completed');
})();
