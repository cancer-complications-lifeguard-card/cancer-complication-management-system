import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Real-time WebSocket API endpoint
 * Note: This is a simplified HTTP-based demo since Next.js App Router doesn't support WebSocket directly
 * In production, you would use a separate WebSocket server or upgrade the connection
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'status';

    switch (type) {
      case 'status':
        return NextResponse.json({
          success: true,
          status: 'WebSocket simulation active',
          connectionInfo: {
            protocol: 'HTTP Long Polling (Demo)',
            supportedTypes: ['vital-signs', 'alerts', 'device-status', 'emergency'],
            note: 'In production, this would be a real WebSocket connection'
          }
        });

      case 'simulate-alert':
        // Simulate an alert for demonstration
        const alertData = {
          id: `alert_${Date.now()}`,
          severity: 'high',
          type: 'heart_rate_abnormal',
          message: '心率异常：当前值 110 bpm，超过正常范围',
          metric: 'heartRate',
          value: 110,
          threshold: 100,
          timestamp: Date.now(),
          recommendations: ['立即休息', '深呼吸', '如持续异常请就医']
        };

        return NextResponse.json({
          success: true,
          type: 'alert',
          data: alertData,
          timestamp: Date.now()
        });

      case 'simulate-data':
        // Simulate vital signs data
        const vitalSignsData = {
          heartRate: 72 + Math.floor(Math.random() * 20),
          bloodPressureSystolic: 120 + Math.floor(Math.random() * 20),
          bloodPressureDiastolic: 80 + Math.floor(Math.random() * 10),
          temperature: 36.5 + Math.random() * 0.8,
          oxygenSaturation: 97 + Math.floor(Math.random() * 3),
          respiratoryRate: 16 + Math.floor(Math.random() * 4),
          deviceId: 'smartwatch-001',
          batteryLevel: 80 + Math.floor(Math.random() * 20),
          signalStrength: 70 + Math.floor(Math.random() * 30),
          timestamp: Date.now()
        };

        return NextResponse.json({
          success: true,
          type: 'vital-signs',
          data: vitalSignsData,
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in realtime API:', error);
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

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'vital-signs':
        // In a real implementation, this would broadcast to connected WebSocket clients
        console.log('Received vital signs data:', data);
        
        // Simulate processing and potential alert generation
        const alerts = [];
        
        if (data.heartRate && data.heartRate > 100) {
          alerts.push({
            id: `alert_${Date.now()}`,
            severity: data.heartRate > 120 ? 'critical' : 'high',
            type: 'heart_rate_high',
            message: `心率异常：${data.heartRate} bpm`,
            metric: 'heartRate',
            value: data.heartRate,
            threshold: 100,
            timestamp: Date.now()
          });
        }

        if (data.temperature && data.temperature > 37.5) {
          alerts.push({
            id: `alert_${Date.now() + 1}`,
            severity: data.temperature > 38.5 ? 'critical' : 'high',
            type: 'temperature_high',
            message: `体温异常：${data.temperature.toFixed(1)}°C`,
            metric: 'temperature',
            value: data.temperature,
            threshold: 37.5,
            timestamp: Date.now()
          });
        }

        return NextResponse.json({
          success: true,
          received: data,
          alerts,
          timestamp: Date.now()
        });

      case 'device-status':
        console.log('Received device status:', data);
        return NextResponse.json({
          success: true,
          received: data,
          timestamp: Date.now()
        });

      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in realtime POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}