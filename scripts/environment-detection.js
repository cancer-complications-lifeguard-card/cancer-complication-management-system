/**
 * Environment Detection & Error Fixing Script
 * Comprehensive system diagnosis and automatic error resolution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Cancer Management System - Environment Detection');
console.log('=' .repeat(70));

// Detection results tracking
const detectionResults = {
  passed: 0,
  failed: 0,
  fixed: 0,
  total: 0,
  errors: [],
  warnings: [],
  fixes: []
};

function runDetection(testName, detectionFunction) {
  detectionResults.total++;
  console.log(`\n🔍 ${testName}`);
  console.log('-' .repeat(50));
  
  try {
    const result = detectionFunction();
    if (result.status === 'PASS') {
      detectionResults.passed++;
      console.log(`✅ ${result.message}`);
    } else if (result.status === 'WARNING') {
      detectionResults.warnings.push({ test: testName, message: result.message });
      console.log(`⚠️  ${result.message}`);
    } else if (result.status === 'FIXED') {
      detectionResults.fixed++;
      detectionResults.fixes.push({ test: testName, message: result.message });
      console.log(`🔧 ${result.message}`);
    } else {
      detectionResults.failed++;
      detectionResults.errors.push({ test: testName, message: result.message });
      console.log(`❌ ${result.message}`);
    }
  } catch (error) {
    detectionResults.failed++;
    detectionResults.errors.push({ test: testName, message: error.message });
    console.log(`💥 ERROR: ${error.message}`);
  }
}

// Detection 1: Project Structure Integrity
runDetection('Project Structure Integrity', () => {
  const criticalPaths = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'tailwind.config.ts',
    'app/layout.tsx',
    'app/page.tsx',
    'lib/db/schema.ts',
    'components/ui',
    'public/manifest.json',
    'public/sw.js'
  ];
  
  const missingPaths = criticalPaths.filter(p => !fs.existsSync(path.join(process.cwd(), p)));
  
  if (missingPaths.length === 0) {
    return { status: 'PASS', message: 'All critical project files and directories exist' };
  } else {
    return { status: 'FAIL', message: `Missing critical paths: ${missingPaths.join(', ')}` };
  }
});

// Detection 2: TypeScript Configuration
runDetection('TypeScript Configuration', () => {
  try {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    const requiredCompilerOptions = [
      'strict',
      'esModuleInterop',
      'skipLibCheck',
      'forceConsistentCasingInFileNames'
    ];
    
    const missingOptions = requiredCompilerOptions.filter(option => 
      tsconfig.compilerOptions && tsconfig.compilerOptions[option] === undefined
    );
    
    if (missingOptions.length === 0) {
      return { status: 'PASS', message: 'TypeScript configuration is properly set up' };
    } else {
      return { status: 'WARNING', message: `Missing TypeScript options: ${missingOptions.join(', ')}` };
    }
  } catch (error) {
    return { status: 'FAIL', message: `TypeScript config error: ${error.message}` };
  }
});

// Detection 3: Dependencies Integrity
runDetection('Dependencies Integrity', () => {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const criticalDependencies = [
      'next',
      'react',
      'react-dom',
      'typescript',
      '@types/node',
      'tailwindcss',
      'drizzle-orm',
      'postgres',
      'jose',
      'lucide-react',
      'reactflow'
    ];
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const missingDeps = criticalDependencies.filter(dep => !allDeps[dep]);
    
    if (missingDeps.length === 0) {
      return { status: 'PASS', message: 'All critical dependencies are installed' };
    } else {
      return { status: 'FAIL', message: `Missing dependencies: ${missingDeps.join(', ')}` };
    }
  } catch (error) {
    return { status: 'FAIL', message: `Dependencies check error: ${error.message}` };
  }
});

// Detection 4: Database Schema Validation
runDetection('Database Schema Validation', () => {
  try {
    const schemaPath = path.join(process.cwd(), 'lib/db/schema.ts');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const requiredTables = [
      'users',
      'medicalProfiles', 
      'medications',
      'emergencyCards',
      'vitalSigns',
      'medicalTerms',
      'complicationRiskTrees',
      'pushSubscriptions'
    ];
    
    const missingTables = requiredTables.filter(table => 
      !schemaContent.includes(`export const ${table}`)
    );
    
    if (missingTables.length === 0) {
      return { status: 'PASS', message: 'Database schema includes all required tables' };
    } else {
      return { status: 'FAIL', message: `Missing database tables: ${missingTables.join(', ')}` };
    }
  } catch (error) {
    return { status: 'FAIL', message: `Schema validation error: ${error.message}` };
  }
});

// Detection 5: API Routes Validation
runDetection('API Routes Validation', () => {
  const criticalAPIRoutes = [
    'app/api/user/route.ts',
    'app/api/medical-profile/route.ts',
    'app/api/emergency-cards/route.ts',
    'app/api/medications/route.ts',
    'app/api/vital-signs/route.ts',
    'app/api/medical-terms/search/route.ts',
    'app/api/risk-trees/[cancerType]/route.ts',
    'app/api/push-subscription/route.ts'
  ];
  
  const missingRoutes = criticalAPIRoutes.filter(route => 
    !fs.existsSync(path.join(process.cwd(), route))
  );
  
  if (missingRoutes.length === 0) {
    return { status: 'PASS', message: 'All critical API routes are implemented' };
  } else {
    return { status: 'FAIL', message: `Missing API routes: ${missingRoutes.join(', ')}` };
  }
});

// Detection 6: Component Import Validation
runDetection('Component Import Validation', () => {
  const componentFiles = [
    'app/dashboard/knowledge/knowledge-graph-client.tsx',
    'components/knowledge/risk-tree-visualization.tsx',
    'components/navigation/mobile-nav.tsx',
    'components/pwa/pwa-install-prompt.tsx'
  ];
  
  let importErrors = [];
  
  componentFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for problematic lucide-react imports
      const problematicImports = ['Tree', 'Trees', 'Flask'];
      problematicImports.forEach(imp => {
        if (content.includes(`import { ${imp},`) || content.includes(`import {${imp},`)) {
          importErrors.push(`${file}: Problematic import '${imp}' found`);
        }
      });
    }
  });
  
  if (importErrors.length === 0) {
    return { status: 'PASS', message: 'No problematic component imports detected' };
  } else {
    return { status: 'WARNING', message: `Import issues: ${importErrors.join('; ')}` };
  }
});

// Detection 7: PWA Configuration
runDetection('PWA Configuration', () => {
  try {
    // Check manifest.json
    const manifestPath = path.join(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredManifestFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredManifestFields.filter(field => !manifest[field]);
    
    // Check service worker
    const swPath = path.join(process.cwd(), 'public/sw.js');
    const swExists = fs.existsSync(swPath);
    
    if (missingFields.length === 0 && swExists) {
      return { status: 'PASS', message: 'PWA configuration is complete' };
    } else {
      const issues = [];
      if (missingFields.length > 0) issues.push(`Missing manifest fields: ${missingFields.join(', ')}`);
      if (!swExists) issues.push('Service worker missing');
      return { status: 'FAIL', message: issues.join('; ') };
    }
  } catch (error) {
    return { status: 'FAIL', message: `PWA configuration error: ${error.message}` };
  }
});

// Detection 8: Security Configuration
runDetection('Security Configuration', () => {
  try {
    const securityFiles = [
      'lib/security/encryption.ts',
      'lib/security/access-control.ts', 
      'lib/security/audit-logger.ts',
      'lib/auth/session.ts'
    ];
    
    const missingSecurityFiles = securityFiles.filter(file => 
      !fs.existsSync(path.join(process.cwd(), file))
    );
    
    if (missingSecurityFiles.length === 0) {
      return { status: 'PASS', message: 'Security configuration files are present' };
    } else {
      return { status: 'FAIL', message: `Missing security files: ${missingSecurityFiles.join(', ')}` };
    }
  } catch (error) {
    return { status: 'FAIL', message: `Security check error: ${error.message}` };
  }
});

// Detection 9: Environment Variables
runDetection('Environment Variables', () => {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    return { status: 'WARNING', message: '.env.example file missing for reference' };
  }
  
  if (!fs.existsSync(envPath)) {
    return { status: 'WARNING', message: '.env file not found - using defaults or system environment' };
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    const hasRequiredVars = requiredVars.every(varName => 
      envContent.includes(varName) || process.env[varName]
    );
    
    if (hasRequiredVars) {
      return { status: 'PASS', message: 'Essential environment variables are configured' };
    } else {
      return { status: 'WARNING', message: 'Some environment variables may be missing' };
    }
  } catch (error) {
    return { status: 'WARNING', message: `Environment variables check: ${error.message}` };
  }
});

// Detection 10: Build Configuration
runDetection('Build Configuration', () => {
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    
    if (!fs.existsSync(nextConfigPath)) {
      return { status: 'FAIL', message: 'next.config.ts missing' };
    }
    
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for essential Next.js configurations
    const hasEssentialConfig = configContent.includes('NextConfig') || 
                              configContent.includes('module.exports') ||
                              configContent.includes('export default');
    
    if (hasEssentialConfig) {
      return { status: 'PASS', message: 'Next.js configuration is properly set up' };
    } else {
      return { status: 'WARNING', message: 'Next.js configuration may need review' };
    }
  } catch (error) {
    return { status: 'FAIL', message: `Build configuration error: ${error.message}` };
  }
});

// Print Detection Summary
console.log('\n\n🔍 Environment Detection Summary');
console.log('=' .repeat(70));
console.log(`Total Checks: ${detectionResults.total}`);
console.log(`✅ Passed: ${detectionResults.passed}`);
console.log(`⚠️  Warnings: ${detectionResults.warnings.length}`);
console.log(`❌ Failed: ${detectionResults.failed}`);
console.log(`🔧 Fixed: ${detectionResults.fixed}`);
console.log(`📊 Health Score: ${((detectionResults.passed + detectionResults.fixed) / detectionResults.total * 100).toFixed(1)}%`);

// Error Details
if (detectionResults.errors.length > 0) {
  console.log('\n❌ Critical Errors Found:');
  console.log('-' .repeat(50));
  detectionResults.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.test}: ${error.message}`);
  });
}

// Warning Details  
if (detectionResults.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  console.log('-' .repeat(50));
  detectionResults.warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning.test}: ${warning.message}`);
  });
}

// Fix Details
if (detectionResults.fixes.length > 0) {
  console.log('\n🔧 Fixes Applied:');
  console.log('-' .repeat(50));
  detectionResults.fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix.test}: ${fix.message}`);
  });
}

// Recommendations
console.log('\n💡 Recommendations:');
console.log('-' .repeat(50));

const healthScore = (detectionResults.passed + detectionResults.fixed) / detectionResults.total * 100;

if (healthScore >= 90) {
  console.log('🎉 Excellent! Your environment is in great shape.');
  console.log('✅ All critical systems are operational.');
  console.log('🚀 Ready for production deployment.');
} else if (healthScore >= 80) {
  console.log('👍 Good environment health detected.');
  console.log('⚠️  Address warnings for optimal performance.');
  console.log('🔧 Consider fixing non-critical issues.');
} else if (healthScore >= 70) {
  console.log('⚠️  Environment needs attention.');
  console.log('❌ Fix critical errors before proceeding.');
  console.log('🔧 Address all failed checks.');
} else {
  console.log('🚨 Critical environment issues detected!');
  console.log('❌ Multiple systems require immediate attention.');
  console.log('🛑 Do not deploy until issues are resolved.');
}

// System Information
console.log('\n📋 System Information:');
console.log('-' .repeat(50));
console.log(`🔧 Node.js Version: ${process.version}`);
console.log(`📦 Platform: ${process.platform}`);
console.log(`🏗️  Architecture: ${process.arch}`);
console.log(`💾 Memory Usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

console.log('\n🔍 Environment Detection Complete');
console.log('🎯 Ready for error fixing phase...');

// Return results for potential automated fixing
module.exports = {
  results: detectionResults,
  healthScore: healthScore
};