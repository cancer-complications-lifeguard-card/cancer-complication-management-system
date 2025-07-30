import { NextRequest, NextResponse } from 'next/server';
import { hospitalManager } from '@/lib/hospital-integration/hospital-api-client';
import { HospitalSystem } from '@/lib/hospital-integration/types';

// Mock hospital systems for demonstration
const mockHospitalSystems: HospitalSystem[] = [
  {
    id: 'hospital-001',
    name: '北京协和医院',
    type: 'his',
    endpoint: 'https://api.pumch.cn',
    apiVersion: 'v1',
    authConfig: {
      type: 'bearer',
      credentials: {
        token: 'mock-token-pumch'
      }
    },
    isActive: true,
    lastSyncTime: '2024-01-15T10:30:00Z',
    supportedFeatures: [
      {
        feature: 'patient_lookup',
        endpoint: '/api/patients/{id}',
        method: 'GET'
      },
      {
        feature: 'medical_records',
        endpoint: '/api/patients/{id}/records',
        method: 'GET'
      },
      {
        feature: 'lab_results',
        endpoint: '/api/patients/{id}/labs',
        method: 'GET'
      },
      {
        feature: 'prescriptions',
        endpoint: '/api/patients/{id}/prescriptions',
        method: 'GET'
      }
    ]
  },
  {
    id: 'hospital-002',
    name: '上海交通大学医学院附属仁济医院',
    type: 'ehr',
    endpoint: 'https://ehr.renji.com',
    apiVersion: 'v2',
    authConfig: {
      type: 'oauth2',
      credentials: {
        accessToken: 'mock-oauth-token-renji',
        refreshToken: 'mock-refresh-token'
      }
    },
    isActive: true,
    lastSyncTime: '2024-01-15T09:45:00Z',
    supportedFeatures: [
      {
        feature: 'patient_lookup',
        endpoint: '/fhir/Patient/{id}',
        method: 'GET'
      },
      {
        feature: 'medical_records',
        endpoint: '/fhir/Condition',
        method: 'GET',
        params: {
          patient: '{patientId}'
        }
      },
      {
        feature: 'lab_results',
        endpoint: '/fhir/Observation',
        method: 'GET',
        params: {
          patient: '{patientId}',
          category: 'laboratory'
        }
      },
      {
        feature: 'imaging',
        endpoint: '/fhir/ImagingStudy',
        method: 'GET',
        params: {
          patient: '{patientId}'
        }
      }
    ]
  },
  {
    id: 'hospital-003',
    name: '广东省人民医院',
    type: 'his',
    endpoint: 'https://api.gdph.org.cn',
    apiVersion: 'v1',
    authConfig: {
      type: 'apikey',
      credentials: {
        apikey: 'mock-api-key-gdph'
      }
    },
    isActive: false,
    supportedFeatures: [
      {
        feature: 'patient_lookup',
        endpoint: '/api/v1/patients/search',
        method: 'POST'
      },
      {
        feature: 'appointments',
        endpoint: '/api/v1/appointments',
        method: 'GET'
      }
    ]
  },
  {
    id: 'hospital-004',
    name: '四川大学华西医院',
    type: 'ehr',
    endpoint: 'https://fhir.wchscu.cn',
    apiVersion: 'R4',
    authConfig: {
      type: 'basic',
      credentials: {
        username: 'api-user',
        password: 'mock-password'
      }
    },
    isActive: true,
    lastSyncTime: '2024-01-15T08:20:00Z',
    supportedFeatures: [
      {
        feature: 'patient_lookup',
        endpoint: '/fhir/Patient',
        method: 'GET'
      },
      {
        feature: 'medical_records',
        endpoint: '/fhir/DiagnosticReport',
        method: 'GET'
      },
      {
        feature: 'lab_results',
        endpoint: '/fhir/Observation',
        method: 'GET'
      },
      {
        feature: 'prescriptions',
        endpoint: '/fhir/MedicationRequest',
        method: 'GET'
      }
    ]
  }
];

// Get all hospital systems
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    let systems = mockHospitalSystems;
    
    // Filter by active status if specified
    if (active === 'true') {
      systems = systems.filter(system => system.isActive);
    } else if (active === 'false') {
      systems = systems.filter(system => !system.isActive);
    }

    return NextResponse.json({
      success: true,
      data: systems,
      metadata: {
        total: systems.length,
        active: systems.filter(s => s.isActive).length,
        inactive: systems.filter(s => !s.isActive).length
      }
    });
  } catch (error) {
    console.error('Error fetching hospital systems:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch hospital systems',
          details: error
        }
      },
      { status: 500 }
    );
  }
}

// Add a new hospital system
export async function POST(request: NextRequest) {
  try {
    const hospitalSystem: HospitalSystem = await request.json();
    
    // Validate required fields
    if (!hospitalSystem.name || !hospitalSystem.endpoint || !hospitalSystem.authConfig) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: name, endpoint, or authConfig'
          }
        },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!hospitalSystem.id) {
      hospitalSystem.id = `hospital-${Date.now()}`;
    }

    // Test connection to the hospital system
    const connected = await hospitalManager.connectHospital(hospitalSystem);
    
    if (!connected) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: 'Failed to establish connection with hospital system'
          }
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would save this to a database
    mockHospitalSystems.push(hospitalSystem);

    return NextResponse.json({
      success: true,
      data: hospitalSystem,
      message: 'Hospital system added successfully'
    });
  } catch (error) {
    console.error('Error adding hospital system:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ADD_ERROR',
          message: 'Failed to add hospital system',
          details: error
        }
      },
      { status: 500 }
    );
  }
}