import { NextRequest, NextResponse } from 'next/server';

interface RiskFactor {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: string;
  lastAssessment: string;
  ownerTeam: string;
  mitigationMeasures: string[];
  residualRisk: 'low' | 'medium' | 'high' | 'critical';
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    const category = url.searchParams.get('category');

    // In a real implementation, you would:
    // 1. Query the database for actual risk assessments
    // 2. Apply filtering based on query parameters
    // 3. Calculate risk scores using established methodologies
    // 4. Include real-time risk monitoring data

    // Mock risk factors data
    const mockRisks: RiskFactor[] = [
      {
        id: 'risk-001',
        category: '数据安全',
        description: '医疗数据泄露可能导致患者隐私信息暴露',
        severity: 'critical',
        likelihood: 'low',
        impact: 'high',
        status: '已采取缓解措施，持续监控中',
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: '安全团队',
        mitigationMeasures: [
          '数据加密存储',
          '访问权限控制',
          '安全审计日志',
          '定期渗透测试'
        ],
        residualRisk: 'medium',
      },
      {
        id: 'risk-002',
        category: 'AI算法',
        description: 'AI诊断建议错误可能导致医疗决策失误',
        severity: 'high',
        likelihood: 'medium',
        impact: 'high',
        status: '实施多重验证机制，风险可控',
        lastAssessment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: 'AI算法团队',
        mitigationMeasures: [
          '人工审核机制',
          '多模型交叉验证',
          '置信度阈值设置',
          '持续性能监控'
        ],
        residualRisk: 'medium',
      },
      {
        id: 'risk-003',
        category: '系统可用性',
        description: '系统故障可能影响紧急医疗服务的连续性',
        severity: 'high',
        likelihood: 'low',
        impact: 'high',
        status: '已建立高可用架构，定期演练',
        lastAssessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: '运维团队',
        mitigationMeasures: [
          '冗余服务器部署',
          '自动故障转移',
          '24/7系统监控',
          '灾难恢复计划'
        ],
        residualRisk: 'low',
      },
      {
        id: 'risk-004',
        category: '合规风险',
        description: '法规变更可能导致现有实施方案不再符合要求',
        severity: 'medium',
        likelihood: 'medium',
        impact: 'medium',
        status: '建立法规跟踪机制，及时更新',
        lastAssessment: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: '合规团队',
        mitigationMeasures: [
          '法规监控系统',
          '定期合规评估',
          '灵活架构设计',
          '法律顾问咨询'
        ],
        residualRisk: 'low',
      },
      {
        id: 'risk-005',
        category: '用户操作',
        description: '医护人员操作失误可能导致错误的医疗决策',
        severity: 'medium',
        likelihood: 'medium',
        impact: 'medium',
        status: '提供培训和界面优化，降低操作复杂度',
        lastAssessment: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: '用户体验团队',
        mitigationMeasures: [
          '用户培训计划',
          '直观界面设计',
          '操作确认机制',
          '使用行为分析'
        ],
        residualRisk: 'low',
      },
      {
        id: 'risk-006',
        category: '第三方依赖',
        description: '关键第三方服务中断可能影响系统核心功能',
        severity: 'medium',
        likelihood: 'low',
        impact: 'high',
        status: '建立备选方案和监控机制',
        lastAssessment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ownerTeam: '架构团队',
        mitigationMeasures: [
          '多供应商策略',
          '服务健康监控',
          '本地缓存机制',
          '降级服务方案'
        ],
        residualRisk: 'low',
      },
    ];

    // Apply filters
    let filteredRisks = mockRisks;
    
    if (severity) {
      filteredRisks = filteredRisks.filter(risk => risk.severity === severity);
    }
    
    if (category) {
      filteredRisks = filteredRisks.filter(risk => risk.category === category);
    }

    // Calculate risk statistics
    const riskStats = {
      totalRisks: mockRisks.length,
      highSeverityRisks: mockRisks.filter(r => r.severity === 'critical' || r.severity === 'high').length,
      mitigatedRisks: mockRisks.filter(r => r.residualRisk === 'low').length,
      activelyMonitored: mockRisks.filter(r => r.status.includes('监控')).length,
    };

    return NextResponse.json({
      success: true,
      data: filteredRisks,
      metadata: {
        ...riskStats,
        filteredCount: filteredRisks.length,
        filters: { severity, category },
        lastUpdated: new Date().toISOString(),
        riskAssessmentFramework: 'ISO 31000:2018',
      },
    });
  } catch (error) {
    console.error('Failed to fetch risk factors:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RISK_FACTORS_FETCH_FAILED',
          message: 'Failed to fetch risk factors',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}