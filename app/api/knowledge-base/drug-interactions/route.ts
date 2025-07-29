import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  checkDrugInteractions, 
  searchDrugInteractions,
  getDrugInteractionsBySeverity,
  createDrugInteraction,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const checkInteractionsSchema = z.object({
  drugs: z.array(z.string().min(1)).min(2, 'At least 2 drugs are required'),
});

const searchParamsSchema = z.object({
  drug: z.string().optional(),
  severity: z.string().optional(),
  check: z.string().optional(), // comma-separated drug names for interaction checking
});

const createInteractionSchema = z.object({
  drugA: z.string().min(1),
  drugB: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'major', 'contraindicated']),
  description: z.string().min(1),
  clinicalEffect: z.string().optional(),
  mechanism: z.string().optional(),
  management: z.string().optional(),
  references: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams));

    let interactions;
    let interactionType = 'search';

    if (params.check) {
      // Check drug interactions for multiple drugs
      const drugNames = params.check.split(',').map(d => d.trim()).filter(Boolean);
      if (drugNames.length < 2) {
        return NextResponse.json({ error: 'At least 2 drugs are required for interaction checking' }, { status: 400 });
      }
      interactions = await checkDrugInteractions(drugNames);
      interactionType = 'check';
    } else if (params.severity) {
      // Search by severity
      interactions = await getDrugInteractionsBySeverity(params.severity);
    } else if (params.drug) {
      // Search interactions for a specific drug
      interactions = await searchDrugInteractions(params.drug);
    } else {
      return NextResponse.json({ error: 'Please provide search parameters' }, { status: 400 });
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'drug_interaction',
      contentId: null,
      interactionType,
      searchQuery: params.drug || params.check || params.severity,
      metadata: JSON.stringify({ 
        searchType: interactionType,
        parameters: params 
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'drug_interaction_search',
      resource: 'drug_interactions',
      details: { searchParams: params, interactionType }
    });

    return NextResponse.json({
      success: true,
      data: interactions,
      metadata: {
        searchType: interactionType,
        resultCount: interactions.length
      }
    });

  } catch (error) {
    console.error('Error searching drug interactions:', error);
    return NextResponse.json(
      { error: 'Failed to search drug interactions' },
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
    
    // Handle bulk interaction checking
    if (body.drugs && Array.isArray(body.drugs)) {
      const { drugs } = checkInteractionsSchema.parse(body);
      const interactions = await checkDrugInteractions(drugs);

      await logKnowledgeInteraction({
        userId: user.id,
        contentType: 'drug_interaction',
        contentId: null,
        interactionType: 'check',
        searchQuery: drugs.join(', '),
        metadata: JSON.stringify({ drugs })
      });

      await logUserActivity({
        userId: user.id,
        action: 'check_drug_interactions',
        resource: 'drug_interactions',
        details: { drugs, resultCount: interactions.length }
      });

      return NextResponse.json({
        success: true,
        data: interactions,
        metadata: {
          drugs,
          interactionCount: interactions.length
        }
      });
    }

    // Handle creating new interaction
    const interactionData = createInteractionSchema.parse(body);
    const newInteraction = await createDrugInteraction({
      ...interactionData,
      createdBy: user.id,
      lastUpdatedBy: user.id,
      isActive: true
    });

    await logUserActivity({
      userId: user.id,
      action: 'create_drug_interaction',
      resource: 'drug_interactions',
      resourceId: newInteraction.id.toString(),
      details: { 
        drugA: newInteraction.drugA, 
        drugB: newInteraction.drugB,
        severity: newInteraction.severity 
      }
    });

    return NextResponse.json({
      success: true,
      data: newInteraction
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing drug interaction request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}