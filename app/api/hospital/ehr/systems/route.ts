import { NextRequest, NextResponse } from 'next/server';

interface EHRSystem {
  id: string;
  name: string;
  type: 'epic' | 'cerner' | 'allscripts' | 'meditech' | 'custom';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  recordsCount: number;
  errorCount: number;
  syncProgress: number;
}

// Mock EHR systems data
const mockEHRSystems: EHRSystem[] = [
  {
    id: 'ehr-001',
    name: '北京协和医院 Epic EHR',
    type: 'epic',
    status: 'connected',
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    recordsCount: 15420,
    errorCount: 2,
    syncProgress: 100,
  },
  {
    id: 'ehr-002',
    name: '上海华山医院 Cerner EHR',
    type: 'cerner',
    status: 'syncing',
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    recordsCount: 8930,
    errorCount: 0,
    syncProgress: 75,
  },
  {
    id: 'ehr-003',
    name: '广州中山医院 自建EHR',
    type: 'custom',
    status: 'connected',
    lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    recordsCount: 12100,
    errorCount: 1,
    syncProgress: 100,
  },
  {
    id: 'ehr-004',
    name: '深圳人民医院 Allscripts EHR',
    type: 'allscripts',
    status: 'error',
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    recordsCount: 6780,
    errorCount: 15,
    syncProgress: 0,
  },
];

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Authenticate the request
    // 2. Get user's accessible EHR systems from database
    // 3. Check real-time status from each EHR system
    // 4. Return the actual data

    return NextResponse.json({
      success: true,
      data: mockEHRSystems,
      metadata: {
        totalSystems: mockEHRSystems.length,
        connectedSystems: mockEHRSystems.filter(s => s.status === 'connected').length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch EHR systems:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EHR_SYSTEMS_FETCH_FAILED',
          message: 'Failed to fetch EHR systems',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, endpoint, authConfig } = body;

    // Validate required fields
    if (!name || !type || !endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name, type, and endpoint are required',
          },
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Validate the EHR system connection
    // 2. Store the configuration in the database
    // 3. Initialize the sync configuration
    // 4. Return the created system

    const newSystem: EHRSystem = {
      id: `ehr-${Date.now()}`,
      name,
      type,
      status: 'disconnected',
      lastSync: new Date().toISOString(),
      recordsCount: 0,
      errorCount: 0,
      syncProgress: 0,
    };

    return NextResponse.json({
      success: true,
      data: newSystem,
      message: 'EHR system configuration created successfully',
    });
  } catch (error) {
    console.error('Failed to create EHR system:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EHR_SYSTEM_CREATE_FAILED',
          message: 'Failed to create EHR system configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}