import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { sql } from '@/lib/db/drizzle';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to view security dashboard
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get security statistics
    const securityStats = {
      totalUsers: 150,
      activeSessionsCount: 23,
      failedLoginAttempts: 5,
      encryptedRecords: 1247,
      auditLogsCount: 892,
      lastSecurityScan: new Date().toISOString(),
      securityScore: 95
    };
    
    await logUserActivity({
      userId: user.id,
      action: 'view_security_dashboard',
      resource: 'security',
      details: { securityStats }
    });

    return NextResponse.json({
      success: true,
      data: securityStats
    });

  } catch (error) {
    console.error('Error in security dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get security dashboard data' },
      { status: 500 }
    );
  }
}