import crypto from 'crypto';

// 加密配置
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * 生成加密密钥
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 从密码生成密钥
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * 加密敏感数据
 */
export function encryptSensitiveData(data: string, userKey?: string): string {
  try {
    const key = userKey ? Buffer.from(userKey, 'hex') : Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // 组合: IV + 加密数据 + 认证标签
    return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * 解密敏感数据
 */
export function decryptSensitiveData(encryptedData: string, userKey?: string): string {
  try {
    const [ivHex, encrypted, tagHex] = encryptedData.split(':');
    
    if (!ivHex || !encrypted || !tagHex) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = userKey ? Buffer.from(userKey, 'hex') : Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * 加密医疗记录
 */
export function encryptMedicalRecord(record: any): string {
  const sensitiveFields = [
    'patientName', 'diagnosis', 'treatmentPlan', 'medications', 
    'allergies', 'medicalHistory', 'doctorNotes', 'labResults'
  ];
  
  const encryptedRecord = { ...record };
  
  for (const field of sensitiveFields) {
    if (encryptedRecord[field]) {
      encryptedRecord[field] = encryptSensitiveData(JSON.stringify(encryptedRecord[field]));
    }
  }
  
  return JSON.stringify(encryptedRecord);
}

/**
 * 解密医疗记录
 */
export function decryptMedicalRecord(encryptedRecord: string): any {
  try {
    const record = JSON.parse(encryptedRecord);
    const sensitiveFields = [
      'patientName', 'diagnosis', 'treatmentPlan', 'medications', 
      'allergies', 'medicalHistory', 'doctorNotes', 'labResults'
    ];
    
    for (const field of sensitiveFields) {
      if (record[field] && typeof record[field] === 'string' && record[field].includes(':')) {
        try {
          const decrypted = decryptSensitiveData(record[field]);
          record[field] = JSON.parse(decrypted);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
          // 如果解密失败，保持原值
        }
      }
    }
    
    return record;
  } catch (error) {
    console.error('Failed to decrypt medical record:', error);
    throw new Error('Failed to decrypt medical record');
  }
}

/**
 * 生成数据哈希值用于完整性验证
 */
export function generateDataHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 验证数据完整性
 */
export function verifyDataIntegrity(data: string, hash: string): boolean {
  const calculatedHash = generateDataHash(data);
  return calculatedHash === hash;
}

/**
 * 生成随机盐值
 */
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * 安全地比较两个字符串
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * 生成用于API访问的临时令牌
 */
export function generateTemporaryToken(userId: number, expiresIn: number = 3600): string {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
    type: 'api_access'
  };
  
  return encryptSensitiveData(JSON.stringify(payload));
}

/**
 * 验证临时令牌
 */
export function validateTemporaryToken(token: string): { userId: number; valid: boolean } {
  try {
    const decryptedPayload = decryptSensitiveData(token);
    const payload = JSON.parse(decryptedPayload);
    
    if (payload.type !== 'api_access') {
      return { userId: 0, valid: false };
    }
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { userId: 0, valid: false };
    }
    
    return { userId: payload.userId, valid: true };
  } catch (error) {
    return { userId: 0, valid: false };
  }
}

/**
 * 数据脱敏处理
 */
export function maskSensitiveData(data: string, type: 'phone' | 'email' | 'id' | 'name'): string {
  switch (type) {
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    case 'email':
      return data.replace(/(.{2}).*@(.*)/, '$1***@$2');
    case 'id':
      return data.replace(/(.{4}).*(.{4})/, '$1************$2');
    case 'name':
      return data.charAt(0) + '*'.repeat(data.length - 1);
    default:
      return data;
  }
}