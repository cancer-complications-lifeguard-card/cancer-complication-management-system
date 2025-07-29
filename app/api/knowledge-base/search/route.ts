import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  searchAllKnowledgeContent,
  getKnowledgeBaseStats,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const globalSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      // Return knowledge base statistics
      const stats = await getKnowledgeBaseStats();
      
      await logUserActivity({
        userId: user.id,
        action: 'view_knowledge_base_stats',
        resource: 'knowledge_base',
        details: { stats }
      });

      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const { query: searchQuery, limit } = globalSearchSchema.parse(Object.fromEntries(searchParams));
    
    const results = await searchAllKnowledgeContent(searchQuery, limit);

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'all',
      contentId: null,
      interactionType: 'global_search',
      searchQuery,
      metadata: JSON.stringify({ 
        resultCounts: {
          guidelines: results.guidelines.length,
          drugInteractions: results.drugInteractions.length,
          clinicalTrials: results.clinicalTrials.length,
          articles: results.articles.length
        }
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'global_knowledge_search',
      resource: 'knowledge_base',
      details: { query: searchQuery, limit }
    });

    const totalResults = 
      results.guidelines.length + 
      results.drugInteractions.length + 
      results.clinicalTrials.length + 
      results.articles.length;

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        query: searchQuery,
        totalResults,
        resultCounts: {
          guidelines: results.guidelines.length,
          drugInteractions: results.drugInteractions.length,
          clinicalTrials: results.clinicalTrials.length,
          articles: results.articles.length
        }
      }
    });

  } catch (error) {
    console.error('Error in global knowledge search:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}