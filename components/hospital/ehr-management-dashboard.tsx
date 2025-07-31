'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Activity,
  Users,
  Shield,
  Zap
} from 'lucide-react';

interface EHRSystem {
  id: string;
  name: string;
  type: 'epic' | 'cerner' | 'allscripts' | 'meditech' | 'custom';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  recordsCount: number;
  errorCount: number;
  syncProgress: number;
}

interface SyncMetrics {
  totalPatients: number;
  syncedToday: number;
  failedToday: number;
  averageSyncTime: number;
  uptime: number;
}

interface ClinicalAlert {
  id: string;
  type: 'drug_interaction' | 'allergy' | 'vital_signs' | 'lab_critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  patientId: string;
  timestamp: string;
}

export function EHRManagementDashboard() {
  const [ehrSystems, setEHRSystems] = useState<EHRSystem[]>([]);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalAlert[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEHRData();
    // Set up real-time updates
    const interval = setInterval(loadEHRData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEHRData = async () => {
    try {
      setLoading(true);
      
      // Load EHR systems status
      const systemsResponse = await fetch('/api/hospital/ehr/systems');
      const systemsData = await systemsResponse.json();
      if (systemsData.success) {
        setEHRSystems(systemsData.data);
      }
      
      // Load sync metrics
      const metricsResponse = await fetch('/api/hospital/ehr/metrics');
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setSyncMetrics(metricsData.data);
      }
      
      // Load clinical alerts
      const alertsResponse = await fetch('/api/hospital/ehr/alerts');
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setClinicalAlerts(alertsData.data);
      }
    } catch (error) {
      console.error('Failed to load EHR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToggle = async (systemId: string, enabled: boolean) => {
    try {
      await fetch(`/api/hospital/ehr/systems/${systemId}/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      // Refresh data
      await loadEHRData();
    } catch (error) {
      console.error('Failed to toggle sync:', error);
    }
  };

  const handleManualSync = async (systemId: string) => {
    try {
      await fetch(`/api/hospital/ehr/systems/${systemId}/sync`, {
        method: 'POST',
      });
      
      // Refresh data
      await loadEHRData();
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading && !ehrSystems.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading EHR dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">EHR集成管理</h2>
          <p className="text-muted-foreground">
            管理电子健康病历系统集成和数据同步
          </p>
        </div>
        <Button onClick={loadEHRData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Quick Metrics */}
      {syncMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总患者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncMetrics.totalPatients.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日同步</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{syncMetrics.syncedToday}</div>
              <p className="text-xs text-muted-foreground">
                失败: {syncMetrics.failedToday}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均同步时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncMetrics.averageSyncTime}s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">系统正常运行时间</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncMetrics.uptime}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="systems">EHR系统</TabsTrigger>
          <TabsTrigger value="alerts">临床警报</TabsTrigger>
          <TabsTrigger value="mappings">字段映射</TabsTrigger>
          <TabsTrigger value="logs">同步日志</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>EHR系统状态</CardTitle>
                <CardDescription>已连接EHR系统的实时状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ehrSystems.slice(0, 3).map((system) => (
                  <div key={system.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`} />
                      <div>
                        <p className="font-medium">{system.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {system.recordsCount.toLocaleString()} 患者记录
                        </p>
                      </div>
                    </div>
                    <Badge variant={system.status === 'connected' ? 'default' : 'secondary'}>
                      {system.status === 'connected' ? '已连接' : 
                       system.status === 'syncing' ? '同步中' : 
                       system.status === 'error' ? '错误' : '断开连接'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>最新临床警报</CardTitle>
                <CardDescription>需要关注的临床决策支持警报</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {clinicalAlerts.slice(0, 5).map((alert) => (
                  <Alert key={alert.id} className="p-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            患者ID: {alert.patientId} • {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity === 'critical' ? '严重' :
                           alert.severity === 'high' ? '高' :
                           alert.severity === 'medium' ? '中' : '低'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EHR Systems Tab */}
        <TabsContent value="systems" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ehrSystems.map((system) => (
              <Card key={system.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <CardTitle className="text-lg">{system.name}</CardTitle>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`} />
                  </div>
                  <CardDescription>
                    类型: {system.type.toUpperCase()} • 上次同步: {new Date(system.lastSync).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sync Progress */}
                  {system.status === 'syncing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>同步进度</span>
                        <span>{system.syncProgress}%</span>
                      </div>
                      <Progress value={system.syncProgress} />
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">患者记录</p>
                      <p className="font-medium">{system.recordsCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">错误数</p>
                      <p className="font-medium text-red-600">{system.errorCount}</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={system.status === 'connected' || system.status === 'syncing'}
                        onCheckedChange={(checked) => handleSyncToggle(system.id, checked)}
                      />
                      <span className="text-sm">自动同步</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleManualSync(system.id)}
                      disabled={system.status === 'syncing'}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      手动同步
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clinical Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {clinicalAlerts.map((alert) => (
              <Alert key={alert.id}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity === 'critical' ? '严重' :
                           alert.severity === 'high' ? '高' :
                           alert.severity === 'medium' ? '中' : '低'}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type === 'drug_interaction' ? '药物相互作用' :
                           alert.type === 'allergy' ? '过敏反应' :
                           alert.type === 'vital_signs' ? '生命体征' : '实验室危急值'}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        患者ID: {alert.patientId} • 
                        时间: {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      处理
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>

        {/* Field Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>EHR字段映射配置</CardTitle>
              <CardDescription>
                配置不同EHR系统的数据字段映射关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                字段映射配置功能正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>同步日志</CardTitle>
              <CardDescription>
                查看详细的EHR数据同步日志和错误信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                同步日志功能正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}