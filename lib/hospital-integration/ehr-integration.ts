// Advanced EHR Integration Module
// Provides comprehensive Electronic Health Records integration

import { 
  HospitalSystem, 
  PatientRecord, 
  HospitalApiResponse,
  MedicalHistoryEntry,
  Medication,
  LabResult,
  VitalSignEntry
} from './types';

export interface EHRSyncConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncFields: EHRSyncField[];
  conflictResolution: 'hospital_wins' | 'latest_timestamp' | 'manual_review';
  enableRealTimeUpdates: boolean;
}

export interface EHRSyncField {
  field: string;
  direction: 'bidirectional' | 'hospital_to_system' | 'system_to_hospital';
  priority: 'high' | 'medium' | 'low';
  lastSync?: string;
}

export interface EHRMapping {
  hospitalSystemId: string;
  fieldMappings: FieldMapping[];
  dataTransformations: DataTransformation[];
}

export interface FieldMapping {
  hospitalField: string;
  systemField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  required: boolean;
  validation?: ValidationRule[];
}

export interface DataTransformation {
  sourceField: string;
  targetField: string;
  transformFunction: string; // Function name for transformation
  parameters?: Record<string, any>;
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'enum' | 'custom';
  rule: string | number[] | string[];
  errorMessage: string;
}

export interface ClinicalDecisionSupport {
  drugInteractionChecks: boolean;
  allergyAlerts: boolean;
  duplicateTherapyWarnings: boolean;
  doseRangeValidation: boolean;
  clinicalGuidelinesIntegration: boolean;
}

export interface EHRSyncStatus {
  hospitalSystemId: string;
  lastSyncTimestamp: string;
  syncStatus: 'success' | 'partial' | 'failed' | 'in_progress';
  recordsProcessed: number;
  errorCount: number;
  errors: SyncError[];
  nextSyncTime: string;
}

export interface SyncError {
  recordId: string;
  field: string;
  errorType: 'validation' | 'mapping' | 'transformation' | 'permission' | 'network';
  message: string;
  timestamp: string;
}

export class EHRIntegrationEngine {
  private syncConfigs: Map<string, EHRSyncConfig> = new Map();
  private mappings: Map<string, EHRMapping> = new Map();
  private syncStatuses: Map<string, EHRSyncStatus> = new Map();
  
  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // Initialize default EHR sync configurations
    const defaultConfig: EHRSyncConfig = {
      autoSync: true,
      syncInterval: 30, // 30 minutes
      syncFields: [
        { field: 'demographics', direction: 'bidirectional', priority: 'high' },
        { field: 'medicalHistory', direction: 'hospital_to_system', priority: 'high' },
        { field: 'medications', direction: 'bidirectional', priority: 'high' },
        { field: 'allergies', direction: 'bidirectional', priority: 'high' },
        { field: 'vitalSigns', direction: 'hospital_to_system', priority: 'medium' },
        { field: 'labResults', direction: 'hospital_to_system', priority: 'medium' },
      ],
      conflictResolution: 'latest_timestamp',
      enableRealTimeUpdates: true,
    };
    
