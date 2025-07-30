import { 
  HospitalSystem, 
  HospitalApiResponse, 
  PatientRecord, 
  FHIRPatient, 
  FHIRObservation, 
  SyncJob 
} from './types';

export class HospitalApiClient {
  private hospitalSystem: HospitalSystem;
  private baseHeaders: Record<string, string>;

  constructor(hospitalSystem: HospitalSystem) {
    this.hospitalSystem = hospitalSystem;
    this.baseHeaders = this.buildAuthHeaders();
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const { authConfig } = this.hospitalSystem;
    
    switch (authConfig.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${authConfig.credentials.token}`;
        break;
      case 'basic':
        const basicAuth = btoa(`${authConfig.credentials.username}:${authConfig.credentials.password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
      case 'apikey':
        headers['X-API-Key'] = authConfig.credentials.apikey;
        break;
      case 'oauth2':
        // OAuth2 implementation would require token management
        headers['Authorization'] = `Bearer ${authConfig.credentials.accessToken}`;
        break;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<HospitalApiResponse<T>> {
    try {
      const url = `${this.hospitalSystem.endpoint}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: this.baseHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || 'Hospital API request failed',
            details: data
          }
        };
      }

      return {
        success: true,
        data: data as T,
        metadata: {
          totalRecords: data.total || 1,
          page: data.page || 1,
          limit: data.limit || 50,
          lastSyncTime: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to hospital system',
          details: error
        }
      };
    }
  }

  // Patient lookup by medical record number
  async lookupPatient(medicalRecordNumber: string): Promise<HospitalApiResponse<PatientRecord>> {
    const endpoint = `/api/patients/${medicalRecordNumber}`;
    return this.makeRequest<PatientRecord>(endpoint);
  }

  // Search patients by criteria
  async searchPatients(criteria: {
    name?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
  }): Promise<HospitalApiResponse<PatientRecord[]>> {
    const params = new URLSearchParams();
    
    if (criteria.name) params.append('name', criteria.name);
    if (criteria.dateOfBirth) params.append('dob', criteria.dateOfBirth);
    if (criteria.phoneNumber) params.append('phone', criteria.phoneNumber);

    const endpoint = `/api/patients/search?${params.toString()}`;
    return this.makeRequest<PatientRecord[]>(endpoint);
  }

  // Get patient's medical records
  async getPatientRecords(hospitalPatientId: string): Promise<HospitalApiResponse<PatientRecord>> {
    const endpoint = `/api/patients/${hospitalPatientId}/records`;
    return this.makeRequest<PatientRecord>(endpoint);
  }

  // Get patient's lab results
  async getLabResults(hospitalPatientId: string, fromDate?: string): Promise<HospitalApiResponse<any[]>> {
    let endpoint = `/api/patients/${hospitalPatientId}/lab-results`;
    if (fromDate) {
      endpoint += `?from=${fromDate}`;
    }
    return this.makeRequest<any[]>(endpoint);
  }

  // Get patient's imaging studies
  async getImagingStudies(hospitalPatientId: string): Promise<HospitalApiResponse<any[]>> {
    const endpoint = `/api/patients/${hospitalPatientId}/imaging`;
    return this.makeRequest<any[]>(endpoint);
  }

  // Submit patient data (for bidirectional integration)
  async submitPatientData(patientData: Partial<PatientRecord>): Promise<HospitalApiResponse<any>> {
    const endpoint = `/api/patients`;
    return this.makeRequest<any>(endpoint, 'POST', patientData);
  }

  // FHIR-specific methods for FHIR-compliant systems
  async getFHIRPatient(patientId: string): Promise<HospitalApiResponse<FHIRPatient>> {
    const endpoint = `/fhir/Patient/${patientId}`;
    return this.makeRequest<FHIRPatient>(endpoint);
  }

  async getFHIRObservations(patientId: string, category?: string): Promise<HospitalApiResponse<FHIRObservation[]>> {
    let endpoint = `/fhir/Observation?patient=${patientId}`;
    if (category) {
      endpoint += `&category=${category}`;
    }
    return this.makeRequest<FHIRObservation[]>(endpoint);
  }

  // Test connection to hospital system
  async testConnection(): Promise<HospitalApiResponse<any>> {
    const endpoint = '/api/health';
    return this.makeRequest<any>(endpoint);
  }

  // Get system capabilities
  async getCapabilities(): Promise<HospitalApiResponse<any>> {
    const endpoint = '/api/metadata';
    return this.makeRequest<any>(endpoint);
  }
}

// Hospital System Manager
export class HospitalSystemManager {
  private connectedSystems: Map<string, HospitalApiClient> = new Map();

  async connectHospital(hospitalSystem: HospitalSystem): Promise<boolean> {
    try {
      const client = new HospitalApiClient(hospitalSystem);
      const testResult = await client.testConnection();
      
      if (testResult.success) {
        this.connectedSystems.set(hospitalSystem.id, client);
        return true;
      }
      
      console.error('Failed to connect to hospital:', testResult.error);
      return false;
    } catch (error) {
      console.error('Error connecting to hospital:', error);
      return false;
    }
  }

  getHospitalClient(hospitalId: string): HospitalApiClient | null {
    return this.connectedSystems.get(hospitalId) || null;
  }

  async disconnectHospital(hospitalId: string): Promise<void> {
    this.connectedSystems.delete(hospitalId);
  }

  getConnectedHospitals(): string[] {
    return Array.from(this.connectedSystems.keys());
  }

  // Sync patient data from multiple hospitals
  async syncPatientData(
    patientId: string, 
    hospitalIds: string[]
  ): Promise<{ [hospitalId: string]: PatientRecord | null }> {
    const results: { [hospitalId: string]: PatientRecord | null } = {};

    for (const hospitalId of hospitalIds) {
      const client = this.getHospitalClient(hospitalId);
      if (!client) {
        results[hospitalId] = null;
        continue;
      }

      try {
        const response = await client.lookupPatient(patientId);
        results[hospitalId] = response.success ? response.data || null : null;
      } catch (error) {
        console.error(`Error syncing from hospital ${hospitalId}:`, error);
        results[hospitalId] = null;
      }
    }

    return results;
  }
}

// Singleton instance
export const hospitalManager = new HospitalSystemManager();