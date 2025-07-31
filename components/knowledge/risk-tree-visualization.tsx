'use client';

import { useCallback, useState } from 'react';

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

// Simplified interface without ReactFlow dependencies

// Simple risk node component
interface SimpleRiskNodeProps {
  node: ComplicationRiskTree;
  onClick: (node: ComplicationRiskTree) => void;
  isSelected?: boolean;
}

const SimpleRiskNode = ({ node, onClick, isSelected }: SimpleRiskNodeProps) => {
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

  const config = getRiskConfig(node.riskLevel);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${config.color} w-full max-w-sm`}
      onClick={() => onClick(node)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {config.icon}
          <span className="line-clamp-2">{node.complicationName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={config.badgeVariant} className="text-xs">
              {node.riskLevel.toUpperCase()}风险
            </Badge>
            {node.probability && (
              <span className="text-xs text-muted-foreground">
                概率: {node.probability}
              </span>
            )}
          </div>
          
          {node.timeframe && (
            <div className="text-xs text-muted-foreground">
              时间: {node.timeframe}
            </div>
          )}
          
          {node.description && (
            <div className="text-xs text-muted-foreground line-clamp-3">
              {node.description}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function RiskTreeVisualization({ riskTree, onNodeClick, selectedNodeId }: RiskTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<ComplicationRiskTree | null>(null);

  const handleNodeClick = useCallback((node: ComplicationRiskTree) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Group nodes by risk level for better organization
  const groupedNodes = {
    [RiskLevel.CRITICAL]: riskTree.filter(node => node.riskLevel === RiskLevel.CRITICAL),
    [RiskLevel.HIGH]: riskTree.filter(node => node.riskLevel === RiskLevel.HIGH),
    [RiskLevel.MEDIUM]: riskTree.filter(node => node.riskLevel === RiskLevel.MEDIUM),
    [RiskLevel.LOW]: riskTree.filter(node => node.riskLevel === RiskLevel.LOW),
  };

  if (riskTree.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>暂无风险数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 overflow-auto">
      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-3">风险等级图例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-600" />
            <span>危急风险</span>
            <span className="text-gray-500">({groupedNodes[RiskLevel.CRITICAL].length})</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span>高风险</span>
            <span className="text-gray-500">({groupedNodes[RiskLevel.HIGH].length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-600" />
            <span>中风险</span>
            <span className="text-gray-500">({groupedNodes[RiskLevel.MEDIUM].length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span>低风险</span>
            <span className="text-gray-500">({groupedNodes[RiskLevel.LOW].length})</span>
          </div>
        </div>
      </div>

      {/* Risk nodes organized by level */}
      <div className="space-y-6">
        {Object.entries(groupedNodes).map(([level, nodes]) => {
          if (nodes.length === 0) return null;
          
          const levelLabels = {
            [RiskLevel.CRITICAL]: '危急风险',
            [RiskLevel.HIGH]: '高风险', 
            [RiskLevel.MEDIUM]: '中风险',
            [RiskLevel.LOW]: '低风险',
          };

          return (
            <div key={level}>
              <h4 className="font-medium text-lg mb-3 text-gray-800">
                {levelLabels[level as RiskLevel]} ({nodes.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nodes.map((node) => (
                  <SimpleRiskNode
                    key={node.id}
                    node={node}
                    onClick={handleNodeClick}
                    isSelected={selectedNodeId === node.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="mt-8 p-6 bg-white border rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{selectedNode.complicationName}</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
              ×
            </Button>
          </div>
          
          {selectedNode.description && (
            <p className="text-sm text-gray-600 mb-4">{selectedNode.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedNode.symptoms && Array.isArray(selectedNode.symptoms) && (
              <div>
                <h4 className="font-medium text-sm mb-2">主要症状:</h4>
                <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                  {(selectedNode.symptoms as string[]).map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedNode.preventionMeasures && Array.isArray(selectedNode.preventionMeasures) && (
              <div>
                <h4 className="font-medium text-sm mb-2">预防措施:</h4>
                <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                  {(selectedNode.preventionMeasures as string[]).map((measure, index) => (
                    <li key={index}>{measure}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span>风险等级: {selectedNode.riskLevel}</span>
            {selectedNode.probability && (
              <span>概率: {selectedNode.probability}</span>
            )}
            {selectedNode.timeframe && (
              <span>时间范围: {selectedNode.timeframe}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}