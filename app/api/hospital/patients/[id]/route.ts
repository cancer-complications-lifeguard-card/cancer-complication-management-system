import { NextRequest, NextResponse } from 'next/server';
import { hospitalManager } from '@/lib/hospital-integration/hospital-api-client';
import { PatientRecord } from '@/lib/hospital-integration/types';

// Mock patient data for demonstration
const mockPatientRecords: { [key: string]: PatientRecord } = {
  'MRN001234': {
    hospitalId: 'hospital-001',
    patientId: 'patient-001',
    hospitalPatientId: 'MRN001234',
    medicalRecordNumber: 'MRN001234',
    demographics: {
      name: '张三',
      dateOfBirth: '1975-06-15',
      gender: '男',
      contact: {
        phone: '13800138001',
        email: 'zhangsan@example.com',
        address: '北京市朝阳区建国门外大街1号'
      }
    },
    medicalHistory: [
      {
        id: 'diag-001',
        date: '2023-12-01',
        diagnosis: '非小细胞肺癌',
        icd10Code: 'C78.00',
        description: 'T2N0M0期肺腺癌',
        status: 'active',
        physician: '李医生',
        department: '肿瘤科'
      },
      {
        id: 'diag-002',
        date: '2023-11-15',
        diagnosis: '高血压',
        icd10Code: 'I10',
        description: '原发性高血压',
        status: 'chronic',
        physician: '王医生',
        department: '心血管内科'
      }
    ],
    currentMedications: [
      {
        id: 'med-001',
        name: '卡培他滨片',
        genericName: 'Capecitabine',
        dosage: '500mg',
        frequency: '每日两次',
        route: '口服',
        startDate: '2023-12-05',
        prescribingPhysician: '李医生',
        instructions: '饭后30分钟服用',
        status: 'active'
      },
      {
        id: 'med-002',
        name: '氨氯地平片',
        genericName: 'Amlodipine',
        dosage: '5mg',
        frequency: '每日一次',
        route: '口服',
        startDate: '2023-11-20',
        prescribingPhysician: '王医生',
        instructions: '晨起服用',
        status: 'active'
      }
    ],
    allergies: [
      {
        id: 'allergy-001',
        allergen: '青霉素',
        reaction: '皮疹',
        severity: 'moderate',
        onsetDate: '2010-03-15',
        notes: '注射青霉素后出现全身皮疹'
      }
    ],
    vitalSigns: [
      {
        id: 'vital-001',
        timestamp: '2024-01-15T09:30:00Z',
        bloodPressure: {
          systolic: 135,
          diastolic: 85
        },
        heartRate: 78,
        temperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        weight: 70.5,
        height: 175,
        recordedBy: '护士小李',
        location: '门诊'
      }
    ],
    labResults: [
      {
        id: 'lab-001',
        testDate: '2024-01-10',
        testName: '肿瘤标志物',
        testCode: 'CEA',
        result: '8.5',
        unit: 'ng/mL',
        referenceRange: '0-5',
        status: 'final',
        abnormalFlag: 'high',
        orderingPhysician: '李医生',
        lab: '临床检验科'
      },
      {
        id: 'lab-002',
        testDate: '2024-01-10',
        testName: '血常规',
        testCode: 'CBC',
        result: '正常',
        status: 'final',
        orderingPhysician: '李医生',
        lab: '临床检验科'
      }
    ],
    imagingStudies: [
      {
        id: 'imaging-001',
        studyDate: '2024-01-08',
        modality: 'CT',
        studyDescription: '胸部CT平扫+增强',
        bodyPart: '胸部',
        findings: '右肺上叶见结节影，边界清楚，密度均匀',
        impression: '右肺上叶结节，考虑恶性可能',
        radiologist: '影像科张医生',
        images: [
          {
            id: 'img-001',
            url: '/api/hospital/images/chest-ct-001',
            thumbnailUrl: '/api/hospital/images/thumbnails/chest-ct-001',
            format: 'DICOM',
            size: 25600000,
            description: '胸部CT轴位图像'
          }
        ]
      }
    ],
    lastUpdated: '2024-01-15T10:30:00Z'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital');
    
    // If hospital ID is specified, try to fetch from specific hospital
    if (hospitalId) {
      const client = hospitalManager.getHospitalClient(hospitalId);
      if (!client) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'HOSPITAL_NOT_CONNECTED',
              message: `Hospital ${hospitalId} is not connected`
            }
          },
          { status: 400 }
        );
      }

      const response = await client.lookupPatient(id);
      return NextResponse.json(response);
    }

    // Check if patient exists in mock data
    const patient = mockPatientRecords[id];
    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: `Patient with ID ${id} not found`
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
      metadata: {
        source: 'mock-hospital-system',
        lastUpdated: patient.lastUpdated,
        dataVersion: '1.0'
      }
    });

  } catch (error) {
    console.error('Error fetching patient record:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch patient record',
          details: error
        }
      },
      { status: 500 }
    );
  }
}

// Search patients across multiple hospitals
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { hospitalIds, criteria } = await request.json();
    
    if (!hospitalIds || !Array.isArray(hospitalIds)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'hospitalIds must be provided as an array'
          }
        },
        { status: 400 }
      );
    }

    // Sync patient data from multiple hospitals
    const results = await hospitalManager.syncPatientData(params.id, hospitalIds);
    
    const successfulSyncs = Object.entries(results)
      .filter(([_, data]) => data !== null)
      .map(([hospitalId, data]) => ({
        hospitalId,
        data,
        syncTime: new Date().toISOString()
      }));

    const failedSyncs = Object.entries(results)
      .filter(([_, data]) => data === null)
      .map(([hospitalId]) => hospitalId);

    return NextResponse.json({
      success: true,
      data: {
        patientId: params.id,
        successfulSyncs,
        failedSyncs,
        totalHospitals: hospitalIds.length,
        syncedHospitals: successfulSyncs.length
      },
      metadata: {
        syncTime: new Date().toISOString(),
        requestedHospitals: hospitalIds
      }
    });

  } catch (error) {
    console.error('Error syncing patient data:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: 'Failed to sync patient data',
          details: error
        }
      },
      { status: 500 }
    );
  }
}