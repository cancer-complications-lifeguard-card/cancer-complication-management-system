import { db } from '@/lib/db/drizzle';
import { activityLogs } from '@/lib/db/schema';
import { ResourceType, Permission } from './access-control';
import { encryptSensitiveData, generateDataHash } from './encryption';

// 审计事件类型
export enum AuditEventType {
  // 认证相关
  LOGIN_SUCCESS = 'auth:login_success',
  LOGIN_FAILED = 'auth:login_failed',
  LOGOUT = 'auth:logout',
  PASSWORD_CHANGED = 'auth:password_changed',
  
  // 数据访问
  DATA_READ = 'data:read',
  DATA_WRITE = 'data:write',
  DATA_DELETE = 'data:delete',
  DATA_EXPORT = 'data:export',
  
  // 医疗记录
  MEDICAL_RECORD_CREATED = 'medical:record_created',
  MEDICAL_RECORD_UPDATED = 'medical:record_updated',
  MEDICAL_RECORD_DELETED = 'medical:record_deleted',
  MEDICAL_RECORD_ACCESSED = 'medical:record_accessed',
  
  // 急救卡
  EMERGENCY_CARD_CREATED = 'emergency:card_created',
  EMERGENCY_CARD_UPDATED = 'emergency:card_updated',
  EMERGENCY_CARD_SCANNED = 'emergency:card_scanned',
  EMERGENCY_CALL_MADE = 'emergency:call_made',
  
  // 分诊系统
  TRIAGE_ASSESSMENT_STARTED = 'triage:assessment_started',
  TRIAGE_ASSESSMENT_COMPLETED = 'triage:assessment_completed',
  TRIAGE_RESULT_VIEWED = 'triage:result_viewed',
  
  // 知识图谱
  KNOWLEDGE_ACCESSED = 'knowledge:accessed',
  KNOWLEDGE_SEARCHED = 'knowledge:searched',
  KNOWLEDGE_INTERACTION = 'knowledge:interaction',
  
  // 系统安全
  UNAUTHORIZED_ACCESS = 'security:unauthorized_access',
  PERMISSION_DENIED = 'security:permission_denied',
  SUSPICIOUS_ACTIVITY = 'security:suspicious_activity',
  DATA_INTEGRITY_VIOLATION = 'security:data_integrity_violation',
  
  // 系统管理
  SYSTEM_CONFIG_CHANGED = 'system:config_changed',
  USER_CREATED = 'system:user_created',
  USER_UPDATED = 'system:user_updated',
  USER_DELETED = 'system:user_deleted',
}

// 审计事件严重程度
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 审计事件接口
export interface AuditEvent {
  userId: number;
  eventType: AuditEventType;
  resourceType?: ResourceType;
  resourceId?: string;
  action: string;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp?: Date;
}

// 可疑活动检测规则
interface SuspiciousActivityRule {
  eventType: AuditEventType;
  maxOccurrences: number;
  timeWindowMinutes: number;
  severity: AuditSeverity;
}

const SUSPICIOUS_ACTIVITY_RULES: SuspiciousActivityRule[] = [
  {
    eventType: AuditEventType.LOGIN_FAILED,
    maxOccurrences: 5,
    timeWindowMinutes: 15,
    severity: AuditSeverity.HIGH,
  },
  {
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    maxOccurrences: 3,
    timeWindowMinutes: 10,
    severity: AuditSeverity.CRITICAL,
  },
  {
    eventType: AuditEventType.EMERGENCY_CARD_SCANNED,
    maxOccurrences: 10,
    timeWindowMinutes: 60,
    severity: AuditSeverity.MEDIUM,
  },
  {
    eventType: AuditEventType.DATA_EXPORT,
    maxOccurrences: 5,
    timeWindowMinutes: 30,
    severity: AuditSeverity.HIGH,
  },
];

