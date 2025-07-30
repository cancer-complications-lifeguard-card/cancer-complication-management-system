'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VitalSignsDashboard } from '@/components/monitoring/vital-signs-dashboard';
import { RealtimeVitalSignsDashboard } from '@/components/monitoring/realtime-vital-signs-dashboard';
import { BatteryAwareMonitoring } from '@/components/monitoring/battery-aware-monitoring';
import { DeviceManager } from '@/components/monitoring/device-manager';
import { AccessibilityControls, AccessibilityProvider, SimplifiedWrapper } from '@/components/accessibility/simplified-ui';
import { ProgressiveChart } from '@/components/ui/progressive-chart';
import { Activity, Settings, TrendingUp, Zap, Radio, Battery, BarChart3 } from 'lucide-react';

interface MonitoringDashboardClientProps {
  userId: number;
}

export function MonitoringDashboardClient({ userId }: MonitoringDashboardClientProps) {
  // Sample data for progressive chart
  const heartRateData = Array.from({ length: 50 }, (_, i) => ({
    time: `${String(Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`,
    value: 70 + Math.sin(i * 0.3) * 10 + Math.random() * 5
  }));

  const bloodPressureData = Array.from({ length: 30 }, (_, i) => ({
    time: `${String(Math.floor(i / 3)).padStart(2, '0')}:${String((i % 3) * 20).padStart(2, '0')}`,
    value: 120 + Math.sin(i * 0.2) * 15 + Math.random() * 8
  }));

  return (
    <AccessibilityProvider>
      <SimplifiedWrapper>
        <div className="space-y-6">
          <AccessibilityControls />
          <Tabs defaultValue="realtime" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            实时监测
          </TabsTrigger>
          <TabsTrigger value="battery" className="flex items-center gap-2">
            <Battery className="h-4 w-4" />
            智能优化
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            历史数据
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
          <TabsTrigger value="progressive" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            渐进图表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealtimeVitalSignsDashboard userId={userId} />
        </TabsContent>

        <TabsContent value="battery">
          <BatteryAwareMonitoring userId={userId} />
        </TabsContent>

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

        <TabsContent value="progressive">
          <div className="grid gap-6">
            <div className="mobile-card">
              <ProgressiveChart 
                data={heartRateData}
                title="心率监测"
                unit="bpm"
                color="#ef4444"
                height={300}
                chunkSize={5}
                loadingDelay={300}
              />
            </div>
            
            <div className="mobile-card">
              <ProgressiveChart 
                data={bloodPressureData}
                title="血压监测"
                unit="mmHg"
                color="#3b82f6"
                height={250}
                chunkSize={3}
                loadingDelay={500}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </SimplifiedWrapper>
    </AccessibilityProvider>
  );
}