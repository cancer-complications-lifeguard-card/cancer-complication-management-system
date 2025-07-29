'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertTriangle, Activity, Users, Database, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  securityEvents: number;
  criticalEvents: number;
  dataEncrypted: number;
  complianceScore: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user: string;
  description: string;
  ipAddress: string;
}

interface SecurityDashboardProps {
  userId: number;
  userRole: string;
}

export function SecurityDashboard({ userId, userRole }: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchSecurityMetrics();
    fetchSecurityEvents();
  }, [timeRange]);

  const fetchSecurityMetrics = async () => {
    try {
      // 模拟安全指标数据
      setMetrics({
        totalUsers: 1247,
        activeUsers: 89,
        securityEvents: 156,
        criticalEvents: 3,
        dataEncrypted: 98.7,
        complianceScore: 94.2,
      });
    } catch (error) {
      console.error('Error fetching security metrics:', error);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      // 模拟安全事件数据
      setEvents([
        {
          id: '1',
          type: 'LOGIN_FAILED',
          severity: 'medium',
          timestamp: '2024-01-15T14:30:00Z',
          user: 'user@example.com',
          description: '多次登录失败',
          ipAddress: '192.168.1.100',
        },
        {
          id: '2',
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'high',
          timestamp: '2024-01-15T14:25:00Z',
          user: 'admin@example.com',
          description: '尝试访问未授权资源',
          ipAddress: '10.0.0.50',
        },
        {
          id: '3',
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'critical',
          timestamp: '2024-01-15T14:20:00Z',
          user: 'patient@example.com',
          description: '异常数据下载活动',
          ipAddress: '203.0.113.45',
        },
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching security events:', error);
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '严重';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      default:
        return '低';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'LOGIN_FAILED':
        return '登录失败';
      case 'UNAUTHORIZED_ACCESS':
        return '未授权访问';
      case 'SUSPICIOUS_ACTIVITY':
        return '可疑活动';
      case 'DATA_EXPORT':
        return '数据导出';
      default:
        return type;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">安全监控中心</h1>
            <p className="text-gray-600">医疗数据安全和合规性监控</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            onClick={() => setTimeRange('day')}
            size="sm"
          >
            今天
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
            size="sm"
          >
            本周
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            size="sm"
          >
            本月
          </Button>
        </div>
      </div>

      {/* 安全指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              活跃用户
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers}</div>
            <div className="text-sm text-gray-500">总用户: {metrics?.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              安全事件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.securityEvents}</div>
            <div className="text-sm text-red-600">严重事件: {metrics?.criticalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              数据加密
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.dataEncrypted}%</div>
            <Progress value={metrics?.dataEncrypted} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Database className="h-4 w-4" />
              合规评分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.complianceScore}%</div>
            <Progress value={metrics?.complianceScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            安全事件
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            访问控制
          </TabsTrigger>
          <TabsTrigger value="encryption" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            数据加密
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            合规监控
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>安全事件日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">{getEventTypeLabel(event.type)}</div>
                        <div className="text-sm text-gray-600">{event.description}</div>
                        <div className="text-xs text-gray-500">
                          {event.user} • {event.ipAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(event.severity)}>
                        {getSeverityLabel(event.severity)}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>访问控制状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800">权限系统</h3>
                    <p className="text-sm text-green-600">基于角色的访问控制已启用</p>
                    <div className="mt-2 text-green-700">
                      ✓ 患者数据隔离<br />
                      ✓ 医护人员权限管理<br />
                      ✓ 紧急访问控制
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800">审计日志</h3>
                    <p className="text-sm text-blue-600">所有访问操作已记录</p>
                    <div className="mt-2 text-blue-700">
                      ✓ 数据访问记录<br />
                      ✓ 权限变更日志<br />
                      ✓ 异常行为监控
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption">
          <Card>
            <CardHeader>
              <CardTitle>数据加密状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">医疗记录</h3>
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <p className="text-sm text-gray-600">AES-256-GCM 加密</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">急救卡数据</h3>
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <p className="text-sm text-gray-600">端到端加密</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">通信数据</h3>
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <p className="text-sm text-gray-600">TLS 1.3 传输加密</p>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-800">加密密钥管理</h3>
                  <p className="text-sm text-yellow-700">
                    密钥轮换周期: 90天 | 下次轮换: 2024年4月15日
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>合规性监控</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800">数据保护合规</h3>
                    <div className="text-2xl font-bold text-green-600">96%</div>
                    <p className="text-sm text-green-600">符合医疗数据保护标准</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800">访问日志保留</h3>
                    <div className="text-2xl font-bold text-blue-600">100%</div>
                    <p className="text-sm text-blue-600">满足审计要求</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">合规检查项目</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">数据备份策略</span>
                      <Badge className="bg-green-100 text-green-800">✓ 合规</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">访问权限审查</span>
                      <Badge className="bg-green-100 text-green-800">✓ 合规</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">数据保留政策</span>
                      <Badge className="bg-yellow-100 text-yellow-800">⚠ 需关注</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">事件响应流程</span>
                      <Badge className="bg-green-100 text-green-800">✓ 合规</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}