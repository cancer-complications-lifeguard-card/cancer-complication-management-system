import { UserRole, UserStage } from '@/lib/db/schema';

// 权限定义
export enum Permission {
  // 用户数据权限
  READ_OWN_DATA = 'read:own_data',
  WRITE_OWN_DATA = 'write:own_data',
  DELETE_OWN_DATA = 'delete:own_data',
  
  // 医疗记录权限
  READ_MEDICAL_RECORDS = 'read:medical_records',
  WRITE_MEDICAL_RECORDS = 'write:medical_records',
  DELETE_MEDICAL_RECORDS = 'delete:medical_records',
  
  // 急救卡权限
  READ_EMERGENCY_CARD = 'read:emergency_card',
  WRITE_EMERGENCY_CARD = 'write:emergency_card',
  SCAN_EMERGENCY_CARD = 'scan:emergency_card',
  
  // 分诊权限
  USE_TRIAGE_ENGINE = 'use:triage_engine',
  VIEW_TRIAGE_HISTORY = 'view:triage_history',
  
  // 联系人权限
  MAKE_EMERGENCY_CALLS = 'make:emergency_calls',
  VIEW_CALL_HISTORY = 'view:call_history',
  
  // 知识图谱权限
  READ_KNOWLEDGE_BASE = 'read:knowledge_base',
  INTERACT_KNOWLEDGE = 'interact:knowledge',
  
  // 系统权限
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  MANAGE_USERS = 'manage:users',
  SYSTEM_ADMIN = 'system:admin',
  
  // 医护人员权限
  ACCESS_PATIENT_DATA = 'access:patient_data',
  SCAN_ANY_QR_CODE = 'scan:any_qr_code',
}

// 资源类型
export enum ResourceType {
  USER_PROFILE = 'user_profile',
  MEDICAL_RECORD = 'medical_record',
  EMERGENCY_CARD = 'emergency_card',
  TRIAGE_ASSESSMENT = 'triage_assessment',
  CALL_LOG = 'call_log',
  KNOWLEDGE_INTERACTION = 'knowledge_interaction',
  SYSTEM_LOG = 'system_log',
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PATIENT]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.READ_MEDICAL_RECORDS,
    Permission.WRITE_MEDICAL_RECORDS,
    Permission.DELETE_MEDICAL_RECORDS,
    Permission.READ_EMERGENCY_CARD,
    Permission.WRITE_EMERGENCY_CARD,
    Permission.USE_TRIAGE_ENGINE,
    Permission.VIEW_TRIAGE_HISTORY,
    Permission.MAKE_EMERGENCY_CALLS,
    Permission.VIEW_CALL_HISTORY,
    Permission.READ_KNOWLEDGE_BASE,
    Permission.INTERACT_KNOWLEDGE,
  ],
  [UserRole.FAMILY]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.READ_MEDICAL_RECORDS,
    Permission.READ_EMERGENCY_CARD,
    Permission.SCAN_EMERGENCY_CARD,
    Permission.USE_TRIAGE_ENGINE,
    Permission.VIEW_TRIAGE_HISTORY,
    Permission.MAKE_EMERGENCY_CALLS,
    Permission.VIEW_CALL_HISTORY,
    Permission.READ_KNOWLEDGE_BASE,
    Permission.INTERACT_KNOWLEDGE,
  ],
  [UserRole.CAREGIVER]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.READ_MEDICAL_RECORDS,
    Permission.WRITE_MEDICAL_RECORDS,
    Permission.READ_EMERGENCY_CARD,
    Permission.WRITE_EMERGENCY_CARD,
    Permission.SCAN_EMERGENCY_CARD,
    Permission.USE_TRIAGE_ENGINE,
    Permission.VIEW_TRIAGE_HISTORY,
    Permission.MAKE_EMERGENCY_CALLS,
    Permission.VIEW_CALL_HISTORY,
    Permission.READ_KNOWLEDGE_BASE,
    Permission.INTERACT_KNOWLEDGE,
  ],
};

// 阶段特定权限限制
const STAGE_RESTRICTIONS: Record<UserStage, Permission[]> = {
  [UserStage.DAILY]: [], // 日常阶段无特殊限制
  [UserStage.INQUIRY]: [], // 查询阶段无特殊限制
  [UserStage.ONSET]: [ // 急性发作期有额外的紧急权限
    Permission.SCAN_ANY_QR_CODE,
    Permission.ACCESS_PATIENT_DATA, // 临时权限，用于紧急情况
  ],
};

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(
  userRole: UserRole, 
  userStage: UserStage, 
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const stagePermissions = STAGE_RESTRICTIONS[userStage] || [];
  
  return rolePermissions.includes(permission) || stagePermissions.includes(permission);
}

/**
 * 检查用户是否可以访问特定资源
 */
