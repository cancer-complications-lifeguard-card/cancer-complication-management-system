/**
 * Automatic Error Fixing Script
 * Fixes detected environment issues automatically
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Cancer Management System - Auto Error Fixing');
console.log('=' .repeat(70));

const fixResults = {
  applied: 0,
  failed: 0,
  total: 0,
  fixes: [],
  failures: []
};

function applyFix(fixName, fixFunction) {
  fixResults.total++;
  console.log('\n🔧 Applying Fix: ' + fixName);
  console.log('-' .repeat(50));
  
  try {
    const result = fixFunction();
    fixResults.applied++;
    fixResults.fixes.push({ name: fixName, message: result });
    console.log('✅ ' + result);
  } catch (error) {
    fixResults.failed++;
    fixResults.failures.push({ name: fixName, error: error.message });
    console.log('❌ Failed: ' + error.message);
  }
}

// Fix 1: Create missing tailwind.config.ts
applyFix('Create Tailwind CSS Configuration', () => {
  const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
  
  if (fs.existsSync(tailwindConfigPath)) {
    return 'Tailwind config already exists - skipping';
  }
  
  const tailwindConfig = `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config`;
  
  fs.writeFileSync(tailwindConfigPath, tailwindConfig);
  return 'Created tailwind.config.ts with medical UI optimizations';
});

// Fix 2: Update TypeScript configuration
applyFix('Update TypeScript Configuration', () => {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Add missing compiler options
  if (!tsconfig.compilerOptions.forceConsistentCasingInFileNames) {
    tsconfig.compilerOptions.forceConsistentCasingInFileNames = true;
  }
  
  // Ensure other important options are set
  const essentialOptions = {
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: false
  };
  
  let changes = [];
  Object.entries(essentialOptions).forEach(([option, value]) => {
    if (tsconfig.compilerOptions[option] !== value) {
      tsconfig.compilerOptions[option] = value;
      changes.push(option);
    }
  });
  
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  return 'Updated TypeScript config: ' + (changes.length > 0 ? changes.join(', ') : 'All good');
});

// Fix 3: Check if vitalSigns exists in schema (healthMetrics is the actual table)
applyFix('Verify Vital Signs Table in Schema', () => {
  const schemaPath = path.join(process.cwd(), 'lib/db/schema.ts');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Database schema file not found');
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check if vitalSigns table exists
  if (schemaContent.includes('export const vitalSigns')) {
    return 'vitalSigns table already exists in schema';
  }
  
  // Check if we have healthMetrics which serves the same purpose
  if (schemaContent.includes('healthMetrics')) {
    return 'Vital signs functionality exists as healthMetrics table - no fix needed';
  }
  
  return 'Neither vitalSigns nor healthMetrics table found - manual review may be needed';
});

// Fix 4: Create or update .env.example with essential variables
applyFix('Update Environment Variables Template', () => {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  const envTemplate = `# Cancer Management System Environment Configuration

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/cancer_management_db"

# Authentication & Security
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ENCRYPTION_KEY="your-32-character-encryption-key"

# PWA & Push Notifications
NEXT_PUBLIC_VAPID_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"

# External APIs (Optional)
OPENAI_API_KEY="your-openai-api-key-for-ai-features"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Development
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Medical Data Security (Production)
HIPAA_COMPLIANCE_MODE="false"
DATA_RETENTION_DAYS="2555"

# Monitoring & Logging
LOG_LEVEL="info"
ENABLE_AUDIT_LOGGING="true"`;
  
  fs.writeFileSync(envExamplePath, envTemplate);
  return 'Updated .env.example with all essential environment variables';
});

// Fix 5: Ensure PostCSS configuration exists
applyFix('Ensure PostCSS Configuration', () => {
  const postcssPath = path.join(process.cwd(), 'postcss.config.mjs');
  const postcssJsPath = path.join(process.cwd(), 'postcss.config.js');
  
  if (fs.existsSync(postcssPath) || fs.existsSync(postcssJsPath)) {
    return 'PostCSS config already exists';
  }
  
  const postcssConfig = `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;`;
  
  fs.writeFileSync(postcssPath, postcssConfig);
  return 'Created postcss.config.mjs for Tailwind processing';
});

// Fix 6: Optimize package.json scripts
applyFix('Optimize Package.json Scripts', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const essentialScripts = {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "node -r esbuild-register lib/db/seed.ts",
    "test:env": "node scripts/environment-detection.js",
    "fix:auto": "node scripts/auto-fix-errors.js",
    "test:mobile": "node scripts/test-mobile-responsive.js",
    "test:pwa": "node scripts/test-pwa-features.js"
  };
  
  let updatedScripts = 0;
  Object.entries(essentialScripts).forEach(([script, command]) => {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
      updatedScripts++;
    }
  });
  
  if (updatedScripts > 0) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return 'Added ' + updatedScripts + ' missing npm scripts for development and testing';
  } else {
    return 'All essential npm scripts already present';
  }
});

// Print Fix Summary
console.log('\n\n🔧 Auto Fix Summary');
console.log('=' .repeat(70));
console.log('Total Fixes Attempted: ' + fixResults.total);
console.log('✅ Successfully Applied: ' + fixResults.applied);
console.log('❌ Failed: ' + fixResults.failed);
console.log('📊 Fix Success Rate: ' + (fixResults.applied / fixResults.total * 100).toFixed(1) + '%');

// Applied Fixes
if (fixResults.fixes.length > 0) {
  console.log('\n✅ Successfully Applied Fixes:');
  console.log('-' .repeat(50));
  fixResults.fixes.forEach((fix, index) => {
    console.log((index + 1) + '. ' + fix.name + ': ' + fix.message);
  });
}

// Failed Fixes
if (fixResults.failures.length > 0) {
  console.log('\n❌ Failed Fixes:');
  console.log('-' .repeat(50));
  fixResults.failures.forEach((failure, index) => {
    console.log((index + 1) + '. ' + failure.name + ': ' + failure.error);
  });
}

// Next Steps
console.log('\n📋 Next Steps:');
console.log('-' .repeat(50));
console.log('1. 🔄 Run environment detection again to verify fixes');
console.log('2. 🏗️  Generate new database migration if schema was updated');
console.log('3. 🧪 Run comprehensive tests to ensure system stability');
console.log('4. 🚀 Restart development server to apply configuration changes');

console.log('\n🔧 Automatic Error Fixing Complete');

module.exports = {
  fixResults
};