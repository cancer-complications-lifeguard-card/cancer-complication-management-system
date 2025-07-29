import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { healthMetrics } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's vital signs data (last 50 records)
    const vitalSigns = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(50);

    // Generate mock alerts based on vital signs data
    const alerts = generateMockAlerts(vitalSigns, userId);

    return NextResponse.json({
      success: true,
      vitalSigns,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching vital signs:', error);
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
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      deviceId,
      recordedAt,
    } = body;

    const newVitalSign = await db
      .insert(healthMetrics)
      .values({
        userId,
        metricType: 'vital_signs',
        heartRate: heartRate || null,
        bloodPressureSystolic: bloodPressureSystolic || null,
        bloodPressureDiastolic: bloodPressureDiastolic || null,
        temperature: temperature || null,
        oxygenSaturation: oxygenSaturation || null,
        respiratoryRate: respiratoryRate || null,
        deviceId: deviceId || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      vitalSign: newVitalSign[0],
    });
  } catch (error) {
    console.error('Error creating vital sign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockAlerts(vitalSigns: any[], userId: number) {
  const alerts = [];
  
  if (vitalSigns.length === 0) return alerts;

  const latestReading = vitalSigns[0];
  let alertId = 1;

  // Check for abnormal heart rate
  if (latestReading.heartRate) {
    if (latestReading.heartRate > 100) {
      alerts.push({
        id: alertId++,
        userId,
        alertType: 'heart_rate_high',
        severity: latestReading.heartRate > 120 ? 'high' : 'medium',
        message: `心率偏高 (${latestReading.heartRate} bpm)，建议注意休息`,
        vitalSignId: latestReading.id,
        isRead: false,
        createdAt: new Date(),
      });
    } else if (latestReading.heartRate < 60) {
      alerts.push({
        id: alertId++,
        userId,
        alertType: 'heart_rate_low',
        severity: latestReading.heartRate < 50 ? 'high' : 'medium',
        message: `心率偏低 (${latestReading.heartRate} bpm)，如有不适请就医`,
        vitalSignId: latestReading.id,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }

  // Check for abnormal blood pressure
  if (latestReading.bloodPressureSystolic && latestReading.bloodPressureDiastolic) {
    if (latestReading.bloodPressureSystolic > 140 || latestReading.bloodPressureDiastolic > 90) {
      alerts.push({
        id: alertId++,
        userId,
        alertType: 'blood_pressure_high',
        severity: 'high',
        message: `血压偏高 (${latestReading.bloodPressureSystolic}/${latestReading.bloodPressureDiastolic} mmHg)，建议监测`,
        vitalSignId: latestReading.id,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }

  // Check for abnormal temperature
  if (latestReading.temperature) {
    if (latestReading.temperature > 37.5) {
      alerts.push({
        id: alertId++,
        userId,
        alertType: 'temperature_high',
        severity: latestReading.temperature > 38.5 ? 'critical' : 'high',
        message: `体温偏高 (${latestReading.temperature.toFixed(1)}°C)，请注意监测`,
        vitalSignId: latestReading.id,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }

  // Check for abnormal oxygen saturation
  if (latestReading.oxygenSaturation && latestReading.oxygenSaturation < 95) {
    alerts.push({
      id: alertId++,
      userId,
      alertType: 'oxygen_low',
      severity: latestReading.oxygenSaturation < 90 ? 'critical' : 'high',
      message: `血氧饱和度偏低 (${latestReading.oxygenSaturation}%)，请及时就医`,
      vitalSignId: latestReading.id,
      isRead: false,
      createdAt: new Date(),
    });
  }

  return alerts;
}