/**
 * 记录审计日志
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    // 加密敏感详情信息
    const encryptedDetails = event.details ? encryptSensitiveData(JSON.stringify(event.details)) : null;
    
    // 生成数据完整性哈希
    const dataHash = generateDataHash(JSON.stringify({
      userId: event.userId,
      eventType: event.eventType,
      action: event.action,
      timestamp: event.timestamp || new Date(),
    }));
    
    await db.insert(activityLogs).values({
      userId: event.userId,
      action: event.action,
      ipAddress: event.ipAddress,
      metadata: JSON.stringify({
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        severity: event.severity,
        userAgent: event.userAgent,
        details: encryptedDetails,
        dataHash,
        timestamp: event.timestamp || new Date(),
      }),
    });
    
    // 检查可疑活动
    await checkSuspiciousActivity(event);
    
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // 审计日志失败不应该影响主要功能，但需要记录错误
  }
}

/**
 * 检查可疑活动
 */
async function checkSuspiciousActivity(event: AuditEvent): Promise<void> {
  const applicableRules = SUSPICIOUS_ACTIVITY_RULES.filter(rule => rule.eventType === event.eventType);
  
  for (const rule of applicableRules) {
    const timeWindow = new Date(Date.now() - rule.timeWindowMinutes * 60 * 1000);
    
    // 查询时间窗口内的相同事件
    const recentEvents = await db
      .select()
      .from(activityLogs)
      .where(
        // 这里需要根据实际数据库结构调整查询条件
        // 暂时使用简化的逻辑
      )
      .limit(rule.maxOccurrences + 1);
    
    if (recentEvents.length > rule.maxOccurrences) {
      // 触发可疑活动警报
      await logAuditEvent({
        userId: event.userId,
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        action: `Suspicious activity detected: ${rule.eventType}`,
        severity: rule.severity,
        ipAddress: event.ipAddress,
        details: {
          triggeredRule: rule,
          eventCount: recentEvents.length,
          timeWindow: rule.timeWindowMinutes,
        },
      });
      
      // 可以在这里添加其他响应措施，如发送告警邮件
    }
  }
}

/**
 * 记录数据访问事件
 */
export async function logDataAccess(
  userId: number,
  resourceType: ResourceType,
  resourceId: string,
  action: 'read' | 'write' | 'delete',
  ipAddress?: string,
  details?: any
): Promise<void> {
  const eventType = action === 'read' ? AuditEventType.DATA_READ :
                   action === 'write' ? AuditEventType.DATA_WRITE :
                   AuditEventType.DATA_DELETE;
  
  const severity = resourceType === ResourceType.MEDICAL_RECORD ? AuditSeverity.HIGH :
                  resourceType === ResourceType.EMERGENCY_CARD ? AuditSeverity.HIGH :
                  AuditSeverity.MEDIUM;
  
  await logAuditEvent({
    userId,
    eventType,
    resourceType,
    resourceId,
    action: `${action} ${resourceType}`,
    severity,
    ipAddress,
    details,
  });
}

/**
 * 记录医疗记录访问
 */
export async function logMedicalRecordAccess(
  userId: number,
  recordId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  ipAddress?: string,
  details?: any
): Promise<void> {
  const eventTypeMap = {
    create: AuditEventType.MEDICAL_RECORD_CREATED,
    read: AuditEventType.MEDICAL_RECORD_ACCESSED,
    update: AuditEventType.MEDICAL_RECORD_UPDATED,
    delete: AuditEventType.MEDICAL_RECORD_DELETED,
  };
  
  await logAuditEvent({
    userId,
    eventType: eventTypeMap[action],
    resourceType: ResourceType.MEDICAL_RECORD,
    resourceId: recordId,
    action: `${action} medical record`,
    severity: AuditSeverity.HIGH,
    ipAddress,
    details,
  });
}

/**
 * 记录急救卡访问
 */
export async function logEmergencyCardAccess(
  userId: number,
  cardId: string,
  action: 'create' | 'update' | 'scan' | 'call',
  ipAddress?: string,
  details?: any
): Promise<void> {
  const eventTypeMap = {
    create: AuditEventType.EMERGENCY_CARD_CREATED,
    update: AuditEventType.EMERGENCY_CARD_UPDATED,
    scan: AuditEventType.EMERGENCY_CARD_SCANNED,
    call: AuditEventType.EMERGENCY_CALL_MADE,
  };
  
  await logAuditEvent({
    userId,
    eventType: eventTypeMap[action],
    resourceType: ResourceType.EMERGENCY_CARD,
    resourceId: cardId,
    action: `${action} emergency card`,
    severity: action === 'scan' || action === 'call' ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
    ipAddress,
    details,
  });
}

/**
 * 记录认证事件
 */
