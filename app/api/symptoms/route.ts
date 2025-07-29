import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { symptomLogs } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's symptom logs
    const userSymptoms = await db
      .select()
      .from(symptomLogs)
      .where(eq(symptomLogs.userId, userId))
      .orderBy(desc(symptomLogs.loggedAt));

    return NextResponse.json({
      success: true,
      symptoms: userSymptoms,
    });
  } catch (error) {
    console.error('Error fetching symptoms:', error);
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
      symptomName,
      severity,
      description,
      triggers,
      duration,
      location,
      associatedSymptoms,
      loggedAt,
    } = body;

    if (!symptomName || !severity || !loggedAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate severity range
    if (severity < 1 || severity > 10) {
      return NextResponse.json(
        { error: 'Severity must be between 1 and 10' },
        { status: 400 }
      );
    }

    const newSymptom = await db
      .insert(symptomLogs)
      .values({
        userId,
        symptomName,
        severity,
        description: description || null,
        triggers: triggers || null,
        duration: duration || null,
        location: location || null,
        associatedSymptoms: associatedSymptoms || null,
        loggedAt: new Date(loggedAt),
      })
      .returning();

    return NextResponse.json({
      success: true,
      symptom: newSymptom[0],
    });
  } catch (error) {
    console.error('Error creating symptom log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Symptom ID is required' },
        { status: 400 }
      );
    }

    // Verify symptom belongs to user
    const existingSymptom = await db
      .select()
      .from(symptomLogs)
      .where(and(eq(symptomLogs.id, id), eq(symptomLogs.userId, userId)))
      .limit(1);

    if (existingSymptom.length === 0) {
      return NextResponse.json(
        { error: 'Symptom not found' },
        { status: 404 }
      );
    }

    const updatedSymptom = await db
      .update(symptomLogs)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(symptomLogs.id, id), eq(symptomLogs.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      symptom: updatedSymptom[0],
    });
  } catch (error) {
    console.error('Error updating symptom:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Symptom ID is required' },
        { status: 400 }
      );
    }

    // Verify symptom belongs to user
    const existingSymptom = await db
      .select()
      .from(symptomLogs)
      .where(and(eq(symptomLogs.id, parseInt(id)), eq(symptomLogs.userId, userId)))
      .limit(1);

    if (existingSymptom.length === 0) {
      return NextResponse.json(
        { error: 'Symptom not found' },
        { status: 404 }
      );
    }

    await db
      .delete(symptomLogs)
      .where(and(eq(symptomLogs.id, parseInt(id)), eq(symptomLogs.userId, userId)));

    return NextResponse.json({
      success: true,
      message: 'Symptom deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting symptom:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}