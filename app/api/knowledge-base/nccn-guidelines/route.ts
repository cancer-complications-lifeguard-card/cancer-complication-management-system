import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  searchNCCNGuidelines, 
  getNCCNGuidelinesByCategory,
  createNCCNGuideline,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const searchParamsSchema = z.object({
  query: z.string().optional(),
  cancerType: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const createGuidelineSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  cancerType: z.string().min(1),
  category: z.string().min(1),
  version: z.string().min(1),
  effectiveDate: z.string().transform(str => new Date(str)),
  content: z.string().min(1),
  keywords: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  lastReviewDate: z.string().transform(str => new Date(str)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams));

    let guidelines;
    if (params.cancerType && !params.query) {
      guidelines = await getNCCNGuidelinesByCategory(params.cancerType, params.category);
    } else {
      guidelines = await searchNCCNGuidelines(params);
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'nccn_guideline',
      contentId: null,
      interactionType: 'search',
      searchQuery: params.query || null,
      metadata: JSON.stringify({ 
        cancerType: params.cancerType, 
        category: params.category 
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'knowledge_base_search',
      resource: 'nccn_guidelines',
      details: { searchParams: params }
    });

    return NextResponse.json({
      success: true,
      data: guidelines,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: guidelines.length
      }
    });

  } catch (error) {
    console.error('Error searching NCCN guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to search guidelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'clinician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const guidelineData = createGuidelineSchema.parse(body);

    const newGuideline = await createNCCNGuideline({
      ...guidelineData,
      createdBy: user.id,
      lastUpdatedBy: user.id,
      isActive: true
    });

    await logUserActivity({
      userId: user.id,
      action: 'create_nccn_guideline',
      resource: 'nccn_guidelines',
      resourceId: newGuideline.id.toString(),
      details: { title: newGuideline.title, cancerType: newGuideline.cancerType }
    });

    return NextResponse.json({
      success: true,
      data: newGuideline
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating NCCN guideline:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create guideline' },
      { status: 500 }
    );
  }
}