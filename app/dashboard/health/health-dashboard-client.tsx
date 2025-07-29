'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicationManager } from '@/components/health/medication-manager';
import { MedicalRecordsManager } from '@/components/health/medical-records-manager';
import { SymptomTracker } from '@/components/health/symptom-tracker';
import { Pill, FileText, Activity, Heart } from 'lucide-react';

interface HealthDashboardClientProps {
  userId: number;
}

export function HealthDashboardClient({ userId }: HealthDashboardClientProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="medications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            药物管理
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            病历档案
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            症状追踪
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            健康概览
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications">
          <MedicationManager userId={userId} />
        </TabsContent>

        <TabsContent value="records">
          <MedicalRecordsManager userId={userId} />
        </TabsContent>

        <TabsContent value="symptoms">
          <SymptomTracker userId={userId} />
        </TabsContent>

        <TabsContent value="overview">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">健康概览</h3>
            <p className="text-gray-500">综合健康分析功能正在开发中</p>
            <p className="text-sm text-gray-400 mt-2">将整合您的药物、症状和病历数据，提供个性化的健康洞察</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}