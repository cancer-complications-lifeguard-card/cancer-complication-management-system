'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TriageEngine } from '@/components/triage/triage-engine';
import { QuickSymptomChecker } from '@/components/triage/quick-symptom-checker';
import { MultimodalSymptomChecker } from '@/components/triage/multimodal-symptom-checker';
import { Stethoscope, History, BarChart3, AlertTriangle, Zap, Brain } from 'lucide-react';

interface TriageDashboardClientProps {
  userId: number;
}

export function TriageDashboardClient({ userId }: TriageDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            快速检查
          </TabsTrigger>
          <TabsTrigger value="multimodal" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            智能评估
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            详细评估
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            历史记录
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            分析报告
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            风险预警
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <QuickSymptomChecker onCompleteAssessment={() => setActiveTab('assessment')} />
        </TabsContent>

        <TabsContent value="multimodal">
          <MultimodalSymptomChecker userId={userId} />
        </TabsContent>

        <TabsContent value="assessment">
          <TriageEngine userId={userId} />
        </TabsContent>

        <TabsContent value="history">
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">历史记录</h3>
            <p className="text-gray-500">查看您的分诊历史和评估结果</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">分析报告</h3>
            <p className="text-gray-500">深入分析您的症状模式和健康趋势</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">风险预警</h3>
            <p className="text-gray-500">基于AI分析的个性化健康风险预警</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}