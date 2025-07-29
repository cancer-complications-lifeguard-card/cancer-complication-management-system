import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  getNCCNGuidelineById,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid guideline ID' }, { status: 400 });
    }

    const guideline = await getNCCNGuidelineById(id);
    if (!guideline) {
      return NextResponse.json({ error: 'Guideline not found' }, { status: 404 });
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'nccn_guideline',
      contentId: guideline.id,
      interactionType: 'view',
      searchQuery: null,
      metadata: JSON.stringify({ 
        title: guideline.title,
        cancerType: guideline.cancerType 
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'view_nccn_guideline',
      resource: 'nccn_guidelines',
      resourceId: guideline.id.toString(),
      details: { title: guideline.title }
    });

    return NextResponse.json({
      success: true,
      data: guideline
    });

  } catch (error) {
    console.error('Error fetching NCCN guideline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guideline' },
      { status: 500 }
    );
  }
}