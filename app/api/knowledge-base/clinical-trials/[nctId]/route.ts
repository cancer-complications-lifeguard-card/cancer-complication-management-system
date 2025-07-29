import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  getClinicalTrialByNctId,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { nctId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nctId } = params;
    if (!nctId) {
      return NextResponse.json({ error: 'NCT ID is required' }, { status: 400 });
    }

    const trial = await getClinicalTrialByNctId(nctId);
    if (!trial) {
      return NextResponse.json({ error: 'Clinical trial not found' }, { status: 404 });
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'clinical_trial',
      contentId: trial.id,
      interactionType: 'view',
      searchQuery: null,
      metadata: JSON.stringify({ 
        nctId: trial.nctId,
        title: trial.title,
        cancerTypes: trial.cancerTypes,
        phase: trial.phase
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'view_clinical_trial',
      resource: 'clinical_trials',
      resourceId: trial.id.toString(),
      details: { nctId: trial.nctId, title: trial.title }
    });

    return NextResponse.json({
      success: true,
      data: trial
    });

  } catch (error) {
    console.error('Error fetching clinical trial:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical trial' },
      { status: 500 }
    );
  }
}