export async function logAuthEvent(
  userId: number,
  eventType: AuditEventType.LOGIN_SUCCESS | AuditEventType.LOGIN_FAILED | AuditEventType.LOGOUT,
  ipAddress?: string,
  details?: any
): Promise<void> {
  const severity = eventType === AuditEventType.LOGIN_FAILED ? AuditSeverity.MEDIUM : AuditSeverity.LOW;
  
  await logAuditEvent({
    userId,
    eventType,
    action: eventType.replace('auth:', ''),
    severity,
    ipAddress,
    details,
  });
}

/**
 * 记录权限拒绝事件
 */
export async function logPermissionDenied(
  userId: number,
  requiredPermission: Permission,
  resourceType: ResourceType,
  resourceId?: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: AuditEventType.PERMISSION_DENIED,
    resourceType,
    resourceId,
    action: 'permission denied',
    severity: AuditSeverity.HIGH,
    ipAddress,
    details: {
      requiredPermission,
      deniedAccess: true,
    },
  });
}

/**
 * 记录用户活动 - 通用函数
 */
export async function logUserActivity(params: {
  userId: number;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  severity?: AuditSeverity;
}): Promise<void> {
  const { userId, action, resource, resourceId, details, ipAddress, severity = AuditSeverity.LOW } = params;
  
  // 根据动作类型确定事件类型
  let eventType = AuditEventType.DATA_READ; // 默认
  
  if (action.includes('create')) eventType = AuditEventType.DATA_WRITE;
  else if (action.includes('update')) eventType = AuditEventType.DATA_WRITE;
  else if (action.includes('delete')) eventType = AuditEventType.DATA_DELETE;
  else if (action.includes('search')) eventType = AuditEventType.KNOWLEDGE_SEARCHED;
  else if (action.includes('knowledge')) eventType = AuditEventType.KNOWLEDGE_ACCESSED;
  
  await logAuditEvent({
    userId,
    eventType,
    action,
    severity,
    ipAddress,
    details: {
      resource,
      resourceId,
      ...details
    }
  });
}

/**
 * 获取用户审计日志
 */
export async function getUserAuditLogs(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const logs = await db
    .select()
    .from(activityLogs)
    .where(/* userId filter */)
    .limit(limit)
    .offset(offset)
    .orderBy(/* timestamp desc */);
  
  return logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));
}

/**
 * 获取安全事件统计
 */
export async function getSecurityEventStats(
  timeRange: 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  unauthorizedAccess: number;
  suspiciousActivity: number;
}> {
  const timeRangeHours = timeRange === 'day' ? 24 : timeRange === 'week' ? 168 : 720;
  const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  
  // 这里需要根据实际数据库结构实现具体查询
  // 暂时返回模拟数据
  return {
    totalEvents: 0,
    criticalEvents: 0,
    failedLogins: 0,
    unauthorizedAccess: 0,
    suspiciousActivity: 0,
  };
}

/**
 * 数据保留政策执行
 */
export async function enforceDataRetentionPolicy(): Promise<void> {
  const policies = [
    { eventType: AuditEventType.DATA_READ, retentionDays: 90 },
    { eventType: AuditEventType.DATA_WRITE, retentionDays: 2555 }, // 7年
    { eventType: AuditEventType.MEDICAL_RECORD_ACCESSED, retentionDays: 2555 },
    { eventType: AuditEventType.EMERGENCY_CARD_SCANNED, retentionDays: 3650 }, // 10年
  ];
  
  for (const policy of policies) {
    const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
    
    // 删除过期的审计日志
    // 这里需要根据实际数据库结构实现
    console.log(`Enforcing retention policy for ${policy.eventType}, cutoff: ${cutoffDate}`);
  }
}

/**
 * 合规报告生成
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<{
  totalAccess: number;
  medicalRecordAccess: number;
  emergencyCardAccess: number;
  unauthorizedAttempts: number;
  dataIntegrityViolations: number;
  userActivitySummary: any[];
}> {
  // 这里需要根据实际需求实现具体的合规报告逻辑
  // 暂时返回模拟数据结构
  return {
    totalAccess: 0,
    medicalRecordAccess: 0,
    emergencyCardAccess: 0,
    unauthorizedAttempts: 0,
    dataIntegrityViolations: 0,
    userActivitySummary: [],
  };
}