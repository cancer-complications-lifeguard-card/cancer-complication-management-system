import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  json,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('patient'), // patient, family, caregiver
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('daily'), // daily, inquiry, onset
  phone: varchar('phone', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 100 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const medicalProfiles = pgTable('medical_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  cancerType: varchar('cancer_type', { length: 100 }),
  cancerStage: varchar('cancer_stage', { length: 50 }),
  diagnosisDate: date('diagnosis_date'),
  treatmentPlan: text('treatment_plan'),
  allergies: text('allergies'),
  medications: json('medications'), // JSON array of current medications
  medicalHistory: text('medical_history'),
  doctorName: varchar('doctor_name', { length: 100 }),
  doctorContact: varchar('doctor_contact', { length: 100 }),
  hospitalName: varchar('hospital_name', { length: 200 }),
  hospitalAddress: text('hospital_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const medicalTerms = pgTable('medical_terms', {
  id: serial('id').primaryKey(),
  term: varchar('term', { length: 200 }).notNull(),
  definition: text('definition').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // cancer_type, symptom, treatment, etc.
  aliases: json('aliases'), // JSON array of alternative terms
  relatedTerms: json('related_terms'), // JSON array of related term IDs
  severity: varchar('severity', { length: 50 }), // low, medium, high, critical
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const complicationRiskTrees = pgTable('complication_risk_trees', {
  id: serial('id').primaryKey(),
  cancerType: varchar('cancer_type', { length: 100 }).notNull(),
  complicationName: varchar('complication_name', { length: 200 }).notNull(),
  description: text('description'),
  riskLevel: varchar('risk_level', { length: 50 }).notNull(), // low, medium, high, critical
  probability: varchar('probability', { length: 50 }), // percentage or range
  timeframe: varchar('timeframe', { length: 100 }), // when this complication typically occurs
  symptoms: json('symptoms'), // JSON array of symptom descriptions
  riskFactors: json('risk_factors'), // JSON array of risk factors
  preventionMeasures: json('prevention_measures'), // JSON array of prevention strategies
  treatmentOptions: json('treatment_options'), // JSON array of treatment approaches
  parentId: integer('parent_id').references(() => complicationRiskTrees.id), // for hierarchical structure
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const knowledgeInteractions = pgTable('knowledge_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // term_lookup, risk_assessment, tree_navigation
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // medical_term, risk_tree
  resourceId: integer('resource_id').notNull(), // ID of the medical term or risk tree
  query: text('query'), // original search query or interaction context
  metadata: json('metadata'), // additional interaction data
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  medicationName: varchar('medication_name', { length: 200 }).notNull(),
  genericName: varchar('generic_name', { length: 200 }),
  dosage: varchar('dosage', { length: 100 }).notNull(), // e.g., "10mg", "1 tablet"
  frequency: varchar('frequency', { length: 100 }).notNull(), // e.g., "twice daily", "every 8 hours"
  routeOfAdministration: varchar('route_of_administration', { length: 50 }), // oral, injection, etc.
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // null for ongoing medications
  prescribedBy: varchar('prescribed_by', { length: 100 }), // doctor name
  indication: text('indication'), // reason for prescription
  sideEffects: json('side_effects'), // JSON array of potential side effects
  instructions: text('instructions'), // special instructions
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const medicationReminders = pgTable('medication_reminders', {
  id: serial('id').primaryKey(),
  medicationId: integer('medication_id')
    .notNull()
    .references(() => medications.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  reminderTime: varchar('reminder_time', { length: 8 }).notNull(), // HH:MM:SS format
  daysOfWeek: json('days_of_week'), // JSON array [0,1,2,3,4,5,6] for Sun-Sat
  isEnabled: boolean('is_enabled').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const medicationLogs = pgTable('medication_logs', {
  id: serial('id').primaryKey(),
  medicationId: integer('medication_id')
    .notNull()
    .references(() => medications.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  takenAt: timestamp('taken_at').notNull(),
  dosageTaken: varchar('dosage_taken', { length: 100 }), // actual dosage taken
  status: varchar('status', { length: 20 }).notNull().default('taken'), // taken, missed, skipped
  notes: text('notes'),
  sideEffectsReported: json('side_effects_reported'), // JSON array of reported side effects
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const medicalRecords = pgTable('medical_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  recordType: varchar('record_type', { length: 50 }).notNull(), // lab_result, imaging, consultation, etc.
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  recordDate: date('record_date').notNull(),
  facilityName: varchar('facility_name', { length: 200 }),
  doctorName: varchar('doctor_name', { length: 100 }),
  testResults: json('test_results'), // JSON object with test values
  attachments: json('attachments'), // JSON array of file references
  tags: json('tags'), // JSON array of tags for categorization
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const symptomLogs = pgTable('symptom_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  symptomName: varchar('symptom_name', { length: 100 }).notNull(),
  severity: integer('severity').notNull(), // 1-10 scale
  location: varchar('location', { length: 100 }), // body location if applicable
  description: text('description'),
  duration: varchar('duration', { length: 50 }), // e.g., "2 hours", "all day"
  triggers: json('triggers'), // JSON array of potential triggers
  relievingFactors: json('relieving_factors'), // JSON array of things that help
  associatedMedications: json('associated_medications'), // JSON array of medication IDs
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const healthMetrics = pgTable('health_metrics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  metricType: varchar('metric_type', { length: 50 }).notNull(), // weight, blood_pressure, temperature, etc.
  value: varchar('value', { length: 100 }).notNull(), // flexible string to handle different types
  unit: varchar('unit', { length: 20 }), // kg, mmHg, °C, etc.
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  notes: text('notes'),
  source: varchar('source', { length: 50 }).default('manual'), // manual, device, imported
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: text('metadata'), // JSON field for additional medical-related data
});

// Emergency Red Card System
export const emergencyCards = pgTable('emergency_cards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  cardId: varchar('card_id', { length: 16 }).notNull().unique(), // 16-character unique ID
  qrCode: text('qr_code').notNull(), // Base64 encoded QR code
  isActive: boolean('is_active').notNull().default(true),
  emergencyContacts: text('emergency_contacts').notNull(), // JSON array of contacts
  medicalInfo: text('medical_info').notNull(), // JSON of critical medical information
  allergies: text('allergies'), // JSON array of allergies
  medications: text('medications'), // JSON array of current medications
  medicalConditions: text('medical_conditions'), // JSON array of conditions
  bloodType: varchar('blood_type', { length: 10 }),
  insuranceInfo: text('insurance_info'), // JSON of insurance details
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const emergencyCallLogs = pgTable('emergency_call_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  emergencyCardId: integer('emergency_card_id')
    .notNull()
    .references(() => emergencyCards.id),
  callType: varchar('call_type', { length: 20 }).notNull(), // '120', 'hospital', 'family'
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  callDuration: integer('call_duration'), // in seconds
  callStatus: varchar('call_status', { length: 20 }).notNull().default('initiated'), // 'initiated', 'connected', 'completed', 'failed'
  location: text('location'), // JSON of GPS coordinates
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  notes: text('notes'),
});

// Medical Knowledge Base System
export const nccnGuidelines = pgTable('nccn_guidelines', {
  id: serial('id').primaryKey(),
  guidelineId: varchar('guideline_id', { length: 50 }).notNull().unique(), // NCCN guideline identifier
  title: text('title').notNull(),
  cancerType: varchar('cancer_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'diagnosis', 'treatment', 'followup', 'supportive_care'
  version: varchar('version', { length: 20 }).notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  content: text('content').notNull(), // Structured guideline content
  summary: text('summary'), // Executive summary
  recommendations: text('recommendations'), // Key recommendations JSON
  evidenceLevel: varchar('evidence_level', { length: 20 }), // Level of evidence
  consensusLevel: varchar('consensus_level', { length: 20 }), // Consensus level
  keywords: text('keywords'), // Searchable keywords JSON
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const drugInteractions = pgTable('drug_interactions', {
  id: serial('id').primaryKey(),
  drugA: varchar('drug_a', { length: 200 }).notNull(), // First drug name
  drugB: varchar('drug_b', { length: 200 }).notNull(), // Second drug name
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // 'major', 'moderate', 'minor'
  severity: varchar('severity', { length: 20 }).notNull(), // 'contraindicated', 'serious', 'significant', 'minor'
  mechanism: text('mechanism'), // How the interaction occurs
  clinicalEffect: text('clinical_effect').notNull(), // Description of the interaction effect
  management: text('management'), // How to manage the interaction
  documentation: varchar('documentation', { length: 50 }), // Quality of documentation
  onset: varchar('onset', { length: 20 }), // 'rapid', 'delayed'
  probability: varchar('probability', { length: 20 }), // 'established', 'probable', 'suspected'
  alternativeDrugs: text('alternative_drugs'), // Suggested alternatives JSON
  references: text('references'), // Scientific references JSON
  lastReviewed: timestamp('last_reviewed'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const clinicalTrials = pgTable('clinical_trials', {
  id: serial('id').primaryKey(),
  nctId: varchar('nct_id', { length: 20 }).notNull().unique(), // ClinicalTrials.gov identifier
  title: text('title').notNull(),
  briefSummary: text('brief_summary'),
  detailedDescription: text('detailed_description'),
  cancerTypes: text('cancer_types'), // JSON array of applicable cancer types
  phase: varchar('phase', { length: 20 }), // 'Phase I', 'Phase II', etc.
  status: varchar('status', { length: 50 }).notNull(), // 'recruiting', 'active', 'completed', etc.
  primaryPurpose: varchar('primary_purpose', { length: 100 }), // 'treatment', 'prevention', etc.
  interventions: text('interventions'), // JSON array of interventions
  eligibilityCriteria: text('eligibility_criteria'),
  locations: text('locations'), // JSON array of study locations
  contacts: text('contacts'), // JSON contact information
  startDate: timestamp('start_date'),
  completionDate: timestamp('completion_date'),
  lastUpdated: timestamp('last_updated'),
  source: varchar('source', { length: 100 }).default('ClinicalTrials.gov'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const knowledgeArticles = pgTable('knowledge_articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  category: varchar('category', { length: 100 }).notNull(), // 'treatment', 'side_effects', 'nutrition', etc.
  subcategory: varchar('subcategory', { length: 100 }),
  cancerTypes: text('cancer_types'), // JSON array of applicable cancer types
  targetAudience: varchar('target_audience', { length: 50 }).notNull(), // 'patient', 'caregiver', 'healthcare_provider'
  readingLevel: varchar('reading_level', { length: 20 }), // 'basic', 'intermediate', 'advanced'
  medicalReviewedBy: varchar('medical_reviewed_by', { length: 200 }), // Reviewer credentials
  medicalReviewDate: timestamp('medical_review_date'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  viewCount: integer('view_count').notNull().default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  ratingCount: integer('rating_count').notNull().default(0),
  keywords: text('keywords'), // Searchable keywords JSON
  relatedArticles: text('related_articles'), // JSON array of related article IDs
  isPublished: boolean('is_published').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userKnowledgeInteractions = pgTable('user_knowledge_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'guideline', 'drug_interaction', 'clinical_trial', 'article'
  contentId: integer('content_id').notNull(), // ID of the content
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // 'view', 'bookmark', 'share', 'rate', 'search'
  rating: integer('rating'), // 1-5 rating if applicable
  feedback: text('feedback'), // User feedback text
  searchQuery: text('search_query'), // Original search query if applicable
  sessionId: varchar('session_id', { length: 100 }), // Session tracking
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: text('metadata'), // Additional interaction data JSON
});

export const usersRelations = relations(users, ({ many, one }) => ({
  activityLogs: many(activityLogs),
  knowledgeInteractions: many(knowledgeInteractions),
  medications: many(medications),
  medicationReminders: many(medicationReminders),
  medicationLogs: many(medicationLogs),
  medicalRecords: many(medicalRecords),
  symptomLogs: many(symptomLogs),
  healthMetrics: many(healthMetrics),
  emergencyCards: many(emergencyCards),
  emergencyCallLogs: many(emergencyCallLogs),
  userKnowledgeInteractions: many(userKnowledgeInteractions),
  medicalProfile: one(medicalProfiles, {
    fields: [users.id],
    references: [medicalProfiles.userId],
  }),
}));

export const medicalProfilesRelations = relations(medicalProfiles, ({ one }) => ({
  user: one(users, {
    fields: [medicalProfiles.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const complicationRiskTreesRelations = relations(complicationRiskTrees, ({ one, many }) => ({
  parent: one(complicationRiskTrees, {
    fields: [complicationRiskTrees.parentId],
    references: [complicationRiskTrees.id],
  }),
  children: many(complicationRiskTrees),
}));

export const knowledgeInteractionsRelations = relations(knowledgeInteractions, ({ one }) => ({
  user: one(users, {
    fields: [knowledgeInteractions.userId],
    references: [users.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  user: one(users, {
    fields: [medications.userId],
    references: [users.id],
  }),
  reminders: many(medicationReminders),
  logs: many(medicationLogs),
}));

export const medicationRemindersRelations = relations(medicationReminders, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationReminders.medicationId],
    references: [medications.id],
  }),
  user: one(users, {
    fields: [medicationReminders.userId],
    references: [users.id],
  }),
}));

export const medicationLogsRelations = relations(medicationLogs, ({ one }) => ({
  medication: one(medications, {
    fields: [medicationLogs.medicationId],
    references: [medications.id],
  }),
  user: one(users, {
    fields: [medicationLogs.userId],
    references: [users.id],
  }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  user: one(users, {
    fields: [medicalRecords.userId],
    references: [users.id],
  }),
}));

export const symptomLogsRelations = relations(symptomLogs, ({ one }) => ({
  user: one(users, {
    fields: [symptomLogs.userId],
    references: [users.id],
  }),
}));

export const healthMetricsRelations = relations(healthMetrics, ({ one }) => ({
  user: one(users, {
    fields: [healthMetrics.userId],
    references: [users.id],
  }),
}));

export const emergencyCardsRelations = relations(emergencyCards, ({ one, many }) => ({
  user: one(users, {
    fields: [emergencyCards.userId],
    references: [users.id],
  }),
  callLogs: many(emergencyCallLogs),
}));

export const emergencyCallLogsRelations = relations(emergencyCallLogs, ({ one }) => ({
  user: one(users, {
    fields: [emergencyCallLogs.userId],
    references: [users.id],
  }),
  emergencyCard: one(emergencyCards, {
    fields: [emergencyCallLogs.emergencyCardId],
    references: [emergencyCards.id],
  }),
}));

export const userKnowledgeInteractionsRelations = relations(userKnowledgeInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userKnowledgeInteractions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MedicalProfile = typeof medicalProfiles.$inferSelect;
export type NewMedicalProfile = typeof medicalProfiles.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type MedicalTerm = typeof medicalTerms.$inferSelect;
export type NewMedicalTerm = typeof medicalTerms.$inferInsert;
export type ComplicationRiskTree = typeof complicationRiskTrees.$inferSelect;
export type NewComplicationRiskTree = typeof complicationRiskTrees.$inferInsert;
export type KnowledgeInteraction = typeof knowledgeInteractions.$inferSelect;
export type NewKnowledgeInteraction = typeof knowledgeInteractions.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
export type MedicationReminder = typeof medicationReminders.$inferSelect;
export type NewMedicationReminder = typeof medicationReminders.$inferInsert;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type NewMedicationLog = typeof medicationLogs.$inferInsert;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof medicalRecords.$inferInsert;
export type SymptomLog = typeof symptomLogs.$inferSelect;
export type NewSymptomLog = typeof symptomLogs.$inferInsert;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type NewHealthMetric = typeof healthMetrics.$inferInsert;
export type EmergencyCard = typeof emergencyCards.$inferSelect;
export type NewEmergencyCard = typeof emergencyCards.$inferInsert;
export type EmergencyCallLog = typeof emergencyCallLogs.$inferSelect;
export type NewEmergencyCallLog = typeof emergencyCallLogs.$inferInsert;
export type NCCNGuideline = typeof nccnGuidelines.$inferSelect;
export type NewNCCNGuideline = typeof nccnGuidelines.$inferInsert;
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type NewDrugInteraction = typeof drugInteractions.$inferInsert;
export type ClinicalTrial = typeof clinicalTrials.$inferSelect;
export type NewClinicalTrial = typeof clinicalTrials.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type NewKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
export type UserKnowledgeInteraction = typeof userKnowledgeInteractions.$inferSelect;
export type NewUserKnowledgeInteraction = typeof userKnowledgeInteractions.$inferInsert;

export enum UserRole {
  PATIENT = 'patient',
  FAMILY = 'family',
  CAREGIVER = 'caregiver',
}

export enum UserStage {
  DAILY = 'daily',
  INQUIRY = 'inquiry',
  ONSET = 'onset',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TermCategory {
  CANCER_TYPE = 'cancer_type',
  SYMPTOM = 'symptom',
  TREATMENT = 'treatment',
  MEDICATION = 'medication',
  PROCEDURE = 'procedure',
  COMPLICATION = 'complication',
  ANATOMY = 'anatomy',
}

export enum InteractionType {
  TERM_LOOKUP = 'term_lookup',
  RISK_ASSESSMENT = 'risk_assessment',
  TREE_NAVIGATION = 'tree_navigation',
  SEARCH_QUERY = 'search_query',
}

export enum MedicationStatus {
  TAKEN = 'taken',
  MISSED = 'missed',
  SKIPPED = 'skipped',
  PARTIAL = 'partial',
}

export enum RecordType {
  LAB_RESULT = 'lab_result',
  IMAGING = 'imaging',
  CONSULTATION = 'consultation',
  PRESCRIPTION = 'prescription',
  SURGERY = 'surgery',
  TREATMENT = 'treatment',
  DISCHARGE = 'discharge',
  OTHER = 'other',
}

export enum RecordPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MetricType {
  WEIGHT = 'weight',
  BLOOD_PRESSURE = 'blood_pressure',
  TEMPERATURE = 'temperature',
  HEART_RATE = 'heart_rate',
  BLOOD_SUGAR = 'blood_sugar',
  OXYGEN_SATURATION = 'oxygen_saturation',
  PAIN_LEVEL = 'pain_level',
  OTHER = 'other',
}

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  STAGE_CHANGED = 'STAGE_CHANGED',
  MEDICAL_PROFILE_CREATED = 'MEDICAL_PROFILE_CREATED',
  MEDICAL_PROFILE_UPDATED = 'MEDICAL_PROFILE_UPDATED',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_MISSED = 'MEDICATION_MISSED',
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  SYMPTOM_RECORDED = 'SYMPTOM_RECORDED',
  MEDICAL_RECORD_ADDED = 'MEDICAL_RECORD_ADDED',
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  VITAL_SIGNS_RECORDED = 'VITAL_SIGNS_RECORDED',
  KNOWLEDGE_ACCESSED = 'KNOWLEDGE_ACCESSED',
  RISK_TREE_VIEWED = 'RISK_TREE_VIEWED',
  TERM_SEARCHED = 'TERM_SEARCHED',
}

// Push Subscriptions for PWA notifications
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dhKey: text('p256dh_key'),
  authKey: text('auth_key'),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});