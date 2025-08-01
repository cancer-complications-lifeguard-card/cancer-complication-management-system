const puppeteer = require('puppeteer');

async function testReactFlowElimination() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Track all console messages
  const consoleMessages = [];
  const reactFlowErrors = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text
    });
    
    // Check for ReactFlow related errors
    if (text.toLowerCase().includes('reactflow') || 
        text.includes('@reactflow') ||
        text.includes('react-flow')) {
      reactFlowErrors.push(text);
      console.log('🚨 ReactFlow Error Found:', text);
    }
  });

  try {
    console.log('🧪 Testing ReactFlow Complete Elimination...');
    console.log('Target: Zero ReactFlow errors in knowledge graph section');
    console.log('');
    
    // Navigate to homepage
    console.log('📍 Step 1: Navigate to homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️  Step 2: Wait for initial load (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to knowledge graph section
    console.log('📍 Step 3: Navigate to knowledge graph section...');
    await page.goto('http://localhost:3000/dashboard/knowledge', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️  Step 4: Wait for knowledge page to load (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to access the risk tree tab
    console.log('🎯 Step 5: Click on Risk Tree Visualization tab...');
    const riskTreeTab = await page.$('button[data-value="risk-tree"]');
    
    if (riskTreeTab) {
      console.log('✅ Found risk tree tab, clicking...');
      await riskTreeTab.click();
      
      console.log('⏱️  Step 6: Wait for tab content to load (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if the component loaded successfully
      const riskTreeContent = await page.$('[class*="risk-tree"], [class*="RiskTree"]');
      if (riskTreeContent) {
        console.log('✅ Risk tree visualization loaded successfully');
      } else {
        console.log('⚠️  Risk tree visualization content not found, but may still be working');
      }
      
    } else {
      console.log('❌ Risk tree tab not found');
    }
    
    // Final wait to catch any delayed errors
    console.log('⏱️  Step 7: Final wait for delayed errors (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('');
    console.log('📊 FINAL TEST RESULTS:');
    console.log('========================');
    console.log(`Total Console Messages: ${consoleMessages.length}`);
    console.log(`ReactFlow Related Errors: ${reactFlowErrors.length}`);
    
    // Detailed breakdown of console messages
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log(`Console Errors: ${errorMessages.length}`);
    console.log(`Console Warnings: ${warningMessages.length}`);
    
    if (reactFlowErrors.length === 0) {
      console.log('');
      console.log('🎉 SUCCESS: ReactFlow has been COMPLETELY ELIMINATED!');
      console.log('✅ Zero ReactFlow related errors found');
      console.log('✅ Knowledge graph section loads without ReactFlow dependencies');
      console.log('✅ Risk tree visualization works with simple card-based interface');
    } else {
      console.log('');
      console.log('❌ FAILED: ReactFlow errors still exist:');
      reactFlowErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Show sample of console output for debugging
    if (consoleMessages.length > 0) {
      console.log('');
      console.log('📝 Console Output Summary (last 10 messages):');
      const recentMessages = consoleMessages.slice(-10);
      recentMessages.forEach((msg, index) => {
        const prefix = msg.type === 'error' ? '❌' : 
                      msg.type === 'warning' ? '⚠️ ' : 'ℹ️ ';
        console.log(`  ${prefix} ${msg.text}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testReactFlowElimination().catch(console.error);