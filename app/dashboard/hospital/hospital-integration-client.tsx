'use client';

import { User } from '@/lib/db/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HospitalSystemManager } from '@/components/hospital/hospital-system-manager';
import { PatientRecordSync } from '@/components/hospital/patient-record-sync';
import { EHRManagementDashboard } from '@/components/hospital/ehr-management-dashboard';
import { AccessibilityProvider, SimplifiedWrapper } from '@/components/accessibility/simplified-ui';
import { Hospital, Database, Users, Settings, Activity, Wifi, FileHeart } from 'lucide-react';

interface HospitalIntegrationDashboardProps {
  user: User;
}

export function HospitalIntegrationDashboard({ user }: HospitalIntegrationDashboardProps) {
  return (
    <AccessibilityProvider>
      <SimplifiedWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="mobile-heading-responsive font-bold text-foreground">
              医院系统集成中心
            </h1>
            <p className="mobile-text-responsive text-muted-foreground max-w-2xl mx-auto">
              连接外部医院系统，实现患者数据同步和医疗信息整合
            </p>
          </div>

          <Tabs defaultValue="systems" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="systems" className="flex items-center gap-2">
                <Hospital className="h-4 w-4" />
                系统管理
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                患者同步
              </TabsTrigger>
              <TabsTrigger value="ehr" className="flex items-center gap-2">
                <FileHeart className="h-4 w-4" />
                EHR集成
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                连接状态
              </TabsTrigger>
              <TabsTrigger value="data-mapping" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据映射
              </TabsTrigger>
              <TabsTrigger value="sync-logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                同步日志
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                集成配置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="systems">
              <HospitalSystemManager />
            </TabsContent>

            <TabsContent value="patients">
              <PatientRecordSync />
            </TabsContent>

            <TabsContent value="ehr">
              <EHRManagementDashboard />
            </TabsContent>

            <TabsContent value="connections">
              <div className="text-center py-12">
                <Wifi className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">连接状态监控</h3>
                <p className="text-gray-500">实时监控所有医院系统的连接状态</p>
                <p className="text-sm text-gray-400 mt-2">功能正在开发中，即将上线</p>
              </div>
            </TabsContent>

            <TabsContent value="data-mapping">
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">数据映射配置</h3>
                <p className="text-gray-500">配置不同医院系统之间的数据字段映射关系</p>
                <p className="text-sm text-gray-400 mt-2">支持HL7 FHIR和自定义数据格式</p>
              </div>
            </TabsContent>

            <TabsContent value="sync-logs">
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">数据同步日志</h3>
                <p className="text-gray-500">查看所有数据同步操作的详细日志</p>
                <p className="text-sm text-gray-400 mt-2">包含同步状态、错误信息和性能统计</p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">集成配置</h3>
                <p className="text-gray-500">配置数据同步频率、错误处理策略等</p>
                <p className="text-sm text-gray-400 mt-2">支持自动同步和手动同步模式</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SimplifiedWrapper>
    </AccessibilityProvider>
  );
}