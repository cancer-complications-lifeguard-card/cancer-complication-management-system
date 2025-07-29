import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { medicationReminders, medications } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get medication reminders for user's medications
    const reminders = await db
      .select({
        id: medicationReminders.id,
        medicationId: medicationReminders.medicationId,
        medicationName: medications.medicationName,
        reminderTime: medicationReminders.reminderTime,
        daysOfWeek: medicationReminders.daysOfWeek,
        isActive: medicationReminders.isActive,
        createdAt: medicationReminders.createdAt,
      })
      .from(medicationReminders)
      .innerJoin(medications, eq(medicationReminders.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(desc(medicationReminders.createdAt));

    return NextResponse.json({
      success: true,
      reminders,
    });
  } catch (error) {
    console.error('Error fetching medication reminders:', error);
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

    const { medicationId, reminderTime, daysOfWeek } = body;

    if (!medicationId || !reminderTime || !daysOfWeek) {
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

    const newReminder = await db
      .insert(medicationReminders)
      .values({
        medicationId,
        reminderTime,
        daysOfWeek,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      reminder: newReminder[0],
    });
  } catch (error) {
    console.error('Error creating medication reminder:', error);
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
        { error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Verify reminder belongs to user's medication
    const reminder = await db
      .select({
        id: medicationReminders.id,
        medicationId: medicationReminders.medicationId,
        userId: medications.userId,
      })
      .from(medicationReminders)
      .innerJoin(medications, eq(medicationReminders.medicationId, medications.id))
      .where(eq(medicationReminders.id, id))
      .limit(1);

    if (reminder.length === 0 || reminder[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    const updatedReminder = await db
      .update(medicationReminders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(medicationReminders.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      reminder: updatedReminder[0],
    });
  } catch (error) {
    console.error('Error updating medication reminder:', error);
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
        { error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Verify reminder belongs to user's medication
    const reminder = await db
      .select({
        id: medicationReminders.id,
        medicationId: medicationReminders.medicationId,
        userId: medications.userId,
      })
      .from(medicationReminders)
      .innerJoin(medications, eq(medicationReminders.medicationId, medications.id))
      .where(eq(medicationReminders.id, parseInt(id)))
      .limit(1);

    if (reminder.length === 0 || reminder[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    await db
      .delete(medicationReminders)
      .where(eq(medicationReminders.id, parseInt(id)));

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medication reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}