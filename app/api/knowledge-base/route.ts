import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { getKnowledgeBaseStats } from '@/lib/db/knowledge-base-queries';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get knowledge base statistics
    const stats = await getKnowledgeBaseStats();
    
    await logUserActivity({
      userId: user.id,
      action: 'view_knowledge_base_overview',
      resource: 'knowledge_base',
      details: { stats }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in knowledge base overview:', error);
    return NextResponse.json(
      { error: 'Failed to get knowledge base overview' },
      { status: 500 }
    );
  }
}