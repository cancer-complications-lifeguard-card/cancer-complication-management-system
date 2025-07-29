import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { buildRiskTreeHierarchy, logKnowledgeInteraction } from '@/lib/db/knowledge-queries';
import { InteractionType } from '@/lib/db/schema';

interface Params {
  cancerType: string;
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

    const { cancerType } = params;
    const decodedCancerType = decodeURIComponent(cancerType);

    const riskTree = await buildRiskTreeHierarchy(decodedCancerType);

    // Log the risk tree access
    await logKnowledgeInteraction({
      userId: user.id,
      interactionType: InteractionType.RISK_ASSESSMENT,
      resourceType: 'risk_tree',
      resourceId: 0,
      query: `cancer_type:${decodedCancerType}`,
      metadata: {
        cancerType: decodedCancerType,
        nodeCount: riskTree.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      riskTree,
      cancerType: decodedCancerType
    });
  } catch (error) {
    console.error('Error fetching risk tree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}