import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  createEmergencyCard, 
  getEmergencyCardForDisplay, 
  updateEmergencyCard,
  deactivateEmergencyCard 
} from '@/lib/db/emergency-queries';
import { logEmergencyCardAccess } from '@/lib/security/audit-logger';
import { canAccessResource, ResourceType } from '@/lib/security/access-control';
import { UserRole, UserStage } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查访问权限
    if (!canAccessResource(
      session.userRole as UserRole,
      session.userStage as UserStage,
      ResourceType.EMERGENCY_CARD,
      'read',
      session.userId,
      session.userId
    )) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const card = await getEmergencyCardForDisplay(session.userId);
    
    // 记录访问日志
    if (card) {
      await logEmergencyCardAccess(
        session.userId,
        card.cardId,
        'read',
        request.ip,
        { userAgent: request.headers.get('user-agent') }
      );
    }
    
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching emergency card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardData = await request.json();

    // Validate required fields
    if (!cardData.emergencyContacts || !cardData.medicalInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const card = await createEmergencyCard(session.userId, cardData);
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error creating emergency card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, ...updates } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    const updatedCard = await updateEmergencyCard(cardId, updates);
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error updating emergency card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    await deactivateEmergencyCard(cardId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating emergency card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}