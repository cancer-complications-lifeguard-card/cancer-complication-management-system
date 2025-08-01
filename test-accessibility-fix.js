const puppeteer = require('puppeteer');

async function testAccessibilityFix() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Enable console logging and error tracking
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('🧪 Testing DialogTitle accessibility fix...');
    
    // Navigate to the main page
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for mobile navigation menu
    console.log('🔍 Looking for mobile navigation trigger...');
    await page.waitForSelector('[class*="lg:hidden"]', { timeout: 10000 });
    
    // Try to open the mobile navigation
    console.log('📱 Opening mobile navigation...');
    const mobileMenuTrigger = await page.$('[class*="lg:hidden"]');
    
    if (mobileMenuTrigger) {
      await mobileMenuTrigger.click();
      console.log('✅ Mobile navigation clicked');
      
      // Wait for the sheet to open
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if SheetContent is present (indicates sheet opened)
      const sheetContent = await page.$('[role="dialog"]');
      if (sheetContent) {
        console.log('✅ Sheet dialog opened successfully');
        
        // Check for accessibility attributes
        const hasTitle = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return false;
          
          // Check for visible title
          const visibleTitle = dialog.querySelector('[data-radix-collection-item]') || 
                              dialog.querySelector('h1, h2, h3, h4, h5, h6') ||
                              dialog.querySelector('[class*="SheetTitle"]');
          
          // Check for aria-labelledby (indicates title is present)
          const hasAriaLabel = dialog.hasAttribute('aria-labelledby');
          
          return {
            hasVisibleTitle: !!visibleTitle,
            hasAriaLabel: hasAriaLabel,
            ariaLabelValue: dialog.getAttribute('aria-labelledby')
          };
        });
        
        console.log('🎯 Accessibility check results:', hasTitle);
        
        if (hasTitle.hasAriaLabel || hasTitle.hasVisibleTitle) {
          console.log('✅ DialogTitle accessibility requirement satisfied');
        } else {
          console.log('❌ DialogTitle accessibility requirement NOT satisfied');
        }
        
      } else {
        console.log('❌ Sheet dialog did not open');
      }
    } else {
      console.log('❌ Mobile menu trigger not found');
    }
    
    // Count console errors related to DialogTitle
    const dialogTitleErrors = consoleErrors.filter(error => 
      error.includes('DialogTitle') || 
      error.includes('DialogContent') ||
      error.includes('accessible for screen reader')
    );
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`DialogTitle Related Errors: ${dialogTitleErrors.length}`);
    
    if (dialogTitleErrors.length === 0) {
      console.log('🎉 SUCCESS: No DialogTitle accessibility errors found!');
    } else {
      console.log('❌ FAILED: DialogTitle accessibility errors still present:');
      dialogTitleErrors.forEach(error => console.log('  -', error));
    }
    
    console.log('\nAll console errors:');
    consoleErrors.forEach(error => console.log('  -', error));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAccessibilityFix().catch(console.error);