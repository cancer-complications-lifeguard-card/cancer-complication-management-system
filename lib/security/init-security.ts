import { generateEncryptionKey } from './encryption';
import { startRateLimitCleanup } from './security-middleware';

/**
 * 初始化安全系统
 */
export function initSecurity(): void {
  console.log('🔐 Initializing security system...');
  
  // 检查必要的环境变量
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  ENCRYPTION_KEY not set, generating a new one...');
    console.warn('Generated key:', generateEncryptionKey());
    console.warn('Please add this key to your .env file');
  }
  
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not set, please configure it in your .env file');
  }
  
  if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  SESSION_SECRET not set, please configure it in your .env file');
  }
  
  // 启动速率限制清理任务
  if (typeof window === 'undefined') {
    startRateLimitCleanup();
  }
  
  console.log('✅ Security system initialized successfully');
  
  // 打印安全配置概览
  console.log('\n📋 Security Configuration:');
  console.log(`- Encryption: ${process.env.ENCRYPTION_KEY ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`- Rate Limiting: ${process.env.API_RATE_LIMIT_MAX ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`- HTTPS Enforcement: ${process.env.ENFORCE_HTTPS === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`- Secure Cookies: ${process.env.SECURE_COOKIES === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('');
}

/**
 * 验证安全配置
 */
export function validateSecurityConfig(): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!process.env.ENCRYPTION_KEY) {
    issues.push('ENCRYPTION_KEY is not configured');
  }
  
  if (!process.env.JWT_SECRET) {
    issues.push('JWT_SECRET is not configured');
  }
  
  if (!process.env.SESSION_SECRET) {
    issues.push('SESSION_SECRET is not configured');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ENFORCE_HTTPS !== 'true') {
      issues.push('HTTPS enforcement should be enabled in production');
    }
    
    if (process.env.SECURE_COOKIES !== 'true') {
      issues.push('Secure cookies should be enabled in production');
    }
    
    if (!process.env.POSTGRES_URL?.includes('sslmode=require')) {
      issues.push('Database connection should use SSL in production');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * 生成安全报告
 */
export function generateSecurityReport(): {
  encryption: boolean;
  rateLimit: boolean;
  https: boolean;
  secureCookies: boolean;
  databaseSSL: boolean;
  overallScore: number;
} {
  const report = {
    encryption: !!process.env.ENCRYPTION_KEY,
    rateLimit: !!process.env.API_RATE_LIMIT_MAX,
    https: process.env.ENFORCE_HTTPS === 'true',
    secureCookies: process.env.SECURE_COOKIES === 'true',
    databaseSSL: process.env.POSTGRES_URL?.includes('sslmode=require') || false,
    overallScore: 0,
  };
  
  // 计算总体安全评分
  const trueCount = Object.values(report).filter(Boolean).length - 1; // 排除 overallScore
  report.overallScore = Math.round((trueCount / 5) * 100);
  
  return report;
}