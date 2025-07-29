import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { logUserActivity } from '@/lib/security/audit-logger';
import { 
  searchClinicalTrials,
  getRecruitingTrialsByCancerType,
  createClinicalTrial,
  logKnowledgeInteraction
} from '@/lib/db/knowledge-base-queries';
import { z } from 'zod';

const searchParamsSchema = z.object({
  query: z.string().optional(),
  cancerTypes: z.string().optional().transform(str => str ? str.split(',').map(s => s.trim()) : undefined),
  phase: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  recruiting: z.string().optional().transform(str => str === 'true'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const createTrialSchema = z.object({
  nctId: z.string().min(1),
  title: z.string().min(1),
  briefSummary: z.string().min(1),
  detailedDescription: z.string().optional(),
  cancerTypes: z.string().min(1),
  phase: z.string().min(1),
  status: z.enum(['not_yet_recruiting', 'recruiting', 'enrolling_by_invitation', 'active_not_recruiting', 'completed', 'suspended', 'terminated', 'withdrawn']),
  studyType: z.string().min(1),
  interventions: z.string().optional(),
  primaryOutcomes: z.string().optional(),
  secondaryOutcomes: z.string().optional(),
  eligibilityCriteria: z.string().optional(),
  locations: z.string().optional(),
  contactInfo: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  completionDate: z.string().transform(str => new Date(str)).optional(),
  lastUpdated: z.string().transform(str => new Date(str)).optional(),
  studyUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams));

    let trials;
    let searchType = 'general';

    if (params.recruiting && params.cancerTypes && params.cancerTypes.length === 1) {
      // Get recruiting trials for specific cancer type
      trials = await getRecruitingTrialsByCancerType(params.cancerTypes[0]);
      searchType = 'recruiting';
    } else {
      // General search
      const searchParams = {
        query: params.query,
        cancerTypes: params.cancerTypes,
        phase: params.phase,
        status: params.status,
        location: params.location,
        limit: params.limit,
        offset: params.offset
      };
      trials = await searchClinicalTrials(searchParams);
    }

    // Log the knowledge interaction
    await logKnowledgeInteraction({
      userId: user.id,
      contentType: 'clinical_trial',
      contentId: null,
      interactionType: 'search',
      searchQuery: params.query || null,
      metadata: JSON.stringify({ 
        searchType,
        cancerTypes: params.cancerTypes,
        phase: params.phase,
        status: params.status,
        location: params.location
      })
    });

    await logUserActivity({
      userId: user.id,
      action: 'clinical_trials_search',
      resource: 'clinical_trials',
      details: { searchParams: params, searchType }
    });

    return NextResponse.json({
      success: true,
      data: trials,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: trials.length
      },
      metadata: {
        searchType
      }
    });

  } catch (error) {
    console.error('Error searching clinical trials:', error);
    return NextResponse.json(
      { error: 'Failed to search clinical trials' },
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
    const trialData = createTrialSchema.parse(body);

    const newTrial = await createClinicalTrial({
      ...trialData,
      createdBy: user.id,
      lastUpdatedBy: user.id,
      isActive: true
    });

    await logUserActivity({
      userId: user.id,
      action: 'create_clinical_trial',
      resource: 'clinical_trials',
      resourceId: newTrial.id.toString(),
      details: { 
        nctId: newTrial.nctId,
        title: newTrial.title,
        cancerTypes: newTrial.cancerTypes,
        phase: newTrial.phase
      }
    });

    return NextResponse.json({
      success: true,
      data: newTrial
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating clinical trial:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create clinical trial' },
      { status: 500 }
    );
  }
}