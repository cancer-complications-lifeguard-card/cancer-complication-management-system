'use client';

import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Droplets, Wind, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface VitalSigns {
  id: number;
  userId: number;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
  recordedAt: Date;
  deviceId: string | null;
  createdAt: Date;
}

interface VitalSignsAlert {
  id: number;
  userId: number;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  vitalSignId: number;
  isRead: boolean;
  createdAt: Date;
}

interface VitalSignsDashboardProps {
  userId: number;
}

interface VitalSignsStats {
  current: VitalSigns | null;
  alerts: VitalSignsAlert[];
  trends: VitalSigns[];
}

const vitalSignsRanges = {
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  bloodPressureSystolic: { min: 90, max: 140, unit: 'mmHg' },
  bloodPressureDiastolic: { min: 60, max: 90, unit: 'mmHg' },
  temperature: { min: 36.1, max: 37.2, unit: '°C' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  respiratoryRate: { min: 12, max: 20, unit: '/min' },
};

export function VitalSignsDashboard({ userId }: VitalSignsDashboardProps) {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [alerts, setAlerts] = useState<VitalSignsAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);

  // Load vital signs data
  const loadVitalSigns = async () => {
    try {
      const response = await fetch('/api/vital-signs');
      const data = await response.json();
      if (data.success) {
        setVitalSigns(data.vitalSigns);
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error loading vital signs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate device connection
  const handleDeviceConnection = async () => {
    setIsConnected(true);
    // Simulate device connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Start data simulation
  const startSimulation = async () => {
    setSimulationRunning(true);
    
    // Generate simulated vital signs data
    const simulatedData = {
      heartRate: 72 + Math.floor(Math.random() * 20),
      bloodPressureSystolic: 120 + Math.floor(Math.random() * 20),
      bloodPressureDiastolic: 80 + Math.floor(Math.random() * 10),
      temperature: 36.5 + Math.random() * 0.8,
      oxygenSaturation: 97 + Math.floor(Math.random() * 3),
      respiratoryRate: 16 + Math.floor(Math.random() * 4),
      deviceId: 'smartwatch-001',
    };

    try {
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulatedData),
      });

      if (response.ok) {
        await loadVitalSigns();
      }
    } catch (error) {
      console.error('Error simulating vital signs:', error);
    } finally {
      setSimulationRunning(false);
    }
  };

  useEffect(() => {
    loadVitalSigns();
  }, []);

  const getVitalSignStatus = (value: number | null, type: keyof typeof vitalSignsRanges) => {
    if (!value) return 'unknown';
    const range = vitalSignsRanges[type];
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const currentReading = vitalSigns.length > 0 ? vitalSigns[0] : null;
  const chartData = vitalSigns.slice(0, 10).reverse().map((vs, index) => ({
    time: new Date(vs.recordedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    heartRate: vs.heartRate,
    temperature: vs.temperature,
    oxygenSaturation: vs.oxygenSaturation,
    systolic: vs.bloodPressureSystolic,
    diastolic: vs.bloodPressureDiastolic,
  }));

  const renderVitalSignCard = (title: string, value: number | null, unit: string, icon: React.ReactNode, type: keyof typeof vitalSignsRanges) => {
    const status = getVitalSignStatus(value, type);
    const statusColor = getStatusColor(status);
    const range = vitalSignsRanges[type];
    
    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">
                {value !== null ? value.toFixed(1) : '--'}
              </span>
              <span className="text-sm text-gray-500 ml-1">{unit}</span>
            </div>
            <Badge className={statusColor}>
              {status === 'normal' ? '正常' : status === 'low' ? '偏低' : status === 'high' ? '偏高' : '未知'}
            </Badge>
            <div className="text-xs text-gray-500">
              正常范围: {range.min} - {range.max} {range.unit}
            </div>
            {value !== null && (
              <Progress 
                value={Math.min(Math.max(((value - range.min) / (range.max - range.min)) * 100, 0), 100)} 
                className="h-2"
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">生命体征监测</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '已连接' : '未连接'}
          </Badge>
          {!isConnected ? (
            <Button onClick={handleDeviceConnection} size="sm">
              连接设备
            </Button>
          ) : (
            <Button 
              onClick={startSimulation} 
              disabled={simulationRunning}
              size="sm"
            >
              {simulationRunning ? '记录中...' : '记录数据'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              预警信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <Badge className={getAlertColor(alert.severity)}>
                    {alert.severity === 'low' ? '低' : alert.severity === 'medium' ? '中' : alert.severity === 'high' ? '高' : '严重'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderVitalSignCard(
          '心率',
          currentReading?.heartRate || null,
          'bpm',
          <Heart className="h-5 w-5 text-red-500" />,
          'heartRate'
        )}
        {renderVitalSignCard(
          '体温',
          currentReading?.temperature || null,
          '°C',
          <Thermometer className="h-5 w-5 text-blue-500" />,
          'temperature'
        )}
        {renderVitalSignCard(
          '血氧饱和度',
          currentReading?.oxygenSaturation || null,
          '%',
          <Droplets className="h-5 w-5 text-blue-600" />,
          'oxygenSaturation'
        )}
        {renderVitalSignCard(
          '收缩压',
          currentReading?.bloodPressureSystolic || null,
          'mmHg',
          <Activity className="h-5 w-5 text-green-500" />,
          'bloodPressureSystolic'
        )}
        {renderVitalSignCard(
          '舒张压',
          currentReading?.bloodPressureDiastolic || null,
          'mmHg',
          <Activity className="h-5 w-5 text-green-600" />,
          'bloodPressureDiastolic'
        )}
        {renderVitalSignCard(
          '呼吸频率',
          currentReading?.respiratoryRate || null,
          '/min',
          <Wind className="h-5 w-5 text-teal-500" />,
          'respiratoryRate'
        )}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                心率趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                血压趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="systolic" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="diastolic" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {vitalSigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">还没有生命体征数据</p>
            <p className="text-sm text-gray-400 mt-2">连接您的可穿戴设备开始监测</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}