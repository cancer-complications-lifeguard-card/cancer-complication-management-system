import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { UserRole, UserStage } from '@/lib/db/schema';
import { hasPermission, canAccessResource, getDataAccessPolicy, validateAccessLevel, Permission, ResourceType } from './access-control';
import { logAuditEvent, logDataAccess, logPermissionDenied, AuditEventType, AuditSeverity } from './audit-logger';

// 安全配置
interface SecurityConfig {
  requiresAuth: boolean;
  requiredPermission?: Permission;
  resourceType?: ResourceType;
  requiresEncryption?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMinutes: number;
  };
  ipWhitelist?: string[];
}

// 请求上下文
interface SecurityContext {
  userId: number;
  userRole: UserRole;
  userStage: UserStage;
  ipAddress: string;
  userAgent: string;
  method: string;
  path: string;
  resourceId?: string;
}

// 速率限制存储 (生产环境应使用Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 安全中间件工厂函数
 */
export function withSecurity(config: SecurityConfig) {
  return async function securityMiddleware(
    request: NextRequest,
    handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    
    try {
      // 获取请求信息
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const method = request.method;
      const path = request.nextUrl.pathname;
      
      // IP 白名单检查
      if (config.ipWhitelist && !config.ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent({
          userId: 0,
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          action: 'IP not whitelisted',
          severity: AuditSeverity.HIGH,
          ipAddress,
          details: { path, method, userAgent },
        });
        
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      // 速率限制检查
      if (config.rateLimit) {
        const rateLimitKey = `${ipAddress}:${path}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, config.rateLimit);
        
        if (!rateLimitResult.allowed) {
          await logSecurityEvent({
            userId: 0,
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
            action: 'Rate limit exceeded',
            severity: AuditSeverity.MEDIUM,
            ipAddress,
            details: { path, method, limit: config.rateLimit },
          });
          
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': config.rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              },
            }
          );
        }
      }
      
      // 身份验证检查
      let context: SecurityContext;
      
      if (config.requiresAuth) {
        const session = await getSession();
        if (!session) {
          await logSecurityEvent({
            userId: 0,
            eventType: AuditEventType.UNAUTHORIZED_ACCESS,
            action: 'Authentication required',
            severity: AuditSeverity.MEDIUM,
            ipAddress,
            details: { path, method },
          });
          
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        context = {
          userId: session.userId,
          userRole: session.userRole as UserRole,
          userStage: session.userStage as UserStage,
          ipAddress,
          userAgent,
          method,
          path,
        };
      } else {
        context = {
          userId: 0,
          userRole: UserRole.PATIENT, // 默认角色
          userStage: UserStage.DAILY,
          ipAddress,
          userAgent,
          method,
          path,
        };
      }
      
      // 权限检查
      if (config.requiredPermission) {
        if (!hasPermission(context.userRole, context.userStage, config.requiredPermission)) {
          await logPermissionDenied(
            context.userId,
            config.requiredPermission,
            config.resourceType || ResourceType.SYSTEM_LOG,
            context.resourceId,
            ipAddress
          );
          
          return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }
      }
      
      // 资源访问权限检查
      if (config.resourceType) {
        const policy = getDataAccessPolicy(config.resourceType);
        
        if (!validateAccessLevel(context.userRole, context.userStage, policy.accessLevelRequired)) {
          await logPermissionDenied(
            context.userId,
            Permission.READ_OWN_DATA, // 占位符
            config.resourceType,
            context.resourceId,
            ipAddress
          );
          
          return NextResponse.json({ error: 'Insufficient access level' }, { status: 403 });
        }
      }
      
      // 记录访问日志
      if (config.resourceType) {
        await logDataAccess(
          context.userId,
          config.resourceType,
          context.resourceId || 'unknown',
          method === 'GET' ? 'read' : method === 'POST' || method === 'PUT' ? 'write' : 'delete',
          ipAddress,
          { userAgent, path, method }
        );
      }
      
      // 调用处理函数
      const response = await handler(request, context);
      
      // 记录响应时间
      const responseTime = Date.now() - startTime;
      
      // 添加安全头
      addSecurityHeaders(response);
      
      // 记录性能日志
      if (responseTime > 5000) { // 超过5秒的慢查询
        await logSecurityEvent({
          userId: context.userId,
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          action: 'Slow response detected',
          severity: AuditSeverity.LOW,
          ipAddress,
          details: { path, method, responseTime },
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      // 记录错误日志
      await logSecurityEvent({
        userId: 0,
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        action: 'Security middleware error',
        severity: AuditSeverity.HIGH,
        ipAddress: getClientIP(request),
        details: { error: error.message, path: request.nextUrl.pathname },
      });
      
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

/**
 * 速率限制检查
 */
function checkRateLimit(
  key: string,
  limit: { maxRequests: number; windowMinutes: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = limit.windowMinutes * 60 * 1000;
  const resetTime = now + windowMs;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit.maxRequests - 1, resetTime };
  }
  
  if (entry.count >= limit.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }
  
  entry.count++;
  return { allowed: true, remaining: limit.maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * 添加安全头
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // 对于医疗数据，添加更严格的CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
}

/**
 * 记录安全事件
 */
async function logSecurityEvent(event: {
  userId: number;
  eventType: AuditEventType;
  action: string;
  severity: AuditSeverity;
  ipAddress: string;
  details?: any;
}): Promise<void> {
  try {
    await logAuditEvent(event);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * 数据加密中间件
 */
export function withEncryption<T>(
  encryptFields: string[] = ['patientName', 'diagnosis', 'medicalHistory']
) {
  return function encryptionMiddleware(data: T): T {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const encrypted = { ...data };
    
    for (const field of encryptFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        try {
          // 这里应该调用加密函数
          // encrypted[field] = encryptSensitiveData(encrypted[field]);
        } catch (error) {
          console.error(`Failed to encrypt field ${field}:`, error);
        }
      }
    }
    
    return encrypted;
  };
}

/**
 * 数据脱敏中间件
 */
export function withDataMasking(
  userRole: UserRole,
  userStage: UserStage,
  resourceOwnerId: number,
  currentUserId: number
) {
  return function maskingMiddleware<T>(data: T): T {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    // 根据用户权限决定脱敏级别
    const shouldMask = resourceOwnerId !== currentUserId && 
                      userRole === UserRole.FAMILY && 
                      userStage !== UserStage.ONSET;
    
    if (!shouldMask) {
      return data;
    }
    
    const masked = { ...data };
    
    // 脱敏处理
    if (masked['patientName']) {
      masked['patientName'] = maskName(masked['patientName']);
    }
    
    if (masked['phone']) {
      masked['phone'] = maskPhone(masked['phone']);
    }
    
    if (masked['email']) {
      masked['email'] = maskEmail(masked['email']);
    }
    
    return masked;
  };
}

/**
 * 脱敏函数
 */
function maskName(name: string): string {
  return name.charAt(0) + '*'.repeat(name.length - 1);
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskEmail(email: string): string {
  return email.replace(/(.{2}).*@(.*)/, '$1***@$2');
}

/**
 * 清理速率限制存储的定时任务
 */
export function startRateLimitCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // 每分钟清理一次
}

/**
 * 验证请求完整性
 */
export function validateRequestIntegrity(request: NextRequest): boolean {
  const timestamp = request.headers.get('x-timestamp');
  const signature = request.headers.get('x-signature');
  
  if (!timestamp || !signature) {
    return false;
  }
  
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  // 请求时间戳不能超过5分钟
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }
  
  // 这里应该验证请求签名
  // const expectedSignature = generateRequestSignature(request, timestamp);
  // return signature === expectedSignature;
  
  return true;
}