export function canAccessResource(
  userRole: UserRole,
  userStage: UserStage,
  resourceType: ResourceType,
  action: 'read' | 'write' | 'delete',
  resourceOwnerId?: number,
  currentUserId?: number
): boolean {
  // 检查基本权限
  let requiredPermission: Permission;
  
  switch (resourceType) {
    case ResourceType.USER_PROFILE:
      requiredPermission = action === 'read' ? Permission.READ_OWN_DATA : 
                          action === 'write' ? Permission.WRITE_OWN_DATA : 
                          Permission.DELETE_OWN_DATA;
      break;
    case ResourceType.MEDICAL_RECORD:
      requiredPermission = action === 'read' ? Permission.READ_MEDICAL_RECORDS : 
                          action === 'write' ? Permission.WRITE_MEDICAL_RECORDS : 
                          Permission.DELETE_MEDICAL_RECORDS;
      break;
    case ResourceType.EMERGENCY_CARD:
      requiredPermission = action === 'read' ? Permission.READ_EMERGENCY_CARD : 
                          Permission.WRITE_EMERGENCY_CARD;
      break;
    default:
      return false;
  }
  
  if (!hasPermission(userRole, userStage, requiredPermission)) {
    return false;
  }
  
  // 检查资源所有权（如果提供了所有者ID）
  if (resourceOwnerId && currentUserId && resourceOwnerId !== currentUserId) {
    // 家属和护理人员在特定情况下可以访问患者数据
    if (userRole === UserRole.FAMILY || userRole === UserRole.CAREGIVER) {
      // 这里应该检查是否有授权关系，暂时简化处理
      return action === 'read'; // 只允许读取，不允许修改或删除
    }
    
    // 急性发作期的特殊处理
    if (userStage === UserStage.ONSET && action === 'read') {
      return hasPermission(userRole, userStage, Permission.ACCESS_PATIENT_DATA);
    }
    
    return false;
  }
  
  return true;
}

/**
 * 获取用户的所有权限
 */
export function getUserPermissions(userRole: UserRole, userStage: UserStage): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const stagePermissions = STAGE_RESTRICTIONS[userStage] || [];
  
  return [...new Set([...rolePermissions, ...stagePermissions])];
}

/**
 * 数据访问策略
 */
export interface DataAccessPolicy {
  allowRead: boolean;
  allowWrite: boolean;
  allowDelete: boolean;
  requiresEncryption: boolean;
  requiresAuditLog: boolean;
  dataRetentionDays?: number;
  accessLevelRequired: 'low' | 'medium' | 'high';
}

/**
 * 获取资源的数据访问策略
 */
export function getDataAccessPolicy(resourceType: ResourceType): DataAccessPolicy {
  switch (resourceType) {
    case ResourceType.MEDICAL_RECORD:
      return {
        allowRead: true,
        allowWrite: true,
        allowDelete: true,
        requiresEncryption: true,
        requiresAuditLog: true,
        dataRetentionDays: 2555, // 7年
        accessLevelRequired: 'high',
      };
    
    case ResourceType.EMERGENCY_CARD:
      return {
        allowRead: true,
        allowWrite: true,
        allowDelete: false, // 急救卡不允许删除，只能停用
        requiresEncryption: true,
        requiresAuditLog: true,
        dataRetentionDays: 3650, // 10年
        accessLevelRequired: 'high',
      };
    
    case ResourceType.TRIAGE_ASSESSMENT:
      return {
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
        requiresEncryption: true,
        requiresAuditLog: true,
        dataRetentionDays: 1825, // 5年
        accessLevelRequired: 'medium',
      };
    
    case ResourceType.CALL_LOG:
      return {
        allowRead: true,
        allowWrite: false, // 呼叫记录不允许修改
        allowDelete: false,
        requiresEncryption: true,
        requiresAuditLog: true,
        dataRetentionDays: 2190, // 6年
        accessLevelRequired: 'high',
      };
    
    default:
      return {
        allowRead: true,
        allowWrite: true,
        allowDelete: true,
        requiresEncryption: false,
        requiresAuditLog: false,
        accessLevelRequired: 'low',
      };
  }
}

/**
 * 验证访问级别
 */
export function validateAccessLevel(
  userRole: UserRole, 
  userStage: UserStage, 
  requiredLevel: 'low' | 'medium' | 'high'
): boolean {
  const userLevel = getUserAccessLevel(userRole, userStage);
  
  const levels = { low: 1, medium: 2, high: 3 };
  return levels[userLevel] >= levels[requiredLevel];
}

/**
 * 获取用户访问级别
 */
export function getUserAccessLevel(userRole: UserRole, userStage: UserStage): 'low' | 'medium' | 'high' {
  // 患者本人拥有最高访问级别
  if (userRole === UserRole.PATIENT) {
    return 'high';
  }
  
  // 护理人员拥有中等访问级别
  if (userRole === UserRole.CAREGIVER) {
    return 'medium';
  }
  
  // 家属基本访问级别，但在紧急情况下提升
  if (userRole === UserRole.FAMILY) {
    return userStage === UserStage.ONSET ? 'medium' : 'low';
  }
  
  return 'low';
}

/**
 * 数据脱敏级别定义
 */
export enum MaskingLevel {
  NONE = 'none',          // 无脱敏
  PARTIAL = 'partial',    // 部分脱敏
  FULL = 'full',          // 完全脱敏
}

/**
 * 根据用户权限获取数据脱敏级别
 */
export function getDataMaskingLevel(
  userRole: UserRole, 
  userStage: UserStage, 
  resourceOwnerId: number, 
  currentUserId: number
): MaskingLevel {
  // 本人数据无需脱敏
  if (resourceOwnerId === currentUserId) {
    return MaskingLevel.NONE;
  }
  
  // 紧急情况下降低脱敏级别
  if (userStage === UserStage.ONSET) {
    return MaskingLevel.PARTIAL;
  }
  
  // 护理人员可以看到部分信息
  if (userRole === UserRole.CAREGIVER) {
    return MaskingLevel.PARTIAL;
  }
  
  // 家属看到脱敏信息
  if (userRole === UserRole.FAMILY) {
    return MaskingLevel.FULL;
  }
  
  return MaskingLevel.FULL;
}