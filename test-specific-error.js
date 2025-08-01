const puppeteer = require('puppeteer');

async function testSpecificAccessibilityError() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Enable console logging and error tracking
  const consoleErrors = [];
  const specificDialogErrors = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleErrors.push(text);
    
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}]:`, text);
      
      // Check for the specific DialogTitle error
      if (text.includes('DialogContent') && text.includes('DialogTitle') && 
          text.includes('accessible for screen reader')) {
        specificDialogErrors.push(text);
      }
    }
  });

  try {
    console.log('🧪 Testing for specific DialogTitle accessibility error...');
    console.log('Target Error: "DialogContent requires a DialogTitle for the component to be accessible for screen reader users"');
    console.log('');
    
    // Navigate to the main page
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️  Waiting 2 seconds for any initial errors...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find and click mobile navigation
    console.log('🔍 Looking for mobile menu trigger...');
    const menuButton = await page.$('button[class*="lg:hidden"]');
    
    if (menuButton) {
      console.log('📱 Found mobile menu button, clicking...');
      await menuButton.click();
      
      console.log('⏱️  Waiting 3 seconds for sheet to fully load and any errors...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if dialog is open
      const dialog = await page.$('[role="dialog"]');
      if (dialog) {
        console.log('✅ Dialog opened successfully');
        
        // Get dialog accessibility information
        const dialogInfo = await page.evaluate(() => {
          const dialogEl = document.querySelector('[role="dialog"]');
          if (!dialogEl) return null;
          
          return {
            hasAriaLabelledBy: dialogEl.hasAttribute('aria-labelledby'),
            ariaLabelledByValue: dialogEl.getAttribute('aria-labelledby'),
            hasTitle: !!dialogEl.querySelector('[data-radix-collection-item]'),
            innerHTML: dialogEl.innerHTML.substring(0, 200) + '...'
          };
        });
        
        console.log('Dialog accessibility info:', dialogInfo);
        
      } else {
        console.log('❌ Dialog did not open');
      }
      
    } else {
      console.log('❌ Mobile menu button not found');
    }
    
    console.log('');
    console.log('📊 Final Results:');
    console.log(`Total console messages: ${consoleErrors.length}`);
    console.log(`Specific DialogTitle errors: ${specificDialogErrors.length}`);
    
    if (specificDialogErrors.length === 0) {
      console.log('🎉 SUCCESS: The specific DialogTitle accessibility error has been FIXED!');
      console.log('✅ No "DialogContent requires a DialogTitle" errors found');
    } else {
      console.log('❌ FAILED: The DialogTitle accessibility error still exists:');
      specificDialogErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Show all console output for debugging
    if (consoleErrors.length > 0) {
      console.log('');
      console.log('All console output:');
      consoleErrors.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testSpecificAccessibilityError().catch(console.error);