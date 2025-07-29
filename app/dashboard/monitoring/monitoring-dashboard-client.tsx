'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VitalSignsDashboard } from '@/components/monitoring/vital-signs-dashboard';
import { DeviceManager } from '@/components/monitoring/device-manager';
import { Activity, Settings, TrendingUp, Zap } from 'lucide-react';

interface MonitoringDashboardClientProps {
  userId: number;
}

export function MonitoringDashboardClient({ userId }: MonitoringDashboardClientProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="vitals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            实时监测
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            设备管理
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            趋势分析
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            智能预警
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals">
          <VitalSignsDashboard userId={userId} />
        </TabsContent>

        <TabsContent value="devices">
          <DeviceManager userId={userId} />
        </TabsContent>

        <TabsContent value="trends">
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">趋势分析</h3>
            <p className="text-gray-500">长期健康趋势分析功能正在开发中</p>
            <p className="text-sm text-gray-400 mt-2">将提供个性化的健康趋势报告和预测分析</p>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">智能预警系统</h3>
            <p className="text-gray-500">AI驱动的健康预警功能正在开发中</p>
            <p className="text-sm text-gray-400 mt-2">将基于您的健康数据提供个性化的风险预警</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}