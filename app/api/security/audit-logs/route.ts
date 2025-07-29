import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserAuditLogs, getSecurityEventStats } from '@/lib/security/audit-logger';
import { hasPermission, Permission } from '@/lib/security/access-control';
import { UserRole, UserStage } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查查看审计日志权限
    if (!hasPermission(session.userRole as UserRole, session.userStage as UserStage, Permission.VIEW_AUDIT_LOGS)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logs';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (type === 'stats') {
      const stats = await getSecurityEventStats();
      return NextResponse.json(stats);
    } else {
      const logs = await getUserAuditLogs(session.userId, limit, offset);
      return NextResponse.json(logs);
    }

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}