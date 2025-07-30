'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, MedicalTerm, ComplicationRiskTree } from '@/lib/db/schema';
import { MedicalTermsBrowser } from '@/components/knowledge/medical-terms-browser';
import { RiskTreeVisualization } from '@/components/knowledge/risk-tree-visualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileDashboardLayout, MobileStatsCard } from '@/components/layout/mobile-dashboard-layout';
import { ResponsiveGrid } from '@/components/ui/responsive-card';
import { Network, Search, Book, Activity, AlertTriangle, Tree } from 'lucide-react';

interface KnowledgeGraphClientProps {
  user: User;
}

interface KnowledgeStats {
  totalTerms: number;
  totalRiskTrees: number;
  userInteractions: number;
  recentSearches: string[];
}

const cancerTypes = [
  '肺癌',
  '乳腺癌',
  '胃癌',
  '肝癌',
  '结直肠癌',
  '食道癌',
  '胰腺癌',
  '前列腺癌',
  '宫颈癌',
  '甲状腺癌'
];

export function KnowledgeGraphClient({ user }: KnowledgeGraphClientProps) {
  const [selectedTerm, setSelectedTerm] = useState<MedicalTerm | null>(null);
  const [selectedCancerType, setSelectedCancerType] = useState<string>('');
  const [riskTree, setRiskTree] = useState<ComplicationRiskTree[]>([]);
  const [isLoadingRiskTree, setIsLoadingRiskTree] = useState(false);
  const [selectedRiskNode, setSelectedRiskNode] = useState<ComplicationRiskTree | null>(null);
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats>({
    totalTerms: 0,
    totalRiskTrees: 0,
    userInteractions: 0,
    recentSearches: []
  });

  // Load risk tree for selected cancer type
  const loadRiskTree = useCallback(async (cancerType: string) => {
    if (!cancerType) return;
    
    setIsLoadingRiskTree(true);
    try {
      const response = await fetch(`/api/risk-trees/${encodeURIComponent(cancerType)}`);
      const data = await response.json();
      
      if (data.success) {
        setRiskTree(data.riskTree);
      } else {
        console.error('Failed to load risk tree:', data.error);
        setRiskTree([]);
      }
    } catch (error) {
      console.error('Error loading risk tree:', error);
      setRiskTree([]);
    } finally {
      setIsLoadingRiskTree(false);
    }
  }, []);

  // Load knowledge statistics
  const loadKnowledgeStats = useCallback(async () => {
    try {
      // In a real implementation, you would have dedicated endpoints for these stats
      // For now, we'll use placeholder data
      setKnowledgeStats({
        totalTerms: 1250,
        totalRiskTrees: 45,
        userInteractions: 128,
        recentSearches: ['化疗', '放疗副作用', '免疫治疗', '靶向药物', '术后护理']
      });
    } catch (error) {
      console.error('Error loading knowledge stats:', error);
    }
  }, []);

  // Handle cancer type selection
  const handleCancerTypeChange = useCallback((cancerType: string) => {
    setSelectedCancerType(cancerType);
    loadRiskTree(cancerType);
  }, [loadRiskTree]);

  // Handle term selection
  const handleTermSelect = useCallback((term: MedicalTerm) => {
    setSelectedTerm(term);
  }, []);

  // Handle risk node click
  const handleRiskNodeClick = useCallback((node: ComplicationRiskTree) => {
    setSelectedRiskNode(node);
  }, []);

  useEffect(() => {
    loadKnowledgeStats();
    
    // Load default risk tree if user has cancer type in medical profile
    // This would be retrieved from the user's medical profile in a real implementation
    const defaultCancerType = '肺癌'; // Placeholder
    setSelectedCancerType(defaultCancerType);
    loadRiskTree(defaultCancerType);
  }, [loadKnowledgeStats, loadRiskTree]);

  const renderStatsCard = (icon: React.ReactNode, title: string, value: number, description: string) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mr-4">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileDashboardLayout
      title="知识图谱中心"
      subtitle="探索医疗术语和并发症风险关系"
    >
      {/* Statistics Dashboard */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }}>
        <MobileStatsCard
          title="医疗术语"
          value={knowledgeStats.totalTerms}
          description="涵盖各类医疗专业术语"
          icon={<Book className="h-5 w-5 text-primary" />}
        />
        <MobileStatsCard
          title="风险图谱"
          value={knowledgeStats.totalRiskTrees}
          description="不同癌症类型的风险树"
          icon={<Network className="h-5 w-5 text-primary" />}
        />
        <MobileStatsCard
          title="查询次数"
          value={knowledgeStats.userInteractions}
          description="您的知识库使用记录"
          icon={<Activity className="h-5 w-5 text-primary" />}
        />
        <MobileStatsCard
          title="风险评估"
          value={24}
          description="个人风险因子识别"
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
        />
      </ResponsiveGrid>

      {/* Main Content */}
      <Tabs defaultValue="terms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="terms" className="text-sm sm:text-base p-2 sm:p-4">医疗术语百科</TabsTrigger>
          <TabsTrigger value="risk-tree" className="text-sm sm:text-base p-2 sm:p-4">并发症风险树</TabsTrigger>
          <TabsTrigger value="search" className="text-sm sm:text-base p-2 sm:p-4">综合搜索</TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                医疗术语百科
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MedicalTermsBrowser 
                onTermSelect={handleTermSelect}
                showCategories={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-tree" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tree className="h-5 w-5" />
                并发症风险树
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select value={selectedCancerType} onValueChange={handleCancerTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择癌症类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {cancerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {riskTree.length} 个风险节点
                </Badge>
              </div>

              {isLoadingRiskTree ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">加载风险树中...</span>
                </div>
              ) : riskTree.length > 0 ? (
                <div className="h-96 border rounded-lg overflow-hidden">
                  <RiskTreeVisualization
                    riskTree={riskTree}
                    onNodeClick={handleRiskNodeClick}
                    selectedNodeId={selectedRiskNode?.id}
                  />
                </div>
              ) : selectedCancerType ? (
                <div className="text-center py-12 text-gray-500">
                  <Tree className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>该癌症类型暂无风险树数据</p>
                  <p className="text-sm mt-2">请选择其他癌症类型或稍后再试</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Tree className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>请选择癌症类型以查看风险树</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                综合知识搜索
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Input
                  placeholder="搜索医疗术语、并发症风险等..."
                  className="text-lg h-12"
                />
                <Button className="w-full h-12">
                  <Search className="h-4 w-4 mr-2" />
                  搜索知识库
                </Button>
              </div>

              {/* Recent Searches */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">最近搜索</h4>
                <div className="flex flex-wrap gap-2">
                  {knowledgeStats.recentSearches.map((search, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80"
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Search Results Placeholder */}
              <div className="border-t pt-4">
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>输入关键词开始搜索</p>
                  <p className="text-sm mt-2">搜索结果将在此显示</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MobileDashboardLayout>
  );
}