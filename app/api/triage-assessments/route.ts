import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { symptomLogs, healthMetrics } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's triage assessments from symptom logs
    const assessments = await db
      .select()
      .from(symptomLogs)
      .where(eq(symptomLogs.userId, userId))
      .orderBy(desc(symptomLogs.createdAt))
      .limit(20);

    return NextResponse.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error('Error fetching triage assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      mainSymptom,
      symptomDescription,
      severity,
      duration,
      onset,
      painLevel,
      temperature,
      heartRate,
      bloodPressure,
      activityLevel,
      currentMedications,
      recentTreatments,
      riskScore,
      urgencyLevel,
    } = body;

    // Save the triage assessment as a symptom log
    const triageLog = await db
      .insert(symptomLogs)
      .values({
        userId,
        symptomName: mainSymptom || 'Triage Assessment',
        severity: parseInt(severity) || 5,
        description: symptomDescription,
        duration: duration || null,
        triggers: onset || null,
        location: null,
        associatedSymptoms: currentMedications || null,
        loggedAt: new Date(),
      })
      .returning();

    // If vital signs are provided, save them as health metrics
    if (temperature || heartRate || bloodPressure) {
      await db
        .insert(healthMetrics)
        .values({
          userId,
          metricType: 'vital_signs',
          heartRate: heartRate ? parseInt(heartRate) : null,
          bloodPressureSystolic: bloodPressure ? parseInt(bloodPressure.split('/')[0]) : null,
          bloodPressureDiastolic: bloodPressure ? parseInt(bloodPressure.split('/')[1]) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          recordedAt: new Date(),
          deviceId: 'triage_system',
        });
    }

    return NextResponse.json({
      success: true,
      assessment: {
        ...triageLog[0],
        riskScore,
        urgencyLevel,
        recommendations: generateRecommendations(urgencyLevel, riskScore),
      },
    });
  } catch (error) {
    console.error('Error creating triage assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRecommendations(urgencyLevel: string, riskScore: number): string[] {
  const recommendations: string[] = [];
  
  switch (urgencyLevel) {
    case 'emergency':
      recommendations.push('立即拨打120急救电话');
      recommendations.push('前往最近的急诊科');
      recommendations.push('准备身份证件和病历');
      recommendations.push('如有家人陪同更好');
      break;
    case 'urgent':
      recommendations.push('2-4小时内前往急诊科');
      recommendations.push('联系主治医生');
      recommendations.push('密切监测症状变化');
      recommendations.push('准备详细症状描述');
      break;
    case 'moderate':
      recommendations.push('24小时内就医');
      recommendations.push('可预约门诊或急诊');
      recommendations.push('继续观察症状');
      recommendations.push('如症状加重立即就医');
      break;
    case 'low':
      recommendations.push('居家观察');
      recommendations.push('充分休息');
      recommendations.push('多喝水');
      recommendations.push('如症状持续或加重请就医');
      break;
    default:
      recommendations.push('建议咨询医疗专业人士');
      break;
  }

  // Add cancer-specific recommendations if applicable
  if (riskScore > 60) {
    recommendations.push('考虑联系肿瘤科专家');
    recommendations.push('携带最新的检查报告');
  }

  return recommendations;
}