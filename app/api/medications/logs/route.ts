import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { medicationLogs, medications } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get medication logs for user's medications
    const logs = await db
      .select({
        id: medicationLogs.id,
        medicationId: medicationLogs.medicationId,
        medicationName: medications.medicationName,
        status: medicationLogs.status,
        takenAt: medicationLogs.takenAt,
        notes: medicationLogs.notes,
        createdAt: medicationLogs.createdAt,
      })
      .from(medicationLogs)
      .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(desc(medicationLogs.takenAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Error fetching medication logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}