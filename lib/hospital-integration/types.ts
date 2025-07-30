// Hospital System Integration Types

export interface HospitalSystem {
  id: string;
  name: string;
  type: 'his' | 'ehr' | 'pacs' | 'lis'; // Hospital Information System types
  endpoint: string;
  apiVersion: string;
  authConfig: {
    type: 'bearer' | 'basic' | 'oauth2' | 'apikey';
    credentials: Record<string, string>;
  };
  isActive: boolean;
  lastSyncTime?: string;
  supportedFeatures: HospitalFeature[];
}

export interface HospitalFeature {
  feature: 'patient_lookup' | 'medical_records' | 'lab_results' | 'imaging' | 'prescriptions' | 'appointments';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
}

export interface PatientRecord {
  hospitalId: string;
  patientId: string;
  hospitalPatientId: string;
  medicalRecordNumber: string;
  demographics: {
    name: string;
    dateOfBirth: string;
    gender: string;
    contact: {
      phone?: string;
      email?: string;
      address?: string;
    };
  };
  medicalHistory: MedicalHistoryEntry[];
  currentMedications: Medication[];
  allergies: Allergy[];
  vitalSigns: VitalSignEntry[];
  labResults: LabResult[];
  imagingStudies: ImagingStudy[];
  lastUpdated: string;
}

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  diagnosis: string;
  icd10Code: string;
  description?: string;
  status: 'active' | 'resolved' | 'chronic';
  physician: string;
  department: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribingPhysician: string;
  instructions?: string;
  status: 'active' | 'discontinued' | 'completed';
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetDate?: string;
  notes?: string;
}

export interface VitalSignEntry {
  id: string;
  timestamp: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
  location: string;
}

export interface LabResult {
  id: string;
  testDate: string;
  testName: string;
  testCode: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: 'preliminary' | 'final' | 'corrected';
  abnormalFlag?: 'high' | 'low' | 'critical';
  orderingPhysician: string;
  lab: string;
}

export interface ImagingStudy {
  id: string;
  studyDate: string;
  modality: string; // CT, MRI, X-Ray, etc.
  studyDescription: string;
  bodyPart: string;
  findings?: string;
  impression?: string;
  radiologist: string;
  images: ImageFile[];
}

export interface ImageFile {
  id: string;
  url: string;
  thumbnailUrl?: string;
  format: string;
  size: number;
  description?: string;
}

export interface HospitalApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    totalRecords: number;
    page: number;
    limit: number;
    lastSyncTime: string;
  };
}

export interface SyncJob {
  id: string;
  hospitalId: string;
  patientId: string;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  errors: string[];
  progress: number; // 0-100
}

// HL7 FHIR Resource Types
export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier: {
    use?: string;
    system?: string;
    value: string;
  }[];
  active?: boolean;
  name: {
    use?: string;
    family: string;
    given: string[];
  }[];
  telecom?: {
    system: 'phone' | 'email';
    value: string;
    use?: string;
  }[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: {
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }[];
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  code: {
    coding: {
      system: string;
      code: string;
      display: string;
    }[];
  };
  subject: {
    reference: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  component?: {
    code: {
      coding: {
        system: string;
        code: string;
        display: string;
      }[];
    };
    valueQuantity: {
      value: number;
      unit: string;
    };
  }[];
}