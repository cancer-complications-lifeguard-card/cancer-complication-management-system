import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getMedicalTermsByCategory, logKnowledgeInteraction } from '@/lib/db/knowledge-queries';
import { TermCategory, InteractionType } from '@/lib/db/schema';

interface Params {
  category: string;
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

    const { category } = params;

    if (!Object.values(TermCategory).includes(category as TermCategory)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const terms = await getMedicalTermsByCategory(category as TermCategory);

    // Log the category browse interaction
    await logKnowledgeInteraction({
      userId: user.id,
      interactionType: InteractionType.TERM_LOOKUP,
      resourceType: 'medical_term',
      resourceId: 0,
      query: `category:${category}`,
      metadata: {
        category,
        resultCount: terms.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      terms,
      category
    });
  } catch (error) {
    console.error('Error fetching terms by category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}