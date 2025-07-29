import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { medications, medicationReminders } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's medications
    const userMedications = await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.createdAt));

    return NextResponse.json({
      success: true,
      medications: userMedications,
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
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
      medicationName,
      genericName,
      dosage,
      frequency,
      routeOfAdministration,
      startDate,
      endDate,
      prescribedBy,
      indication,
      instructions,
    } = body;

    if (!medicationName || !dosage || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMedication = await db
      .insert(medications)
      .values({
        userId,
        medicationName,
        genericName: genericName || null,
        dosage,
        frequency,
        routeOfAdministration: routeOfAdministration || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        prescribedBy: prescribedBy || null,
        indication: indication || null,
        instructions: instructions || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      medication: newMedication[0],
    });
  } catch (error) {
    console.error('Error creating medication:', error);
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
        { error: 'Medication ID is required' },
        { status: 400 }
      );
    }

    // Verify medication belongs to user
    const existingMedication = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, id), eq(medications.userId, userId)))
      .limit(1);

    if (existingMedication.length === 0) {
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 }
      );
    }

    const updatedMedication = await db
      .update(medications)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(medications.id, id), eq(medications.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      medication: updatedMedication[0],
    });
  } catch (error) {
    console.error('Error updating medication:', error);
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
        { error: 'Medication ID is required' },
        { status: 400 }
      );
    }

    // Verify medication belongs to user
    const existingMedication = await db
      .select()
      .from(medications)
      .where(and(eq(medications.id, parseInt(id)), eq(medications.userId, userId)))
      .limit(1);

    if (existingMedication.length === 0) {
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 }
      );
    }

    await db
      .delete(medications)
      .where(and(eq(medications.id, parseInt(id)), eq(medications.userId, userId)));

    return NextResponse.json({
      success: true,
      message: 'Medication deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medication:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}