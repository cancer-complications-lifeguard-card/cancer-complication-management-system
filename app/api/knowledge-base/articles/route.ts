import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  searchKnowledgeArticles,
  getFeaturedArticles,
  getPopularArticles,
  createKnowledgeArticle,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const searchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  cancerTypes: z.string().optional().transform(str => str ? str.split(',').map(s => s.trim()) : undefined),
  targetAudience: z.string().optional(),
  readingLevel: z.string().optional(),
  featured: z.string().optional().transform(str => str === 'true'),
  popular: z.string().optional().transform(str => str === 'true'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const createArticleSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  cancerTypes: z.string().optional(),
  targetAudience: z.enum(['patient', 'family', 'caregiver', 'healthcare_provider', 'all']),
  readingLevel: z.enum(['basic', 'intermediate', 'advanced']),
  keywords: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  references: z.string().optional(),
  relatedArticles: z.string().optional(),
  medicalReviewDate: z.string().transform(str => new Date(str)).optional(),
  nextReviewDate: z.string().transform(str => new Date(str)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams));

    let articles;
    let searchType = 'general';

    if (params.featured) {
      // Get featured articles
      articles = await getFeaturedArticles(params.limit);
      searchType = 'featured';
    } else if (params.popular) {
      // Get popular articles
      articles = await getPopularArticles(params.limit);
      searchType = 'popular';
    } else {
      // General search
      const searchParams = {
        query: params.query,
        category: params.category,
        subcategory: params.subcategory,
        cancerTypes: params.cancerTypes,
        targetAudience: params.targetAudience,
        readingLevel: params.readingLevel,
        limit: params.limit,
        offset: params.offset
      };
      articles = await searchKnowledgeArticles(searchParams);
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'knowledge_article',
      contentId: null,
      interactionType: 'search',
      searchQuery: params.query || null,
      metadata: JSON.stringify({ 
        searchType,
        category: params.category,
        subcategory: params.subcategory,
        cancerTypes: params.cancerTypes,
        targetAudience: params.targetAudience,
        readingLevel: params.readingLevel
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'knowledge_articles_search',
      resource: 'knowledge_articles',
      details: { searchParams: params, searchType }
    });

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: articles.length
      },
      metadata: {
        searchType
      }
    });

  } catch (error) {
    console.error('Error searching knowledge articles:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !['admin', 'clinician', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const articleData = createArticleSchema.parse(body);

    const newArticle = await createKnowledgeArticle({
      ...articleData,
      createdBy: user.id,
      lastUpdatedBy: user.id,
      viewCount: 0,
      rating: null,
      ratingCount: 0
    });

    await logUserActivity({
      userId: user.id,
      action: 'create_knowledge_article',
      resource: 'knowledge_articles',
      resourceId: newArticle.id.toString(),
      details: { 
        title: newArticle.title,
        category: newArticle.category,
        targetAudience: newArticle.targetAudience,
        readingLevel: newArticle.readingLevel
      }
    });

    return NextResponse.json({
      success: true,
      data: newArticle
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating knowledge article:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create knowledge article' },
      { status: 500 }
    );
  }
}