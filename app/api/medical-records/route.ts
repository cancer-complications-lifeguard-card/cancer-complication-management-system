import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { medicalRecords } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user's medical records
    const userRecords = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.userId, userId))
      .orderBy(desc(medicalRecords.recordDate));

    return NextResponse.json({
      success: true,
      records: userRecords,
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
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
      recordType,
      title,
      description,
      recordDate,
      hospital,
      doctor,
      diagnosis,
      treatment,
      followUpDate,
    } = body;

    if (!recordType || !title || !description || !recordDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRecord = await db
      .insert(medicalRecords)
      .values({
        userId,
        recordType,
        title,
        description,
        recordDate: new Date(recordDate),
        hospital: hospital || null,
        doctor: doctor || null,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        attachments: null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      record: newRecord[0],
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
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
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Verify record belongs to user
    const existingRecord = await db
      .select()
      .from(medicalRecords)
      .where(and(eq(medicalRecords.id, id), eq(medicalRecords.userId, userId)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const updatedRecord = await db
      .update(medicalRecords)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(medicalRecords.id, id), eq(medicalRecords.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      record: updatedRecord[0],
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
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
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Verify record belongs to user
    const existingRecord = await db
      .select()
      .from(medicalRecords)
      .where(and(eq(medicalRecords.id, parseInt(id)), eq(medicalRecords.userId, userId)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    await db
      .delete(medicalRecords)
      .where(and(eq(medicalRecords.id, parseInt(id)), eq(medicalRecords.userId, userId)));

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}