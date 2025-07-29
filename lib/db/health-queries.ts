import { desc, eq, and, gte, lte, isNull, or } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  medications, 
  medicationReminders, 
  medicationLogs, 
  medicalRecords, 
  symptomLogs, 
  healthMetrics,
  users,
  MedicationStatus,
  RecordType,
  RecordPriority,
  MetricType,
  ActivityType 
} from './schema';
import type { 
  Medication, 
  NewMedication, 
  MedicationReminder, 
  NewMedicationReminder,
  MedicationLog,
  NewMedicationLog,
  MedicalRecord,
  NewMedicalRecord,
  SymptomLog,
  NewSymptomLog,
  HealthMetric,
  NewHealthMetric
} from './schema';

// Medication Management
export async function getUserMedications(userId: number, includeInactive = false) {
  const conditions = [eq(medications.userId, userId)];
  if (!includeInactive) {
    conditions.push(eq(medications.isActive, true));
  }

  return await db
    .select()
    .from(medications)
    .where(and(...conditions))
    .orderBy(desc(medications.createdAt));
}

export async function getMedicationById(medicationId: number) {
  const result = await db
    .select()
    .from(medications)
    .where(eq(medications.id, medicationId))
    .limit(1);
  
  return result[0] || null;
}

export async function createMedication(medication: NewMedication) {
  const result = await db
    .insert(medications)
    .values(medication)
    .returning();
  
  return result[0];
}

export async function updateMedication(medicationId: number, updates: Partial<NewMedication>) {
  const result = await db
    .update(medications)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medications.id, medicationId))
    .returning();
  
  return result[0];
}

export async function deleteMedication(medicationId: number) {
  const result = await db
    .update(medications)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(medications.id, medicationId))
    .returning();
  
  return result[0];
}

// Medication Reminders
export async function getMedicationReminders(medicationId: number) {
  return await db
    .select()
    .from(medicationReminders)
    .where(eq(medicationReminders.medicationId, medicationId))
    .orderBy(medicationReminders.reminderTime);
}

export async function getUserReminders(userId: number) {
  return await db
    .select({
      reminder: medicationReminders,
      medication: medications,
    })
    .from(medicationReminders)
    .innerJoin(medications, eq(medicationReminders.medicationId, medications.id))
    .where(
      and(
        eq(medicationReminders.userId, userId),
        eq(medicationReminders.isEnabled, true),
        eq(medications.isActive, true)
      )
    )
    .orderBy(medicationReminders.reminderTime);
}

export async function createMedicationReminder(reminder: NewMedicationReminder) {
  const result = await db
    .insert(medicationReminders)
    .values(reminder)
    .returning();
  
  return result[0];
}

export async function updateMedicationReminder(reminderId: number, updates: Partial<NewMedicationReminder>) {
  const result = await db
    .update(medicationReminders)
    .set(updates)
    .where(eq(medicationReminders.id, reminderId))
    .returning();
  
  return result[0];
}

export async function deleteMedicationReminder(reminderId: number) {
  await db
    .delete(medicationReminders)
    .where(eq(medicationReminders.id, reminderId));
}

// Medication Logs
export async function getMedicationLogs(medicationId: number, limit = 30) {
  return await db
    .select()
    .from(medicationLogs)
    .where(eq(medicationLogs.medicationId, medicationId))
    .orderBy(desc(medicationLogs.takenAt))
    .limit(limit);
}

export async function getUserMedicationLogs(userId: number, limit = 100) {
  return await db
    .select({
      log: medicationLogs,
      medication: medications,
    })
    .from(medicationLogs)
    .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
    .where(eq(medicationLogs.userId, userId))
    .orderBy(desc(medicationLogs.takenAt))
    .limit(limit);
}

export async function createMedicationLog(log: NewMedicationLog) {
  const result = await db
    .insert(medicationLogs)
    .values(log)
    .returning();
  
  return result[0];
}

export async function getMedicationAdherence(medicationId: number, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const logs = await db
    .select()
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.medicationId, medicationId),
        gte(medicationLogs.takenAt, fromDate)
      )
    );
  
  const totalLogs = logs.length;
  const takenLogs = logs.filter(log => log.status === MedicationStatus.TAKEN).length;
  const adherenceRate = totalLogs > 0 ? (takenLogs / totalLogs) * 100 : 0;
  
  return {
    totalLogs,
    takenLogs,
    adherenceRate: Math.round(adherenceRate * 100) / 100,
    logs
  };
}

// Medical Records
export async function getUserMedicalRecords(userId: number, recordType?: RecordType) {
  const conditions = [eq(medicalRecords.userId, userId)];
  if (recordType) {
    conditions.push(eq(medicalRecords.recordType, recordType));
  }

  return await db
    .select()
    .from(medicalRecords)
    .where(and(...conditions))
    .orderBy(desc(medicalRecords.recordDate));
}

