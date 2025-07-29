import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  getKnowledgeArticleById,
  incrementArticleViewCount,
  rateArticle,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const ratingSchema = z.object({
  rating: z.number().min(1).max(5)
});

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
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await getKnowledgeArticleById(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment view count
    await incrementArticleViewCount(id);

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'knowledge_article',
      contentId: article.id,
      interactionType: 'view',
      searchQuery: null,
      metadata: JSON.stringify({ 
        title: article.title,
        category: article.category,
        targetAudience: article.targetAudience
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'view_knowledge_article',
      resource: 'knowledge_articles',
      resourceId: article.id.toString(),
      details: { title: article.title }
    });

    return NextResponse.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching knowledge article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge article' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rating } = ratingSchema.parse(body);

    await rateArticle(id, rating);

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'knowledge_article',
      contentId: id,
      interactionType: 'rating',
      searchQuery: null,
      metadata: JSON.stringify({ rating })
    });

    await logUserActivity({
      userId: user.id,
      action: 'rate_knowledge_article',
      resource: 'knowledge_articles',
      resourceId: id.toString(),
      details: { rating }
    });

    return NextResponse.json({
      success: true,
      message: 'Article rated successfully'
    });

  } catch (error) {
    console.error('Error rating knowledge article:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid rating data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to rate article' },
      { status: 500 }
    );
  }
}