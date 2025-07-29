import { NextRequest, NextResponse } from 'next/server';
import { 
  getUser, 
  getMedicalProfile, 
  createMedicalProfile, 
  updateMedicalProfile,
  logMedicalActivity 
} from '@/lib/db/queries';
import { ActivityType, NewMedicalProfile } from '@/lib/db/schema';
import { z } from 'zod';

const medicalProfileSchema = z.object({
  cancerType: z.string().optional(),
  cancerStage: z.string().optional(),
  diagnosisDate: z.string().transform(str => str ? new Date(str) : null).optional(),
  treatmentPlan: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  doctorName: z.string().optional(),
  doctorContact: z.string().optional(),
  hospitalName: z.string().optional(),
  hospitalAddress: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await getMedicalProfile(user.id);
    
    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching medical profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = medicalProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: validation.error.issues },
        { status: 400 }
      );
    }

    // 检查是否已存在医疗档案
    const existingProfile = await getMedicalProfile(user.id);
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Medical profile already exists. Use PATCH to update.' },
        { status: 409 }
      );
    }

    const profileData: NewMedicalProfile = {
      userId: user.id,
      ...validation.data
    };

    const profile = await createMedicalProfile(profileData);

    // 记录活动日志
    await logMedicalActivity(
      user.id,
      ActivityType.MEDICAL_PROFILE_CREATED,
      {
        profileId: profile.id,
        timestamp: new Date().toISOString()
      },
      request.ip || request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      profile
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating medical profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = medicalProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const profile = await updateMedicalProfile(user.id, validation.data);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Medical profile not found or failed to update' },
        { status: 404 }
      );
    }

    // 记录活动日志
    await logMedicalActivity(
      user.id,
      ActivityType.MEDICAL_PROFILE_UPDATED,
      {
        profileId: profile.id,
        updatedFields: Object.keys(validation.data),
        timestamp: new Date().toISOString()
      },
      request.ip || request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error updating medical profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}