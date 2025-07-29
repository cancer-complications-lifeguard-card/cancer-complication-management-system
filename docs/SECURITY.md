# 医疗数据安全系统文档

## 概述

本系统实现了医疗数据的三重安全防护，确保患者隐私和数据安全符合医疗行业标准。

## 三重安全防护架构

### 1. 数据加密层 (Data Encryption Layer)

#### 特性
- **AES-256-GCM 加密**: 对敏感医疗数据使用军用级加密标准
- **端到端加密**: 从数据库到前端的全程加密保护
- **密钥管理**: 定期密钥轮换和安全存储
- **数据完整性**: 使用哈希验证确保数据未被篡改

#### 加密范围
- 患者姓名和个人信息
- 医疗诊断和治疗记录
- 药物信息和过敏记录
- 急救卡详细信息
- 通话记录和位置信息

#### 使用方法
```typescript
import { encryptSensitiveData, decryptSensitiveData } from '@/lib/security/encryption';

// 加密敏感数据
const encrypted = encryptSensitiveData('患者姓名');

// 解密数据
const decrypted = decryptSensitiveData(encrypted);
```

### 2. 访问控制层 (Access Control Layer)

#### 权限模型
- **基于角色的访问控制 (RBAC)**
- **资源级权限管理**
- **阶段性权限调整**
- **审计日志记录**

#### 用户角色
1. **患者 (Patient)**
   - 完整的个人数据访问权限
   - 可创建和管理急救卡
   - 可使用分诊系统
   - 可查看个人医疗记录

2. **家属 (Family)**
   - 有限的患者数据访问权限
   - 可扫描急救卡
   - 可代为拨打紧急电话
   - 紧急情况下权限自动提升

3. **护理人员 (Caregiver)**
   - 中等级别的数据访问权限
   - 可管理患者医疗记录
   - 可更新急救卡信息
   - 可查看完整的分诊历史

#### 阶段性权限
- **日常阶段 (Daily)**: 标准权限
- **查询阶段 (Inquiry)**: 增强的知识库访问
- **发作阶段 (Onset)**: 紧急权限，允许更多数据访问

#### 使用方法
```typescript
import { hasPermission, canAccessResource } from '@/lib/security/access-control';

// 检查权限
if (hasPermission(userRole, userStage, Permission.READ_MEDICAL_RECORDS)) {
  // 允许访问
}

// 检查资源访问权限
if (canAccessResource(userRole, userStage, ResourceType.MEDICAL_RECORD, 'read', resourceOwner, currentUser)) {
  // 允许访问资源
}
```

### 3. 合规监控层 (Compliance Monitoring Layer)

#### 审计日志
- **全面的操作记录**: 记录所有数据访问和修改操作
- **实时监控**: 检测异常访问模式
- **数据保留**: 符合医疗行业数据保留要求
- **完整性验证**: 确保日志数据未被篡改

#### 监控功能
- **登录失败检测**: 自动检测暴力破解尝试
- **异常访问模式**: 识别可疑的数据访问行为
- **数据导出监控**: 跟踪大量数据下载
- **权限变更审计**: 记录所有权限修改

#### 使用方法
```typescript
import { logAuditEvent, logDataAccess } from '@/lib/security/audit-logger';

// 记录审计事件
await logAuditEvent({
  userId: 123,
  eventType: AuditEventType.MEDICAL_RECORD_ACCESSED,
  action: 'read medical record',
  severity: AuditSeverity.HIGH,
  resourceType: ResourceType.MEDICAL_RECORD,
  resourceId: 'record-456',
});

// 记录数据访问
await logDataAccess(userId, ResourceType.EMERGENCY_CARD, cardId, 'read');
```

## 安全中间件

### 使用安全中间件保护API端点

```typescript
import { withSecurity } from '@/lib/security/security-middleware';

const securedHandler = withSecurity({
  requiresAuth: true,
  requiredPermission: Permission.READ_MEDICAL_RECORDS,
  resourceType: ResourceType.MEDICAL_RECORD,
  rateLimit: {
    maxRequests: 100,
    windowMinutes: 60,
  },
});

export async function GET(request: NextRequest) {
  return securedHandler(request, async (req, context) => {
    // 安全的处理逻辑
    const data = await fetchSecureData(context.userId);
    return NextResponse.json(data);
  });
}
```

## 数据脱敏

### 自动数据脱敏
系统根据用户角色和关系自动对敏感数据进行脱敏：

- **完全脱敏**: 非授权用户看到的所有敏感信息
- **部分脱敏**: 家属在非紧急情况下看到的信息
- **无脱敏**: 患者本人和紧急情况下的授权访问

### 脱敏示例
```typescript
// 原始数据: "张三"
// 脱敏后: "张*"

// 原始电话: "13812345678"
// 脱敏后: "138****5678"

// 原始邮箱: "patient@example.com"
// 脱敏后: "pa***@example.com"
```

## 环境配置

### 必需的环境变量
```bash
# 加密密钥 (32字节十六进制)
ENCRYPTION_KEY=your-32-byte-encryption-key-in-hex

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# 会话密钥
SESSION_SECRET=your-session-secret-key

# 速率限制
API_RATE_LIMIT_MAX=100
API_RATE_LIMIT_WINDOW=60

# 生产环境安全设置
ENFORCE_HTTPS=true
SECURE_COOKIES=true
```

### 密钥生成
```bash
# 生成加密密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成JWT密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 安全最佳实践

### 1. 数据库安全
- 使用SSL连接
- 定期备份加密存储
- 最小权限原则

### 2. 网络安全
- 强制HTTPS
- 设置安全头
- 配置CORS策略

### 3. 应用安全
- 定期安全扫描
- 依赖项更新
- 代码审查

### 4. 运营安全
- 监控异常活动
- 定期审计日志
- 事件响应计划

## 合规性

### 医疗数据保护
- 符合HIPAA标准
- 遵循数据最小化原则
- 实现用户数据控制权

### 数据保留政策
- 医疗记录: 7年
- 急救卡: 10年
- 分诊记录: 5年
- 审计日志: 根据类型1-7年

### 用户权利
- 数据访问权
- 数据修改权
- 数据删除权
- 数据携带权

## 故障排除

### 常见问题

1. **加密失败**
   - 检查ENCRYPTION_KEY是否正确设置
   - 验证密钥格式是否为32字节十六进制

2. **权限被拒绝**
   - 检查用户角色和阶段
   - 验证所需权限是否正确配置

3. **审计日志丢失**
   - 检查数据库连接
   - 验证日志表结构是否正确

### 性能优化

1. **加密性能**
   - 使用异步加密操作
   - 批量处理大量数据

2. **权限检查**
   - 缓存权限检查结果
   - 使用数据库索引优化查询

3. **审计日志**
   - 异步写入日志
   - 定期清理过期日志

## 监控和告警

### 关键指标
- 登录失败率
- 异常访问次数
- 数据导出频率
- 系统响应时间

### 告警设置
- 多次登录失败
- 权限拒绝激增
- 异常数据访问
- 系统错误率增加

## 升级和维护

### 定期任务
- 密钥轮换 (每90天)
- 权限审查 (每月)
- 日志清理 (每周)
- 安全扫描 (每周)

### 升级流程
1. 备份现有数据
2. 测试新版本
3. 逐步部署
4. 监控系统状态
5. 回滚计划准备

## 联系方式

如有安全问题或建议，请联系：
- 技术支持: security@example.com
- 安全团队: security-team@example.com
- 紧急联系: +86-xxx-xxxx-xxxx