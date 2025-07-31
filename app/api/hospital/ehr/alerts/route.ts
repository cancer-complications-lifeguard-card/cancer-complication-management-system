import { NextRequest, NextResponse } from 'next/server';

interface ClinicalAlert {
  id: string;
  type: 'drug_interaction' | 'allergy' | 'vital_signs' | 'lab_critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  patientId: string;
  patientName: string;
  systemId: string;
  systemName: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  details?: {
    medications?: string[];
    riskLevel?: string;
    recommendation?: string;
    allergen?: string;
    reaction?: string;
    prescription?: string;
    vitalSign?: string;
    currentValue?: string;
    normalRange?: string;
    trend?: string;
    testName?: string;
    criticalValue?: string;
    previousValue?: string;
    [key: string]: unknown;
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const severity = url.searchParams.get('severity');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // In a real implementation, you would:
    // 1. Query the database for actual clinical alerts
    // 2. Apply filters based on query parameters
    // 3. Implement proper pagination
    // 4. Return real-time clinical decision support alerts

    // Mock clinical alerts data
    const mockAlerts: ClinicalAlert[] = [
      {
        id: 'alert-001',
        type: 'drug_interaction',
        severity: 'high',
        message: '华法林与阿司匹林存在严重相互作用，可能导致出血风险增加',
        patientId: 'P123456',
        patientName: '张三',
        systemId: 'ehr-001',
        systemName: '北京协和医院 Epic EHR',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        status: 'active',
        details: {
          medications: ['华法林 5mg', '阿司匹林 100mg'],
          riskLevel: 'major',
          recommendation: '建议调整药物剂量或更换替代药物',
        },
      },
      {
        id: 'alert-002',
        type: 'allergy',
        severity: 'critical',
        message: '患者对青霉素过敏，当前处方包含阿莫西林',
        patientId: 'P789012',
        patientName: '李四',
        systemId: 'ehr-002',
        systemName: '上海华山医院 Cerner EHR',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        status: 'active',
        details: {
          allergen: '青霉素',
          reaction: '皮疹、呼吸困难',
          prescription: '阿莫西林 500mg',
          recommendation: '立即停止使用并更换非青霉素类抗生素',
        },
      },
      {
        id: 'alert-003',
        type: 'vital_signs',
        severity: 'high',
        message: '血压异常升高，收缩压达到180mmHg',
        patientId: 'P345678',
        patientName: '王五',
        systemId: 'ehr-001',
        systemName: '北京协和医院 Epic EHR',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'active',
        details: {
          vitalSign: '血压',
          currentValue: '180/110 mmHg',
          normalRange: '<140/90 mmHg',
          trend: '持续升高',
          recommendation: '建议立即评估并调整降压药物',
        },
      },
      {
        id: 'alert-004',
        type: 'lab_critical',
        severity: 'critical',
        message: '肌酐水平危急值：8.2 mg/dL，提示严重肾功能不全',
        patientId: 'P901234',
        patientName: '赵六',
        systemId: 'ehr-003',
        systemName: '广州中山医院 自建EHR',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        status: 'active',
        details: {
          testName: '血清肌酐',
          criticalValue: '8.2 mg/dL',
          normalRange: '0.7-1.3 mg/dL',
          previousValue: '6.8 mg/dL',
          recommendation: '立即通知肾内科医生，考虑透析治疗',
        },
      },
      {
        id: 'alert-005',
        type: 'drug_interaction',
        severity: 'medium',
        message: '地高辛与呋塞米联用需监测血钾水平',
        patientId: 'P567890',
        patientName: '钱七',
        systemId: 'ehr-002',
        systemName: '上海华山医院 Cerner EHR',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        status: 'active',
        details: {
          medications: ['地高辛 0.25mg', '呋塞米 40mg'],
          riskLevel: 'moderate',
          recommendation: '建议定期监测血钾和地高辛浓度',
        },
      },
      {
        id: 'alert-006',
        type: 'vital_signs',
        severity: 'low',
        message: '心率偏低：52次/分钟',
        patientId: 'P234567',
        patientName: '孙八',
        systemId: 'ehr-004',
        systemName: '深圳人民医院 Allscripts EHR',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        status: 'acknowledged',
        details: {
          vitalSign: '心率',
          currentValue: '52 bpm',
          normalRange: '60-100 bpm',
          trend: '稳定',
          recommendation: '继续监测，如有症状请及时处理',
        },
      },
    ];

    // Apply filters
    let filteredAlerts = mockAlerts.filter(alert => alert.status === status);
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    // Apply limit
    filteredAlerts = filteredAlerts.slice(0, limit);

    // Calculate summary statistics
    const totalAlerts = mockAlerts.length;
    const activeAlerts = mockAlerts.filter(a => a.status === 'active').length;
    const criticalAlerts = mockAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const highAlerts = mockAlerts.filter(a => a.severity === 'high' && a.status === 'active').length;

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      metadata: {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        highAlerts,
        filteredCount: filteredAlerts.length,
        filters: { status, severity },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch clinical alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLINICAL_ALERTS_FETCH_FAILED',
          message: 'Failed to fetch clinical alerts',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, status, note } = body;

    // Validate input
    if (!alertId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Alert ID and status are required',
          },
        },
        { status: 400 }
      );
    }

    if (!['active', 'acknowledged', 'resolved'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be one of: active, acknowledged, resolved',
          },
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate the alert exists and user has permission
    // 2. Update the alert status in the database
    // 3. Log the status change for audit purposes
    // 4. Trigger any necessary notifications

    return NextResponse.json({
      success: true,
      data: {
        alertId,
        status,
        note,
        updatedBy: 'current_user_id', // In real implementation, get from auth
        updatedAt: new Date().toISOString(),
      },
      message: 'Alert status updated successfully',
    });
  } catch (error) {
    console.error('Failed to update alert status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ALERT_UPDATE_FAILED',
          message: 'Failed to update alert status',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}