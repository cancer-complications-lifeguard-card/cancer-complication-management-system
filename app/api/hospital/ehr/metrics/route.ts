import { NextRequest, NextResponse } from 'next/server';

interface SyncMetrics {
  totalPatients: number;
  syncedToday: number;
  failedToday: number;
  averageSyncTime: number;
  uptime: number;
  systemMetrics: SystemMetric[];
}

interface SystemMetric {
  systemId: string;
  systemName: string;
  patientsCount: number;
  successRate: number;
  lastSyncDuration: number;
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Query the database for actual sync metrics
    // 2. Calculate real-time statistics
    // 3. Aggregate data from different EHR systems
    // 4. Return the computed metrics

    // Mock metrics data
    const metrics: SyncMetrics = {
      totalPatients: 43230,
      syncedToday: 1247,
      failedToday: 18,
      averageSyncTime: 2.3,
      uptime: 99.7,
      systemMetrics: [
        {
          systemId: 'ehr-001',
          systemName: '北京协和医院 Epic EHR',
          patientsCount: 15420,
          successRate: 98.5,
          lastSyncDuration: 1.8,
        },
        {
          systemId: 'ehr-002',
          systemName: '上海华山医院 Cerner EHR',
          patientsCount: 8930,
          successRate: 99.2,
          lastSyncDuration: 2.1,
        },
        {
          systemId: 'ehr-003',
          systemName: '广州中山医院 自建EHR',
          patientsCount: 12100,
          successRate: 97.8,
          lastSyncDuration: 3.2,
        },
        {
          systemId: 'ehr-004',
          systemName: '深圳人民医院 Allscripts EHR',
          patientsCount: 6780,
          successRate: 85.4,
          lastSyncDuration: 4.5,
        },
      ],
    };

    // Calculate additional derived metrics
    const totalSyncedRecords = metrics.systemMetrics.reduce(
      (total, system) => total + system.patientsCount,
      0
    );
    const averageSuccessRate = metrics.systemMetrics.reduce(
      (sum, system) => sum + system.successRate,
      0
    ) / metrics.systemMetrics.length;

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        totalSyncedRecords,
        averageSuccessRate: Math.round(averageSuccessRate * 10) / 10,
        lastUpdated: new Date().toISOString(),
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        metricsVersion: '2.0',
        period: '24h',
      },
    });
  } catch (error) {
    console.error('Failed to fetch EHR metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EHR_METRICS_FETCH_FAILED',
          message: 'Failed to fetch EHR synchronization metrics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}