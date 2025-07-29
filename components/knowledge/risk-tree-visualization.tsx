'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ComplicationRiskTree, RiskLevel } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Shield, Zap } from 'lucide-react';

interface RiskTreeVisualizationProps {
  riskTree: ComplicationRiskTree[];
  onNodeClick?: (node: ComplicationRiskTree) => void;
  selectedNodeId?: number;
}

interface RiskTreeNode extends Node {
  data: ComplicationRiskTree & {
    onClick: (node: ComplicationRiskTree) => void;
  };
}

// Custom node component
const RiskNode = ({ data }: { data: RiskTreeNode['data'] }) => {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return {
          color: 'bg-red-100 border-red-500 text-red-900',
          icon: <Zap className="w-4 h-4 text-red-600" />,
          badgeVariant: 'destructive' as const
        };
      case RiskLevel.HIGH:
        return {
          color: 'bg-orange-100 border-orange-500 text-orange-900',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          badgeVariant: 'destructive' as const
        };
      case RiskLevel.MEDIUM:
        return {
          color: 'bg-yellow-100 border-yellow-500 text-yellow-900',
          icon: <Info className="w-4 h-4 text-yellow-600" />,
          badgeVariant: 'secondary' as const
        };
      case RiskLevel.LOW:
        return {
          color: 'bg-green-100 border-green-500 text-green-900',
          icon: <Shield className="w-4 h-4 text-green-600" />,
          badgeVariant: 'outline' as const
        };
      default:
        return {
          color: 'bg-gray-100 border-gray-500 text-gray-900',
          icon: <Info className="w-4 h-4 text-gray-600" />,
          badgeVariant: 'outline' as const
        };
    }
  };

  const config = getRiskConfig(data.riskLevel);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${config.color} min-w-64 max-w-80`}
      onClick={() => data.onClick(data)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {config.icon}
          <span className="line-clamp-2">{data.complicationName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={config.badgeVariant} className="text-xs">
              {data.riskLevel.toUpperCase()}风险
            </Badge>
            {data.probability && (
              <span className="text-xs text-muted-foreground">
                概率: {data.probability}
              </span>
            )}
          </div>
          
          {data.timeframe && (
            <div className="text-xs text-muted-foreground">
              时间: {data.timeframe}
            </div>
          )}
          
          {data.description && (
            <div className="text-xs text-muted-foreground line-clamp-3">
              {data.description}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  riskNode: RiskNode,
};

export function RiskTreeVisualization({ riskTree, onNodeClick, selectedNodeId }: RiskTreeVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RiskTreeNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<ComplicationRiskTree | null>(null);

  const handleNodeClick = useCallback((node: ComplicationRiskTree) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  const convertTreeToNodesAndEdges = useCallback((tree: ComplicationRiskTree[]) => {
    const nodes: RiskTreeNode[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<number, ComplicationRiskTree>();

    // First pass: create a map of all nodes
    const collectNodes = (items: ComplicationRiskTree[]) => {
      items.forEach(item => {
        nodeMap.set(item.id, item);
        if ((item as any).children) {
          collectNodes((item as any).children);
        }
      });
    };
    collectNodes(tree);

    // Second pass: create React Flow nodes and edges
    let yPosition = 0;
    const levelWidth = 400;
    const levelHeight = 200;
    const nodeWidth = 280;

    const processLevel = (items: ComplicationRiskTree[], level: number, parentX = 0) => {
      const itemsPerRow = Math.max(1, Math.ceil(Math.sqrt(items.length)));
      const totalWidth = itemsPerRow * levelWidth;
      const startX = parentX - totalWidth / 2;

      items.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = startX + col * levelWidth + levelWidth / 2;
        const y = level * levelHeight + row * 100;

        nodes.push({
          id: item.id.toString(),
          type: 'riskNode',
          position: { x, y },
          data: {
            ...item,
            onClick: handleNodeClick,
          },
          selected: selectedNodeId === item.id,
        });

        // Create edges to children
        if ((item as any).children) {
          (item as any).children.forEach((child: ComplicationRiskTree) => {
            edges.push({
              id: `${item.id}-${child.id}`,
              source: item.id.toString(),
              target: child.id.toString(),
              type: 'smoothstep',
              animated: child.riskLevel === RiskLevel.CRITICAL,
              style: { 
                stroke: child.riskLevel === RiskLevel.CRITICAL ? '#ef4444' : 
                        child.riskLevel === RiskLevel.HIGH ? '#f97316' :
                        child.riskLevel === RiskLevel.MEDIUM ? '#eab308' : '#10b981',
                strokeWidth: 2,
              },
            });
          });
          processLevel((item as any).children, level + 1, x);
        }
      });
    };

    processLevel(tree, 0);

    return { nodes, edges };
  }, [handleNodeClick, selectedNodeId]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertTreeToNodesAndEdges(riskTree);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [riskTree, convertTreeToNodesAndEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
        
        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">风险等级图例</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-red-600" />
                <span>危急</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-600" />
                <span>高风险</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-yellow-600" />
                <span>中风险</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-600" />
                <span>低风险</span>
              </div>
            </div>
          </div>
        </Panel>

        {selectedNode && (
          <Panel position="bottom-left" className="bg-white p-4 rounded-lg shadow-lg max-w-md">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedNode.complicationName}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                  ×
                </Button>
              </div>
              
              {selectedNode.description && (
                <p className="text-sm text-gray-600">{selectedNode.description}</p>
              )}
              
              {selectedNode.symptoms && Array.isArray(selectedNode.symptoms) && (
                <div>
                  <h4 className="font-medium text-sm">主要症状:</h4>
                  <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                    {(selectedNode.symptoms as string[]).map((symptom, index) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedNode.preventionMeasures && Array.isArray(selectedNode.preventionMeasures) && (
                <div>
                  <h4 className="font-medium text-sm">预防措施:</h4>
                  <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                    {(selectedNode.preventionMeasures as string[]).map((measure, index) => (
                      <li key={index}>{measure}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}