import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  logEmergencyCall, 
  updateEmergencyCallStatus, 
  getEmergencyCallHistory 
} from '@/lib/db/emergency-queries';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callHistory = await getEmergencyCallHistory(session.userId);
    return NextResponse.json(callHistory);
  } catch (error) {
    console.error('Error fetching emergency call history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callData = await request.json();

    // Validate required fields
    if (!callData.emergencyCardId || !callData.callType || !callData.phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const callLog = await logEmergencyCall({
      userId: session.userId,
      ...callData,
    });

    return NextResponse.json(callLog);
  } catch (error) {
    console.error('Error logging emergency call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId, status, duration } = await request.json();

    if (!callId || !status) {
      return NextResponse.json({ error: 'Call ID and status are required' }, { status: 400 });
    }

    await updateEmergencyCallStatus(callId, status, duration);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating emergency call status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}