    this.syncConfigs.set('default', defaultConfig);
  }

  /**
   * Configure EHR sync for a specific hospital system
   */
  async configureEHRSync(
    hospitalSystemId: string, 
    config: EHRSyncConfig
  ): Promise<void> {
    try {
      this.syncConfigs.set(hospitalSystemId, config);
      
      // Initialize sync status
      this.syncStatuses.set(hospitalSystemId, {
        hospitalSystemId,
        lastSyncTimestamp: new Date().toISOString(),
        syncStatus: 'success',
        recordsProcessed: 0,
        errorCount: 0,
        errors: [],
        nextSyncTime: this.calculateNextSyncTime(config.syncInterval),
      });
      
      console.log(`EHR sync configured for hospital: ${hospitalSystemId}`);
    } catch (error) {
      console.error('Failed to configure EHR sync:', error);
      throw error;
    }
  }

  /**
   * Set up field mappings for hospital system
   */
  async setupFieldMapping(
    hospitalSystemId: string, 
    mapping: EHRMapping
  ): Promise<void> {
    try {
      this.mappings.set(hospitalSystemId, mapping);
      
      // Validate mapping
      this.validateFieldMapping(mapping);
      
      console.log(`Field mapping configured for hospital: ${hospitalSystemId}`);
    } catch (error) {
      console.error('Failed to setup field mapping:', error);
      throw error;
    }
  }

  /**
   * Perform full EHR synchronization for a patient
   */
  async syncPatientEHR(
    hospitalSystemId: string, 
    patientId: string
  ): Promise<HospitalApiResponse<PatientRecord>> {
    try {
      const config = this.syncConfigs.get(hospitalSystemId) || this.syncConfigs.get('default')!;
      const mapping = this.mappings.get(hospitalSystemId);
      
      this.updateSyncStatus(hospitalSystemId, 'in_progress');
      
      // Fetch patient data from hospital system
      const response = await fetch(`/api/hospital/patients/${patientId}?hospitalId=${hospitalSystemId}`);
      const hospitalData = await response.json();
      
      if (!hospitalData.success) {
        throw new Error(hospitalData.error?.message || 'Failed to fetch hospital data');
      }
      
      // Apply field mappings and transformations
      const mappedData = await this.applyDataMapping(hospitalData.data, mapping);
      
      // Validate and clean data
      const validatedData = await this.validateAndCleanData(mappedData, hospitalSystemId);
      
      // Apply clinical decision support
      const enrichedData = await this.applyClinicalDecisionSupport(validatedData);
      
      // Update sync status
      this.updateSyncStatus(hospitalSystemId, 'success', 1);
      
      return {
        success: true,
        data: enrichedData,
        metadata: {
          totalRecords: 1,
          page: 1,
          limit: 1,
          lastSyncTime: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.updateSyncStatus(hospitalSystemId, 'failed', 0, [{
        recordId: patientId,
        field: 'general',
        errorType: 'network',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
      
      return {
        success: false,
        error: {
          code: 'EHR_SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Perform incremental EHR sync (only changed records)
   */
  async performIncrementalSync(
    hospitalSystemId: string,
    lastSyncTime: string
  ): Promise<HospitalApiResponse<PatientRecord[]>> {
    try {
      const config = this.syncConfigs.get(hospitalSystemId);
      if (!config || !config.autoSync) {
        return {
          success: false,
          error: {
            code: 'SYNC_DISABLED',
            message: 'Auto-sync is disabled for this hospital system',
          },
        };
      }
      
      this.updateSyncStatus(hospitalSystemId, 'in_progress');
      
      // Fetch changed records since last sync
      const response = await fetch(
        `/api/hospital/patients/changes?hospitalId=${hospitalSystemId}&since=${lastSyncTime}`
      );
      const changes = await response.json();
      
      if (!changes.success || !changes.data) {
        return {
          success: false,
          error: {
            code: 'NO_CHANGES',
            message: 'No changes found or failed to fetch changes',
          },
        };
      }
      
      const syncedRecords: PatientRecord[] = [];
      let errorCount = 0;
      const errors: SyncError[] = [];
      
      // Process each changed record
      for (const change of changes.data) {
        try {
          const syncResult = await this.syncPatientEHR(hospitalSystemId, change.patientId);
          if (syncResult.success && syncResult.data) {
            syncedRecords.push(syncResult.data);
          } else {
            errorCount++;
            errors.push({
              recordId: change.patientId,
              field: 'general',
              errorType: 'validation',
              message: syncResult.error?.message || 'Unknown error',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          errorCount++;
          errors.push({
            recordId: change.patientId,
            field: 'general',
            errorType: 'network',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      const syncStatus = errorCount === 0 ? 'success' : 'partial';
      this.updateSyncStatus(hospitalSystemId, syncStatus, syncedRecords.length, errors);
      
      return {
        success: true,
        data: syncedRecords,
        metadata: {
          totalRecords: syncedRecords.length,
          page: 1,
          limit: syncedRecords.length,
          lastSyncTime: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.updateSyncStatus(hospitalSystemId, 'failed', 0, [{
        recordId: 'batch',
        field: 'general',
        errorType: 'network',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }]);
      
      return {
        success: false,
        error: {
          code: 'INCREMENTAL_SYNC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Apply data mapping and transformations
   */
  private async applyDataMapping(
    hospitalData: any, 
    mapping?: EHRMapping
  ): Promise<PatientRecord> {
    if (!mapping) {
      // Return data as-is if no mapping defined
      return hospitalData;
    }
    
    const mappedData: any = {};
    
    for (const fieldMapping of mapping.fieldMappings) {
      try {
        const value = this.extractFieldValue(hospitalData, fieldMapping.hospitalField);
        
        if (value !== undefined && value !== null) {
          // Apply data type conversion
          const convertedValue = this.convertDataType(value, fieldMapping.dataType);
          
          // Apply validation
          if (fieldMapping.validation) {
            this.validateFieldValue(convertedValue, fieldMapping.validation);
          }
          
          this.setFieldValue(mappedData, fieldMapping.systemField, convertedValue);
        } else if (fieldMapping.required) {
          throw new Error(`Required field ${fieldMapping.systemField} is missing`);
        }
      } catch (error) {
        console.error(`Mapping error for field ${fieldMapping.systemField}:`, error);
        throw error;
      }
    }
    
    // Apply data transformations
    for (const transformation of mapping.dataTransformations) {
      try {
        const sourceValue = this.extractFieldValue(mappedData, transformation.sourceField);
        const transformedValue = await this.applyTransformation(
          sourceValue, 
          transformation.transformFunction, 
          transformation.parameters
        );
        this.setFieldValue(mappedData, transformation.targetField, transformedValue);
      } catch (error) {
        console.error(`Transformation error for field ${transformation.targetField}:`, error);
      }
    }
    
    return mappedData;
  }

  /**
   * Apply clinical decision support rules
   */
  private async applyClinicalDecisionSupport(
    patientData: PatientRecord
  ): Promise<PatientRecord> {
    const enrichedData = { ...patientData };
    
    // Check drug interactions
    if (patientData.currentMedications?.length > 0) {
      enrichedData.clinicalAlerts = await this.checkDrugInteractions(patientData.currentMedications);
    }
    
    // Check allergies against medications
    if (patientData.allergies?.length > 0 && patientData.currentMedications?.length > 0) {
      const allergyAlerts = await this.checkAllergyConflicts(
        patientData.allergies, 
        patientData.currentMedications
      );
      enrichedData.clinicalAlerts = [...(enrichedData.clinicalAlerts || []), ...allergyAlerts];
    }
    
    // Validate vital signs ranges
    if (patientData.vitalSigns?.length > 0) {
      const vitalSignsAlerts = this.validateVitalSignsRanges(patientData.vitalSigns);
      enrichedData.clinicalAlerts = [...(enrichedData.clinicalAlerts || []), ...vitalSignsAlerts];
    }
    
    return enrichedData;
  }

  /**
   * Validate and clean patient data
   */
  private async validateAndCleanData(
    patientData: any, 
    hospitalSystemId: string
  ): Promise<PatientRecord> {
    // Implement data validation and cleaning logic
    const cleanedData = { ...patientData };
    
    // Validate required fields
    if (!cleanedData.patientId) {
      throw new Error('Patient ID is required');
    }
    
    if (!cleanedData.demographics?.name) {
      throw new Error('Patient name is required');
    }
    
    // Clean and validate dates
    if (cleanedData.demographics?.dateOfBirth) {
      cleanedData.demographics.dateOfBirth = this.validateAndFormatDate(
        cleanedData.demographics.dateOfBirth
      );
    }
    
    // Clean medication data
    if (cleanedData.currentMedications) {
      cleanedData.currentMedications = cleanedData.currentMedications.map((med: any) => ({
        ...med,
        startDate: this.validateAndFormatDate(med.startDate),
        endDate: med.endDate ? this.validateAndFormatDate(med.endDate) : undefined,
      }));
    }
    
    // Add metadata
    cleanedData.lastUpdated = new Date().toISOString();
    cleanedData.hospitalId = hospitalSystemId;
    
    return cleanedData;
  }

  // Helper methods
  private extractFieldValue(data: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private setFieldValue(data: any, fieldPath: string, value: any): void {
    const keys = fieldPath.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, data);
    target[lastKey] = value;
  }

  private convertDataType(value: any, dataType: string): any {
    switch (dataType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'date':
        return new Date(value).toISOString();
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  private validateFieldValue(value: any, rules: ValidationRule[]): void {
    for (const rule of rules) {
      switch (rule.type) {
        case 'regex':
          if (typeof value === 'string' && !new RegExp(rule.rule as string).test(value)) {
            throw new Error(rule.errorMessage);
          }
          break;
        case 'range':
          if (typeof value === 'number') {
            const [min, max] = rule.rule as number[];
            if (value < min || value > max) {
              throw new Error(rule.errorMessage);
            }
          }
          break;
        case 'enum':
          if (!(rule.rule as string[]).includes(value)) {
            throw new Error(rule.errorMessage);
          }
          break;
      }
    }
  }

  private async applyTransformation(
    value: any, 
    functionName: string, 
    parameters?: Record<string, any>
  ): Promise<any> {
    // Implement transformation functions
    switch (functionName) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'dateFormat':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }

  private validateAndFormatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return date.toISOString();
  }

  private async checkDrugInteractions(medications: Medication[]): Promise<any[]> {
    // Mock implementation - in real system, integrate with drug interaction API
    return [];
  }

  private async checkAllergyConflicts(allergies: any[], medications: Medication[]): Promise<any[]> {
    // Mock implementation - check medication ingredients against known allergies
    return [];
  }

  private validateVitalSignsRanges(vitalSigns: VitalSignEntry[]): any[] {
    // Mock implementation - validate vital signs against normal ranges
    return [];
  }

  private updateSyncStatus(
    hospitalSystemId: string, 
    status: 'success' | 'partial' | 'failed' | 'in_progress',
    recordsProcessed: number = 0,
    errors: SyncError[] = []
  ): void {
    const currentStatus = this.syncStatuses.get(hospitalSystemId);
    if (currentStatus) {
      currentStatus.syncStatus = status;
      currentStatus.recordsProcessed += recordsProcessed;
      currentStatus.errorCount += errors.length;
      currentStatus.errors.push(...errors);
      currentStatus.lastSyncTimestamp = new Date().toISOString();
      
      if (status !== 'in_progress') {
        const config = this.syncConfigs.get(hospitalSystemId) || this.syncConfigs.get('default')!;
        currentStatus.nextSyncTime = this.calculateNextSyncTime(config.syncInterval);
      }
    }
  }

  private calculateNextSyncTime(intervalMinutes: number): string {
    const nextSync = new Date();
    nextSync.setMinutes(nextSync.getMinutes() + intervalMinutes);
    return nextSync.toISOString();
  }

  private validateFieldMapping(mapping: EHRMapping): void {
    // Validate that all required fields are mapped
    const requiredSystemFields = [
      'patientId', 
      'demographics.name', 
      'demographics.dateOfBirth'
    ];
    
    for (const requiredField of requiredSystemFields) {
      const hasMapping = mapping.fieldMappings.some(
        fm => fm.systemField === requiredField && fm.required
      );
      if (!hasMapping) {
        throw new Error(`Required field mapping missing: ${requiredField}`);
      }
    }
  }

  /**
   * Get sync status for a hospital system
   */
  getSyncStatus(hospitalSystemId: string): EHRSyncStatus | undefined {
    return this.syncStatuses.get(hospitalSystemId);
  }

  /**
   * Get sync configuration for a hospital system
   */
  getSyncConfig(hospitalSystemId: string): EHRSyncConfig | undefined {
    return this.syncConfigs.get(hospitalSystemId) || this.syncConfigs.get('default');
  }
}

// Export singleton instance
export const ehrIntegrationEngine = new EHRIntegrationEngine();