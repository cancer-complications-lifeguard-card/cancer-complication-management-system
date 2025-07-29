import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { medicationLogs, medications } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { medicationId, status, takenAt, notes } = body;

    if (!medicationId || !status || !takenAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify medication belongs to user
    const medication = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
      .limit(1);

    if (medication.length === 0) {
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 }
      );
    }

    const newLog = await db
      .insert(medicationLogs)
      .values({
        medicationId,
        status,
        takenAt: new Date(takenAt),
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      log: newLog[0],
    });
  } catch (error) {
    console.error('Error logging medication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}