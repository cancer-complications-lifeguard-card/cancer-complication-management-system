import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, users, medicalProfiles, UserRole, UserStage, ActivityType } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import type { User, MedicalProfile, NewMedicalProfile } from './schema';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      metadata: activityLogs.metadata,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getUserWithMedicalProfile(userId: number) {
  const result = await db
    .select({
      user: users,
      medicalProfile: medicalProfiles,
    })
    .from(users)
    .leftJoin(medicalProfiles, eq(medicalProfiles.userId, users.id))
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return result[0] || null;
}

export async function getMedicalProfile(userId: number) {
  const result = await db
    .select()
    .from(medicalProfiles)
    .where(eq(medicalProfiles.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function createMedicalProfile(profile: NewMedicalProfile) {
  const result = await db
    .insert(medicalProfiles)
    .values(profile)
    .returning();

  return result[0];
}

export async function updateMedicalProfile(
  userId: number,
  updates: Partial<NewMedicalProfile>
) {
  const result = await db
    .update(medicalProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medicalProfiles.userId, userId))
    .returning();

  return result[0];
}

export async function updateUserStage(userId: number, stage: UserStage) {
  const result = await db
    .update(users)
    .set({ 
      currentStage: stage,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

export async function updateUserRole(userId: number, role: UserRole) {
  const result = await db
    .update(users)
    .set({ 
      role: role,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

export async function logMedicalActivity(
  userId: number,
  action: ActivityType,
  metadata?: any,
  ipAddress?: string
) {
  const result = await db
    .insert(activityLogs)
    .values({
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      timestamp: new Date(),
    })
    .returning();

  return result[0];
}