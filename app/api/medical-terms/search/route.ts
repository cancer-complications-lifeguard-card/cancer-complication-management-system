import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { searchMedicalTerms, logKnowledgeInteraction } from '@/lib/db/knowledge-queries';
import { TermCategory, InteractionType } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const validCategory = category && Object.values(TermCategory).includes(category as TermCategory) 
      ? category as TermCategory 
      : undefined;

    const terms = await searchMedicalTerms(query, validCategory);

    // Log the search interaction
    await logKnowledgeInteraction({
      userId: user.id,
      interactionType: InteractionType.SEARCH_QUERY,
      resourceType: 'medical_term',
      resourceId: 0,
      query,
      metadata: {
        category: validCategory,
        resultCount: terms.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      terms,
      totalResults: terms.length
    });
  } catch (error) {
    console.error('Error searching medical terms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}