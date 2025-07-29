import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUserRole, logMedicalActivity } from '@/lib/db/queries';
import { UserRole, ActivityType } from '@/lib/db/schema';
import { z } from 'zod';

const roleUpdateSchema = z.object({
  role: z.nativeEnum(UserRole)
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
    const validation = roleUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    const { role } = validation.data;

    // 更新用户角色
    const updatedUser = await updateUserRole(user.id, role);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // 记录活动日志
    await logMedicalActivity(
      user.id,
      ActivityType.UPDATE_ACCOUNT,
      {
        previousRole: user.role,
        newRole: role,
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
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}