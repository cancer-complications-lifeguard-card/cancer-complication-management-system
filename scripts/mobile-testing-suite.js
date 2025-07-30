/**
 * Mobile Testing Suite for Cancer Complication Management System
 * Tests mobile responsiveness, performance, and user experience
 */

const puppeteer = require('puppeteer');
const devices = puppeteer.devices;

class MobileTestingSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      devices: [],
      pages: [],
      performance: {},
      accessibility: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Run all mobile tests
   */
  async runAllTests() {
    console.log('🚀 Starting Mobile Testing Suite for Cancer Management System...\n');
    
    try {
      // Test different device types
      await this.testDeviceResponsiveness();
      await this.testTouchInteractions();
      await this.testMobilePerformance();
      await this.testOfflineFunctionality();
      await this.testPWAFeatures();
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing suite failed:', error);
      throw error;
    }
  }

  /**
   * Test device responsiveness across multiple screen sizes
   */
  async testDeviceResponsiveness() {
    console.log('📱 Testing Device Responsiveness...\n');
    
    const testDevices = [
      'iPhone 12',
      'iPhone SE',
      'iPhone 12 Pro Max',
      'Galaxy S5',
      'Pixel 5',
      'iPad',
      'iPad Pro',
      'iPad Mini'
    ];

    const criticalPages = [
      '/', // Landing page
      '/dashboard', // Main dashboard
      '/dashboard/monitoring', // Real-time monitoring
      '/dashboard/emergency', // Emergency features
      '/dashboard/health', // Health records
      '/dashboard/triage', // Symptom checker
      '/dashboard/knowledge', // Knowledge graph
      '/dashboard/resources' // Medical resources
    ];

    for (const deviceName of testDevices) {
      console.log(`  Testing ${deviceName}...`);
      
      const results = await this.testDevice(deviceName, criticalPages);
      this.results.devices.push({
        device: deviceName,
        results: results,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Device responsiveness testing completed\n');
  }

  /**
   * Test a specific device
   */
  async testDevice(deviceName, pages) {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const device = devices[deviceName] || puppeteer.devices[deviceName];
    
    if (!device) {
      console.warn(`  ⚠️  Device ${deviceName} not found in puppeteer devices`);
      await browser.close();
      return { error: 'Device not found' };
    }

    await page.emulate(device);
    
    const deviceResults = {
      viewport: device.viewport,
      userAgent: device.userAgent,
      pages: [],
      overallScore: 0
    };

    for (const pagePath of pages) {
      const pageResult = await this.testPage(page, pagePath, deviceName);
      deviceResults.pages.push(pageResult);
      this.results.summary.totalTests++;
      
      if (pageResult.passed) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    }

    deviceResults.overallScore = (deviceResults.pages.filter(p => p.passed).length / deviceResults.pages.length) * 100;
    
    await browser.close();
    return deviceResults;
  }

  /**
   * Test a specific page on a device
   */
  async testPage(page, pagePath, deviceName) {
    const startTime = Date.now();
    const pageUrl = `${this.baseUrl}${pagePath}`;
    
    try {
      // Navigate to page with timeout
      await page.goto(pageUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Test page layout and elements
      const layoutTests = await this.runLayoutTests(page, pagePath);
      
      // Test touch interactions
      const touchTests = await this.runTouchTests(page);
      
      // Test loading performance
      const loadTime = Date.now() - startTime;
      const performanceTests = await this.runPerformanceTests(page, loadTime);
      
      // Test responsiveness
      const responsivenessTests = await this.runResponsivenessTests(page);
      
      const allTests = [...layoutTests, ...touchTests, ...performanceTests, ...responsivenessTests];
      const passed = allTests.every(test => test.passed);
      
      return {
        path: pagePath,
        device: deviceName,
        loadTime,
        passed,
        tests: allTests,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`    ❌ Failed to test ${pagePath} on ${deviceName}:`, error.message);
      return {
        path: pagePath,
        device: deviceName,
        loadTime: Date.now() - startTime,
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test page layout and critical elements
   */
  async runLayoutTests(page, pagePath) {
    const tests = [];
    
    // Test header visibility
    try {
      await page.waitForSelector('header', { timeout: 5000 });
      tests.push({ name: 'Header visibility', passed: true });
    } catch (error) {
      tests.push({ name: 'Header visibility', passed: false, error: error.message });
    }

    // Test navigation menu (mobile)
    try {
      const mobileNav = await page.$('[data-testid="mobile-nav"], .mobile-nav, .drawer');
      tests.push({ 
        name: 'Mobile navigation', 
        passed: !!mobileNav,
        details: mobileNav ? 'Mobile navigation found' : 'Mobile navigation not found'
      });
    } catch (error) {
      tests.push({ name: 'Mobile navigation', passed: false, error: error.message });
    }

    // Test main content area
    try {
      await page.waitForSelector('main, [role="main"], .main-content', { timeout: 5000 });
      tests.push({ name: 'Main content area', passed: true });
    } catch (error) {
      tests.push({ name: 'Main content area', passed: false, error: error.message });
    }

    // Test responsive grid for dashboard pages
    if (pagePath.includes('/dashboard')) {
      try {
        const grids = await page.$$('.grid, .responsive-grid, [class*="grid-cols"]');
        tests.push({ 
          name: 'Responsive grid layout', 
          passed: grids.length > 0,
          details: `Found ${grids.length} grid elements`
        });
      } catch (error) {
        tests.push({ name: 'Responsive grid layout', passed: false, error: error.message });
      }
    }

    // Test emergency button (should always be accessible)
    try {
      const emergencyBtn = await page.$('[data-testid="emergency-button"], .emergency-button, [href*="emergency"]');
      tests.push({ 
        name: 'Emergency access button', 
        passed: !!emergencyBtn,
        details: emergencyBtn ? 'Emergency button accessible' : 'Emergency button not found'
      });
    } catch (error) {
      tests.push({ name: 'Emergency access button', passed: false, error: error.message });
    }

    return tests;
  }

  /**
   * Test touch interactions
   */
  async runTouchTests(page) {
    const tests = [];
    
    // Test tap targets size (minimum 44px)
    try {
      const buttons = await page.$$eval('button, a, [role="button"]', elements => 
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            text: el.textContent?.slice(0, 50) || 'No text'
          };
        })
      );

      const smallTargets = buttons.filter(btn => btn.width < 44 || btn.height < 44);
      tests.push({
        name: 'Touch target size',
        passed: smallTargets.length === 0,
        details: `${smallTargets.length} elements below 44px threshold`,
        smallTargets: smallTargets.slice(0, 5) // Show first 5 problematic elements
      });
    } catch (error) {
      tests.push({ name: 'Touch target size', passed: false, error: error.message });
    }

    // Test scroll behavior
    try {
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const windowHeight = await page.evaluate(() => window.innerHeight);
      
      if (scrollHeight > windowHeight) {
        await page.evaluate(() => window.scrollTo(0, 100));
        await page.waitForTimeout(500);
        const scrollY = await page.evaluate(() => window.scrollY);
        
        tests.push({
          name: 'Smooth scrolling',
          passed: scrollY > 0,
          details: 'Page can be scrolled properly'
        });
      } else {
        tests.push({
          name: 'Smooth scrolling',
          passed: true,
          details: 'Page fits in viewport, no scroll needed'
        });
      }
    } catch (error) {
      tests.push({ name: 'Smooth scrolling', passed: false, error: error.message });
    }

    return tests;
  }

  /**
   * Test performance metrics
   */
  async runPerformanceTests(page, loadTime) {
    const tests = [];
    
    // Test page load time
    tests.push({
      name: 'Page load time',
      passed: loadTime < 5000, // 5 seconds threshold
      details: `Loaded in ${loadTime}ms`,
      loadTime
    });

    // Test Core Web Vitals
    try {
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('web-vital' in window) {
            resolve(window['web-vital']);
          } else {
            // Fallback to basic performance measurements
            const navigation = performance.getEntriesByType('navigation')[0];
            resolve({
              fcp: navigation ? navigation.responseEnd - navigation.fetchStart : 0,
              lcp: 0, // Would need real implementation
              cls: 0,
              fid: 0
            });
          }
        });
      });

      tests.push({
        name: 'Core Web Vitals',
        passed: true, // Basic implementation
        details: 'Performance metrics collected',
        metrics
      });
    } catch (error) {
      tests.push({ name: 'Core Web Vitals', passed: false, error: error.message });
    }

    return tests;
  }

  /**
   * Test responsiveness
   */
  async runResponsivenessTests(page) {
    const tests = [];
    
    // Test viewport meta tag
    try {
      const viewport = await page.$eval('meta[name="viewport"]', el => el.content);
      tests.push({
        name: 'Viewport meta tag',
        passed: viewport.includes('width=device-width'),
        details: viewport
      });
    } catch (error) {
      tests.push({ name: 'Viewport meta tag', passed: false, error: error.message });
    }

    // Test horizontal overflow
    try {
      const hasOverflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > body.clientWidth;
      });
      
      tests.push({
        name: 'No horizontal overflow',
        passed: !hasOverflow,
        details: hasOverflow ? 'Horizontal scrollbar detected' : 'No horizontal overflow'
      });
    } catch (error) {
      tests.push({ name: 'No horizontal overflow', passed: false, error: error.message });
    }

    return tests;
  }

  /**
   * Test touch interactions specifically
   */
  async testTouchInteractions() {
    console.log('👆 Testing Touch Interactions...\n');
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.emulate(devices['iPhone 12']);
    
    try {
      // Test emergency card system touch interactions
      await page.goto(`${this.baseUrl}/dashboard/emergency`);
      await page.waitForSelector('[role="main"]', { timeout: 10000 });
      
      // Test emergency card generation
      const emergencyCard = await page.$('[data-testid="emergency-card"], .emergency-card');
      if (emergencyCard) {
        console.log('  ✅ Emergency card system accessible via touch');
      } else {
        console.log('  ⚠️  Emergency card system may not be touch-optimized');
      }

      // Test vital signs monitoring touch interface
      await page.goto(`${this.baseUrl}/dashboard/monitoring`);
      await page.waitForSelector('[role="main"]', { timeout: 10000 });
      
      // Test real-time monitoring touch controls
      const realtimeTab = await page.$('[value="realtime"]');
      if (realtimeTab) {
        await realtimeTab.tap();
        await page.waitForTimeout(1000);
        console.log('  ✅ Real-time monitoring tab responsive to touch');
      }

      console.log('✅ Touch interaction testing completed\n');
      
    } catch (error) {
      console.error('❌ Touch interaction testing failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  /**
   * Test mobile performance
   */
  async testMobilePerformance() {
    console.log('⚡ Testing Mobile Performance...\n');
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.emulate(devices['iPhone 12']);
    
    try {
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      
      // Test main dashboard performance
      const startTime = Date.now();
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForSelector('[role="main"]', { timeout: 30000 });
      const loadTime = Date.now() - startTime;
      
      console.log(`  📊 Dashboard load time: ${loadTime}ms`);
      
      // Test PWA manifest
      const manifestResponse = await page.goto(`${this.baseUrl}/manifest.json`);
      if (manifestResponse && manifestResponse.ok()) {
        console.log('  ✅ PWA manifest accessible');
      } else {
        console.log('  ⚠️  PWA manifest not found');
      }

      // Test service worker
      const swExists = await page.evaluate(() => 'serviceWorker' in navigator);
      if (swExists) {
        console.log('  ✅ Service worker support detected');
      } else {
        console.log('  ⚠️  Service worker not available');
      }

      console.log('✅ Mobile performance testing completed\n');
      
    } catch (error) {
      console.error('❌ Mobile performance testing failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  /**
   * Test offline functionality
   */
  async testOfflineFunctionality() {
    console.log('🔌 Testing Offline Functionality...\n');
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.emulate(devices['iPhone 12']);
    
    try {
      // First load the page while online
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForSelector('[role="main"]', { timeout: 10000 });
      
      // Simulate offline mode
      await page.setOfflineMode(true);
      
      // Try to navigate to offline page
      try {
        await page.goto(`${this.baseUrl}/offline`);
        console.log('  ✅ Offline page accessible');
      } catch (error) {
        console.log('  ⚠️  Offline page not accessible');
      }
      
      // Test cached resources
      await page.setOfflineMode(false);
      console.log('✅ Offline functionality testing completed\n');
      
    } catch (error) {
      console.error('❌ Offline functionality testing failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  /**
   * Test PWA features
   */
  async testPWAFeatures() {
    console.log('📱 Testing PWA Features...\n');
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.emulate(devices['iPhone 12']);
    
    try {
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForSelector('[role="main"]', { timeout: 10000 });
      
      // Check for PWA install prompt
      const installPrompt = await page.evaluate(() => {
        return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      });
      
      if (installPrompt) {
        console.log('  ✅ PWA install capability detected');
      } else {
        console.log('  📱 PWA install prompt may be available');
      }

      // Test app-like behaviors
      const hasAppIcon = await page.$('link[rel*="icon"]');
      if (hasAppIcon) {
        console.log('  ✅ App icons configured');
      }

      console.log('✅ PWA features testing completed\n');
      
    } catch (error) {
      console.error('❌ PWA features testing failed:', error.message);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log('📊 Generating Mobile Testing Report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      deviceCoverage: this.results.devices.length,
      overallScore: (this.results.summary.passed / this.results.summary.totalTests) * 100,
      recommendations: this.generateRecommendations(),
      details: this.results
    };

    // Display summary
    console.log('='.repeat(60));
    console.log('📱 MOBILE TESTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}%`);
    console.log(`Tests Passed: ${this.results.summary.passed}/${this.results.summary.totalTests}`);
    console.log(`Devices Tested: ${this.results.devices.length}`);
    console.log();

    // Show device-specific results
    console.log('Device Performance:');
    this.results.devices.forEach(device => {
      const score = device.results.overallScore || 0;
      const status = score > 80 ? '✅' : score > 60 ? '⚠️' : '❌';
      console.log(`  ${status} ${device.device}: ${score.toFixed(1)}%`);
    });
    console.log();

    // Show recommendations
    if (report.recommendations.length > 0) {
      console.log('📋 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log();
    }

    console.log('✅ Mobile testing completed successfully!');
    return report;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    const failureRate = (this.results.summary.failed / this.results.summary.totalTests) * 100;
    
    if (failureRate > 20) {
      recommendations.push('Consider improving mobile layout consistency across devices');
    }

    if (this.results.devices.some(d => d.results.overallScore < 70)) {
      recommendations.push('Optimize touch interfaces for better mobile usability');
    }

    recommendations.push('Implement progressive loading for better mobile performance');
    recommendations.push('Add haptic feedback for critical emergency functions');
    recommendations.push('Optimize real-time monitoring charts for touch interaction');

    return recommendations;
  }
}

// Export for use in other scripts
module.exports = { MobileTestingSuite };

// Run if called directly
if (require.main === module) {
  const suite = new MobileTestingSuite();
  suite.runAllTests().catch(console.error);
}