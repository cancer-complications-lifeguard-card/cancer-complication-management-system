import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUserStage, logMedicalActivity } from '@/lib/db/queries';
import { UserStage, ActivityType } from '@/lib/db/schema';
import { z } from 'zod';

const stageUpdateSchema = z.object({
  stage: z.nativeEnum(UserStage)
});

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
    const validation = stageUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid stage provided' },
        { status: 400 }
      );
    }

    const { stage } = validation.data;

    // 更新用户阶段
    const updatedUser = await updateUserStage(user.id, stage);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user stage' },
        { status: 500 }
      );
    }

    // 记录活动日志
    await logMedicalActivity(
      user.id,
      ActivityType.STAGE_CHANGED,
      {
        previousStage: user.currentStage,
        newStage: stage,
        timestamp: new Date().toISOString()
      },
      request.ip || request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        currentStage: updatedUser.currentStage,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user stage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}