export async function getMedicalRecordById(recordId: number) {
  const result = await db
    .select()
    .from(medicalRecords)
    .where(eq(medicalRecords.id, recordId))
    .limit(1);
  
  return result[0] || null;
}

export async function createMedicalRecord(record: NewMedicalRecord) {
  const result = await db
    .insert(medicalRecords)
    .values(record)
    .returning();
  
  return result[0];
}

export async function updateMedicalRecord(recordId: number, updates: Partial<NewMedicalRecord>) {
  const result = await db
    .update(medicalRecords)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medicalRecords.id, recordId))
    .returning();
  
  return result[0];
}

export async function deleteMedicalRecord(recordId: number) {
  await db
    .delete(medicalRecords)
    .where(eq(medicalRecords.id, recordId));
}

// Symptom Logs
export async function getUserSymptomLogs(userId: number, limit = 100) {
  return await db
    .select()
    .from(symptomLogs)
    .where(eq(symptomLogs.userId, userId))
    .orderBy(desc(symptomLogs.recordedAt))
    .limit(limit);
}

export async function getSymptomLogById(logId: number) {
  const result = await db
    .select()
    .from(symptomLogs)
    .where(eq(symptomLogs.id, logId))
    .limit(1);
  
  return result[0] || null;
}

export async function createSymptomLog(log: NewSymptomLog) {
  const result = await db
    .insert(symptomLogs)
    .values(log)
    .returning();
  
  return result[0];
}

export async function getSymptomTrends(userId: number, symptomName: string, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  return await db
    .select()
    .from(symptomLogs)
    .where(
      and(
        eq(symptomLogs.userId, userId),
        eq(symptomLogs.symptomName, symptomName),
        gte(symptomLogs.recordedAt, fromDate)
      )
    )
    .orderBy(symptomLogs.recordedAt);
}

// Health Metrics
export async function getUserHealthMetrics(userId: number, metricType?: MetricType, limit = 100) {
  const conditions = [eq(healthMetrics.userId, userId)];
  if (metricType) {
    conditions.push(eq(healthMetrics.metricType, metricType));
  }

  return await db
    .select()
    .from(healthMetrics)
    .where(and(...conditions))
    .orderBy(desc(healthMetrics.recordedAt))
    .limit(limit);
}

export async function createHealthMetric(metric: NewHealthMetric) {
  const result = await db
    .insert(healthMetrics)
    .values(metric)
    .returning();
  
  return result[0];
}

export async function getHealthMetricTrends(userId: number, metricType: MetricType, days = 30) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  return await db
    .select()
    .from(healthMetrics)
    .where(
      and(
        eq(healthMetrics.userId, userId),
        eq(healthMetrics.metricType, metricType),
        gte(healthMetrics.recordedAt, fromDate)
      )
    )
    .orderBy(healthMetrics.recordedAt);
}

// Dashboard Summary
export async function getHealthDashboardSummary(userId: number) {
  const today = new Date();
  const thisWeek = new Date();
  thisWeek.setDate(today.getDate() - 7);
  
  // Get active medications count
  const activeMedicationsResult = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.userId, userId),
        eq(medications.isActive, true)
      )
    );
  
  // Get recent medication logs
  const recentMedicationLogsResult = await db
    .select()
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.userId, userId),
        gte(medicationLogs.takenAt, thisWeek)
      )
    );
  
  // Get recent symptom logs
  const recentSymptomLogsResult = await db
    .select()
    .from(symptomLogs)
    .where(
      and(
        eq(symptomLogs.userId, userId),
        gte(symptomLogs.recordedAt, thisWeek)
      )
    );
  
  // Get recent medical records
  const recentMedicalRecordsResult = await db
    .select()
    .from(medicalRecords)
    .where(
      and(
        eq(medicalRecords.userId, userId),
        gte(medicalRecords.recordDate, thisWeek)
      )
    );
  
  // Calculate medication adherence this week
  const totalMedicationLogs = recentMedicationLogsResult.length;
  const takenMedicationLogs = recentMedicationLogsResult.filter(
    log => log.status === MedicationStatus.TAKEN
  ).length;
  const adherenceRate = totalMedicationLogs > 0 ? (takenMedicationLogs / totalMedicationLogs) * 100 : 0;
  
  return {
    activeMedications: activeMedicationsResult.length,
    weeklyMedicationLogs: totalMedicationLogs,
    adherenceRate: Math.round(adherenceRate * 100) / 100,
    weeklySymptomLogs: recentSymptomLogsResult.length,
    weeklyMedicalRecords: recentMedicalRecordsResult.length,
    recentSymptoms: recentSymptomLogsResult.slice(0, 5),
    recentRecords: recentMedicalRecordsResult.slice(0, 5)
  };
}