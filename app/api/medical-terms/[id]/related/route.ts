import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getRelatedTerms, getMedicalTermById, logKnowledgeInteraction } from '@/lib/db/knowledge-queries';
import { InteractionType } from '@/lib/db/schema';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const termId = parseInt(params.id);
    if (isNaN(termId)) {
      return NextResponse.json(
        { error: 'Invalid term ID' },
        { status: 400 }
      );
    }

    // Check if term exists
    const term = await getMedicalTermById(termId);
    if (!term) {
      return NextResponse.json(
        { error: 'Term not found' },
        { status: 404 }
      );
    }

    const relatedTerms = await getRelatedTerms(termId);

    // Log the related terms lookup
    await logKnowledgeInteraction({
      userId: user.id,
      interactionType: InteractionType.TERM_LOOKUP,
      resourceType: 'medical_term',
      resourceId: termId,
      query: `related_terms:${term.term}`,
      metadata: {
        termId,
        termName: term.term,
        relatedCount: relatedTerms.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      relatedTerms,
      term
    });
  } catch (error) {
    console.error('Error fetching related terms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}