import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getRiskTreeNode, getRiskTreeChildren, logKnowledgeInteraction } from '@/lib/db/knowledge-queries';
import { InteractionType } from '@/lib/db/schema';

interface Params {
  id: string;
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

    const nodeId = parseInt(params.id);
    if (isNaN(nodeId)) {
      return NextResponse.json(
        { error: 'Invalid node ID' },
        { status: 400 }
      );
    }

    const node = await getRiskTreeNode(nodeId);
    if (!node) {
      return NextResponse.json(
        { error: 'Risk tree node not found' },
        { status: 404 }
      );
    }

    const children = await getRiskTreeChildren(nodeId);

    // Log the node access
    await logKnowledgeInteraction({
      userId: user.id,
      interactionType: InteractionType.TREE_NAVIGATION,
      resourceType: 'risk_tree',
      resourceId: nodeId,
      query: `node:${node.complicationName}`,
      metadata: {
        nodeId,
        nodeName: node.complicationName,
        riskLevel: node.riskLevel,
        childrenCount: children.length,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      node,
      children
    });
  } catch (error) {
    console.error('Error fetching risk tree node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}