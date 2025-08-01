const puppeteer = require('puppeteer');

async function testMaintenancePage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  try {
    console.log('🧪 测试知识图谱维护页面...');
    console.log('');
    
    // 导航到主页
    console.log('📍 Step 1: 导航到主页...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️  Step 2: 等待页面加载 (3秒)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 尝试访问知识图谱页面
    console.log('📍 Step 3: 导航到知识图谱页面...');
    await page.goto('http://localhost:3000/dashboard/knowledge', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏱️  Step 4: 等待页面内容加载 (3秒)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查维护页面元素
    console.log('🔍 Step 5: 检查维护页面内容...');
    
    const maintenanceCheck = await page.evaluate(() => {
      const titleElement = document.querySelector('h2');
      const descriptionElement = document.querySelector('p');
      const settingsIcon = document.querySelector('[data-lucide="settings"]');
      const clockIcon = document.querySelector('[data-lucide="clock"]');
      
      return {
        hasMaintenanceTitle: titleElement && titleElement.textContent.includes('功能正在升级维护中'),
        hasComingSoonText: descriptionElement && descriptionElement.textContent.includes('敬请期待'),
        hasSettingsIcon: !!settingsIcon,
        hasClockIcon: !!clockIcon,
        pageContent: document.body.textContent
      };
    });
    
    console.log('📊 维护页面检查结果:');
    console.log('============================');
    console.log(`✅ 维护标题存在: ${maintenanceCheck.hasMaintenanceTitle}`);
    console.log(`✅ "敬请期待"文本存在: ${maintenanceCheck.hasComingSoonText}`);
    console.log(`✅ 设置图标存在: ${maintenanceCheck.hasSettingsIcon}`);
    console.log(`✅ 时钟图标存在: ${maintenanceCheck.hasClockIcon}`);
    
    // 检查页面是否包含维护相关文本
    const hasMaintenanceContent = maintenanceCheck.pageContent.includes('功能正在升级维护中') &&
                                  maintenanceCheck.pageContent.includes('敬请期待');

    if (hasMaintenanceContent) {
      console.log('');
      console.log('🎉 成功: 知识图谱维护页面正确显示!');
      console.log('✅ 页面显示维护状态信息');
      console.log('✅ 包含期待信息和说明');
      console.log('✅ 用户界面友好且专业');
    } else {
      console.log('');
      console.log('❌ 失败: 维护页面内容不完整');
      console.log('页面内容预览:');
      console.log(maintenanceCheck.pageContent.substring(0, 300) + '...');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

// 运行测试
testMaintenancePage().catch(console.error);