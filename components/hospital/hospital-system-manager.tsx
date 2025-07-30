"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hospital, 
  Plus, 
  Settings, 
  Wifi, 
  WifiOff, 
  Database, 
  Activity, 
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { HospitalSystem } from '@/lib/hospital-integration/types';

export function HospitalSystemManager() {
  const [hospitalSystems, setHospitalSystems] = useState<HospitalSystem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: boolean }>({});

  // Form state for adding new hospital
  const [newHospital, setNewHospital] = useState<Partial<HospitalSystem>>({
    name: '',
    type: 'his',
    endpoint: '',
    apiVersion: 'v1',
    authConfig: {
      type: 'bearer',
      credentials: {}
    },
    isActive: true,
    supportedFeatures: []
  });

  // Load hospital systems on mount
  useEffect(() => {
    loadHospitalSystems();
  }, []);

  const loadHospitalSystems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hospital/systems');
      const data = await response.json();
      
      if (data.success) {
        setHospitalSystems(data.data);
        
        // Test connections for active systems
        const activeHospitals = data.data.filter((h: HospitalSystem) => h.isActive);
        testConnections(activeHospitals);
      }
    } catch (error) {
      console.error('Error loading hospital systems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnections = async (hospitals: HospitalSystem[]) => {
    const status: { [key: string]: boolean } = {};
    
    for (const hospital of hospitals) {
      try {
        // Simulate connection test
        const connected = Math.random() > 0.2; // 80% success rate for demo
        status[hospital.id] = connected;
      } catch {
        status[hospital.id] = false;
      }
    }
    
    setConnectionStatus(status);
  };

  const handleAddHospital = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/hospital/systems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHospital)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHospitalSystems(prev => [...prev, data.data]);
        setShowAddForm(false);
        resetForm();
        
        // Test connection for new hospital
        if (data.data.isActive) {
          testConnections([data.data]);
        }
      } else {
        alert(`添加失败: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error adding hospital:', error);
      alert('添加医院系统时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewHospital({
      name: '',
      type: 'his',
      endpoint: '',
      apiVersion: 'v1',
      authConfig: {
        type: 'bearer',
        credentials: {}
      },
      isActive: true,
      supportedFeatures: []
    });
  };

  const getSystemTypeLabel = (type: string) => {
    switch (type) {
      case 'his': return '医院信息系统';
      case 'ehr': return '电子病历系统';
      case 'pacs': return '影像系统';
      case 'lis': return '检验系统';
      default: return type.toUpperCase();
    }
  };

  const getSystemTypeColor = (type: string) => {
    switch (type) {
      case 'his': return 'bg-blue-100 text-blue-800';
      case 'ehr': return 'bg-green-100 text-green-800';
      case 'pacs': return 'bg-purple-100 text-purple-800';
      case 'lis': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionIcon = (hospitalId: string, isActive: boolean) => {
    if (!isActive) return <WifiOff className="h-4 w-4 text-gray-400" />;
    
    const connected = connectionStatus[hospitalId];
    if (connected === undefined) {
      return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
    
    return connected ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getConnectionStatus = (hospitalId: string, isActive: boolean) => {
    if (!isActive) return '已禁用';
    
    const connected = connectionStatus[hospitalId];
    if (connected === undefined) return '测试中...';
    
    return connected ? '已连接' : '连接失败';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">医院系统管理</h1>
          <p className="text-muted-foreground">
            管理与外部医院系统的集成连接
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadHospitalSystems}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加医院系统
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hospital className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">总系统数</p>
                <p className="text-2xl font-bold">{hospitalSystems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">已连接</p>
                <p className="text-2xl font-bold">
                  {Object.values(connectionStatus).filter(Boolean).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">活跃系统</p>
                <p className="text-2xl font-bold">
                  {hospitalSystems.filter(h => h.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">平均患者数</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList>
          <TabsTrigger value="systems">系统列表</TabsTrigger>
          <TabsTrigger value="connections">连接状态</TabsTrigger>
          <TabsTrigger value="logs">同步日志</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          {/* Hospital Systems List */}
          {hospitalSystems.map((hospital) => (
            <Card key={hospital.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{hospital.name}</CardTitle>
                      <Badge className={`text-xs ${getSystemTypeColor(hospital.type)}`}>
                        {getSystemTypeLabel(hospital.type)}
                      </Badge>
                      <Badge variant={hospital.isActive ? "default" : "secondary"}>
                        {hospital.isActive ? "启用" : "禁用"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>API版本: {hospital.apiVersion}</span>
                      <span>•</span>
                      <span>{hospital.endpoint}</span>
                      {hospital.lastSyncTime && (
                        <>
                          <span>•</span>
                          <span>最后同步: {new Date(hospital.lastSyncTime).toLocaleString('zh-CN')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getConnectionIcon(hospital.id, hospital.isActive)}
                    <span className="text-sm">
                      {getConnectionStatus(hospital.id, hospital.isActive)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">支持功能</h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.supportedFeatures.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature.feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      配置
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-1" />
                      测试连接
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hospitalSystems.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Hospital className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  暂无医院系统
                </h3>
                <p className="text-gray-500 mb-4">
                  开始添加第一个医院系统集成
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加医院系统
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>连接状态监控</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hospitalSystems.filter(h => h.isActive).map((hospital) => (
                  <div key={hospital.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getConnectionIcon(hospital.id, hospital.isActive)}
                      <div>
                        <p className="font-medium">{hospital.name}</p>
                        <p className="text-sm text-muted-foreground">{hospital.endpoint}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{getConnectionStatus(hospital.id, hospital.isActive)}</p>
                      {hospital.lastSyncTime && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(hospital.lastSyncTime).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>数据同步日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-16 w-16 mx-auto mb-4" />
                <p>同步日志功能正在开发中</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Hospital Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">添加医院系统</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">医院名称</Label>
                <Input
                  id="name"
                  value={newHospital.name || ''}
                  onChange={(e) => setNewHospital(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入医院名称"
                />
              </div>
              
              <div>
                <Label htmlFor="type">系统类型</Label>
                <Select 
                  value={newHospital.type} 
                  onValueChange={(value) => setNewHospital(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="his">医院信息系统 (HIS)</SelectItem>
                    <SelectItem value="ehr">电子病历系统 (EHR)</SelectItem>
                    <SelectItem value="pacs">影像系统 (PACS)</SelectItem>
                    <SelectItem value="lis">检验系统 (LIS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="endpoint">API端点</Label>
                <Input
                  id="endpoint"
                  value={newHospital.endpoint || ''}
                  onChange={(e) => setNewHospital(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.hospital.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button 
                onClick={handleAddHospital}
                disabled={isLoading || !newHospital.name || !newHospital.endpoint}
              >
                {isLoading ? '添加中...' : '添加'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}