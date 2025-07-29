import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  getUserKnowledgeHistory,
  getUserBookmarks,
  getPopularContent,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const historyParamsSchema = z.object({
  contentType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  bookmarks: z.string().optional().transform(str => str === 'true'),
  popular: z.string().optional(),
});

const bookmarkSchema = z.object({
  contentType: z.enum(['nccn_guideline', 'drug_interaction', 'clinical_trial', 'knowledge_article']),
  contentId: z.number().min(1),
  metadata: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = historyParamsSchema.parse(Object.fromEntries(searchParams));

    let data;
    let interactionType = 'history';

    if (params.bookmarks) {
      // Get user bookmarks
      data = await getUserBookmarks(user.id);
      interactionType = 'bookmarks';
    } else if (params.popular) {
      // Get popular content
      data = await getPopularContent(params.popular, params.limit);
      interactionType = 'popular';
    } else {
      // Get user knowledge history
      data = await getUserKnowledgeHistory(user.id, params.contentType, params.limit);
    }

    await logUserActivity({
      userId: user.id,
      action: `view_knowledge_${interactionType}`,
      resource: 'knowledge_interactions',
      details: { 
        contentType: params.contentType,
        limit: params.limit,
        resultCount: data.length
      }
    });

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        interactionType,
        count: data.length
      }
    });

  } catch (error) {
    console.error('Error fetching knowledge interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge interactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, metadata } = bookmarkSchema.parse(body);

    // Create bookmark interaction
    const interaction = await logKnowledgeInteraction({
      userId: user.id,
      contentType,
      contentId,
      interactionType: 'bookmark',
      searchQuery: null,
      metadata
    });

    await logUserActivity({
      userId: user.id,
      action: 'bookmark_knowledge_content',
      resource: 'knowledge_interactions',
      resourceId: interaction.id.toString(),
      details: { contentType, contentId }
    });

    return NextResponse.json({
      success: true,
      data: interaction,
      message: 'Content bookmarked successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bookmark:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid bookmark data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to bookmark content' },
      { status: 500 }
    );
  }
}