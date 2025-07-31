import { NextRequest, NextResponse } from 'next/server';

interface Certification {
  id: string;
  standard: string;
  standardName: string;
  type: 'iso' | 'regulatory' | 'industry';
  status: 'certified' | 'in_progress' | 'expired' | 'not_applicable';
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  certifyingBody?: string;
  scope?: string;
  country?: string;
  nextAuditDate?: string;
  documentsRequired?: string[];
  progress?: number;
}

export async function GET() {
  try {
    // In a real implementation, you would:
    // 1. Query the database for actual certification records
    // 2. Check expiry dates and update statuses automatically
    // 3. Include document management and audit trail information
    // 4. Apply user access controls based on roles

    // Mock certifications data
    const mockCertifications: Certification[] = [
      {
        id: 'iso-13485-001',
        standard: 'ISO 13485',
        standardName: '医疗器械质量管理体系',
        type: 'iso',
        status: 'in_progress',
        certifyingBody: '中国质量认证中心 (CQC)',
        scope: '医疗AI软件质量管理',
        nextAuditDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        documentsRequired: [
          '质量手册',
          '程序文件',
          '风险管理文档',
          '设计控制记录'
        ],
        progress: 75,
      },
      {
        id: 'iso-27001-001',
        standard: 'ISO 27001',
        standardName: '信息安全管理体系',
        type: 'iso',
        status: 'certified',
        certificateNumber: 'ISO27001-2023-001',
        issueDate: '2023-06-01',
        expiryDate: '2026-06-01',
        certifyingBody: 'BSI英国标准协会',
        scope: '医疗信息系统安全管理',
        nextAuditDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 100,
      },
      {
        id: 'iso-14155-001',
        standard: 'ISO 14155',
        standardName: '医疗器械临床试验',
        type: 'iso',
        status: 'not_applicable',
        standardName: '医疗器械临床试验 - 人类受试者良好临床试验规范',
        scope: '不适用于本软件类型',
      },
      {
        id: 'nmpa-001',
        standard: 'NMPA',
        standardName: '国家药品监督管理局医疗器械注册',
        type: 'regulatory',
        status: 'in_progress',
        country: '中国',
        scope: '二类医疗器械软件注册',
        documentsRequired: [
          '产品技术要求',
          '软件说明书',
          '临床评价资料',
          '质量管理体系文档'
        ],
        progress: 60,
      },
      {
        id: 'gdpr-001',
        standard: 'GDPR',
        standardName: '通用数据保护条例',
        type: 'regulatory',
        status: 'certified',
        issueDate: '2023-05-25',
        expiryDate: '2025-05-25',
        country: 'EU',
        scope: '个人数据处理合规',
        nextAuditDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 100,
      },
      {
        id: 'hl7-fhir-001',
        standard: 'HL7 FHIR',
        standardName: 'HL7快速医疗互操作性资源',
        type: 'industry',
        status: 'certified',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        certifyingBody: 'HL7 International',
        scope: '医疗数据交换标准',
        progress: 100,
      },
      {
        id: 'nist-csf-001',
        standard: 'NIST Cybersecurity Framework',
        standardName: 'NIST网络安全框架',
        type: 'industry',
        status: 'in_progress',
        country: '美国',
        scope: '网络安全风险管理',
        documentsRequired: [
          '风险评估报告',
          '安全控制实施文档',
          '事件响应计划',
          '供应链安全评估'
        ],
        progress: 45,
      },
    ];

    // Calculate certification statistics
    const stats = {
      totalCertifications: mockCertifications.length,
      certified: mockCertifications.filter(c => c.status === 'certified').length,
      inProgress: mockCertifications.filter(c => c.status === 'in_progress').length,
      expired: mockCertifications.filter(c => c.status === 'expired').length,
      expiringIn30Days: mockCertifications.filter(c => {
        if (!c.expiryDate) return false;
        const expiryDate = new Date(c.expiryDate);
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow;
      }).length,
      upcomingAudits: mockCertifications.filter(c => {
        if (!c.nextAuditDate) return false;
        const auditDate = new Date(c.nextAuditDate);
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return auditDate <= thirtyDaysFromNow;
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: mockCertifications,
      metadata: {
        ...stats,
        certificationTypes: ['ISO', 'Regulatory', 'Industry'],
        complianceFrameworks: [
          'ISO 13485 (Quality Management)',
          'ISO 27001 (Information Security)',
          'GDPR (Data Protection)',
          'HL7 FHIR (Interoperability)'
        ],
        lastUpdated: new Date().toISOString(),
        nextScheduledReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch certifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CERTIFICATIONS_FETCH_FAILED',
          message: 'Failed to fetch certification data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}