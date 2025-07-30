'use client';

import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Droplets, Wind, AlertTriangle, Wifi, WifiOff, Battery, Signal, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRealtimeMonitoring } from '@/lib/hooks/use-realtime-monitoring';
import { aiAlertEngine } from '@/lib/realtime/ai-alert-engine';

interface RealtimeVitalSignsDashboardProps {
  userId: number;
}

interface VitalSignCardProps {
  title: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  status: 'normal' | 'low' | 'high' | 'critical' | 'unknown';
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  range: { min: number; max: number };
  trend?: 'up' | 'down' | 'stable';
}

const vitalSignsRanges = {
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  bloodPressureSystolic: { min: 90, max: 140, unit: 'mmHg' },
  bloodPressureDiastolic: { min: 60, max: 90, unit: 'mmHg' },
  temperature: { min: 36.1, max: 37.2, unit: '°C' },
  oxygenSaturation: { min: 95, max: 100, unit: '%' },
  respiratoryRate: { min: 12, max: 20, unit: '/min' },
};

export function RealtimeVitalSignsDashboard({ userId }: RealtimeVitalSignsDashboardProps) {
  const {
    monitoringState,
    liveVitalSigns,
    liveAlerts,
    deviceStatuses,
    connect,
    disconnect,
    sendVitalSigns,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    isConnected,
    hasUnacknowledgedAlerts,
    criticalAlerts,
    connectedDevices,
    bufferedDataCount,
  } = useRealtimeMonitoring(userId);

  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);

  // Generate simulated data for demonstration
  const generateSimulatedData = () => {
    if (!isConnected) return;

    setSimulationRunning(true);
    
    const data = {
      heartRate: 70 + Math.floor(Math.random() * 30),
      bloodPressureSystolic: 120 + Math.floor(Math.random() * 25),
      bloodPressureDiastolic: 80 + Math.floor(Math.random() * 15),
      temperature: 36.5 + Math.random() * 1.0,
      oxygenSaturation: 96 + Math.floor(Math.random() * 4),
      respiratoryRate: 16 + Math.floor(Math.random() * 6),
      deviceId: 'smartwatch-001',
      batteryLevel: 80 + Math.floor(Math.random() * 20),
      signalStrength: 70 + Math.floor(Math.random() * 30),
    };

    sendVitalSigns(data);
    
    setTimeout(() => setSimulationRunning(false), 1000);
  };

  // Initialize AI engine with mock patient profile
  useEffect(() => {
    aiAlertEngine.initialize({
      age: 65,
      gender: 'male',
      cancerType: 'lung',
      stage: 'II',
      treatmentPhase: 'active-treatment',
      medications: ['carboplatin', 'paclitaxel'],
      comorbidities: ['hypertension'],
      baselineVitals: {
        heartRate: 72,
        bloodPressure: [130, 85],
        temperature: 36.8,
        oxygenSaturation: 98,
      },
    });
  }, []);

  // Update historical data when new vital signs arrive
  useEffect(() => {
    if (liveVitalSigns) {
      const newDataPoint = {
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        heartRate: liveVitalSigns.heartRate,
        temperature: liveVitalSigns.temperature,
        oxygenSaturation: liveVitalSigns.oxygenSaturation,
        systolic: liveVitalSigns.bloodPressureSystolic,
        diastolic: liveVitalSigns.bloodPressureDiastolic,
        timestamp: Date.now(),
      };

      setHistoricalData(prev => {
        const updated = [newDataPoint, ...prev];
        return updated.slice(0, 20); // Keep last 20 data points
      });
    }
  }, [liveVitalSigns]);

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
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityIndicator = (quality: VitalSignCardProps['quality']) => {
    switch (quality) {
      case 'excellent':
        return <Signal className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <Signal className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const VitalSignCard = ({ title, value, unit, icon, status, quality, range, trend }: VitalSignCardProps) => {
    const statusColor = getStatusColor(status);
    
    return (
      <Card className={`relative ${quality === 'disconnected' ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {title}
              {getQualityIndicator(quality)}
            </CardTitle>
            <div className="flex items-center gap-1">
              {icon}
              {trend && (
                <div className={`w-2 h-2 rounded-full ${
                  trend === 'up' ? 'bg-red-500' : trend === 'down' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
              )}
            </div>
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
              {status === 'normal' ? '正常' : 
               status === 'low' ? '偏低' : 
               status === 'high' ? '偏高' : 
               status === 'critical' ? '严重' : '未知'}
            </Badge>
            <div className="text-xs text-gray-500">
              正常范围: {range.min} - {range.max} {unit}
            </div>
            {value !== null && (
              <Progress 
                value={Math.min(Math.max(((value - range.min) / (range.max - range.min)) * 100, 0), 100)} 
                className="h-2"
              />
            )}
            {quality === 'disconnected' && (
              <div className="text-xs text-red-500">设备未连接</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          实时生命体征监测
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {monitoringState.connectionState}
          </Badge>
          <Badge variant="outline">
            已接收: {monitoringState.dataReceived} 条数据
          </Badge>
          {bufferedDataCount > 0 && (
            <Badge variant="secondary">
              缓存: {bufferedDataCount} 条
            </Badge>
          )}
          <Button 
            onClick={isConnected ? disconnect : connect} 
            size="sm"
            variant={isConnected ? "outline" : "default"}
          >
            {isConnected ? '断开连接' : '重新连接'}
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">严重警报</AlertTitle>
          <AlertDescription className="text-red-700">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="mb-2 last:mb-0">
                <div className="font-medium">{alert.message}</div>
                <div className="text-sm mt-1">
                  {alert.recommendations?.slice(0, 2).map((rec, i) => (
                    <div key={i}>• {rec}</div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  已知晓
                </Button>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Device Status */}
      {connectedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              设备状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {connectedDevices.map(device => (
                <div key={device.deviceId} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{device.deviceId}</span>
                  {device.batteryLevel && (
                    <div className="flex items-center gap-1">
                      <Battery className={`h-3 w-3 ${device.batteryLevel > 30 ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="text-xs">{device.batteryLevel}%</span>
                    </div>
                  )}
                  {device.signalStrength && (
                    <div className="flex items-center gap-1">
                      <Signal className={`h-3 w-3 ${device.signalStrength > 70 ? 'text-green-600' : 'text-yellow-600'}`} />
                      <span className="text-xs">{device.signalStrength}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Data Generation */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <p className="font-medium">数据模拟器</p>
          <p className="text-sm text-gray-600">生成模拟的实时生命体征数据用于演示</p>
        </div>
        <Button 
          onClick={generateSimulatedData} 
          disabled={!isConnected || simulationRunning}
          className="flex items-center gap-2"
        >
          {simulationRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              生成中...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              生成数据
            </>
          )}
        </Button>
      </div>

      {/* Current Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VitalSignCard
          title="心率"
          value={liveVitalSigns?.heartRate || null}
          unit="bpm"
          icon={<Heart className="h-5 w-5 text-red-500" />}
          status={getVitalSignStatus(liveVitalSigns?.heartRate || null, 'heartRate')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.heartRate}
        />
        <VitalSignCard
          title="体温"
          value={liveVitalSigns?.temperature || null}
          unit="°C"
          icon={<Thermometer className="h-5 w-5 text-blue-500" />}
          status={getVitalSignStatus(liveVitalSigns?.temperature || null, 'temperature')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.temperature}
        />
        <VitalSignCard
          title="血氧饱和度"
          value={liveVitalSigns?.oxygenSaturation || null}
          unit="%"
          icon={<Droplets className="h-5 w-5 text-blue-600" />}
          status={getVitalSignStatus(liveVitalSigns?.oxygenSaturation || null, 'oxygenSaturation')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.oxygenSaturation}
        />
        <VitalSignCard
          title="收缩压"
          value={liveVitalSigns?.bloodPressureSystolic || null}
          unit="mmHg"
          icon={<Activity className="h-5 w-5 text-green-500" />}
          status={getVitalSignStatus(liveVitalSigns?.bloodPressureSystolic || null, 'bloodPressureSystolic')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.bloodPressureSystolic}
        />
        <VitalSignCard
          title="舒张压"
          value={liveVitalSigns?.bloodPressureDiastolic || null}
          unit="mmHg"
          icon={<Activity className="h-5 w-5 text-green-600" />}
          status={getVitalSignStatus(liveVitalSigns?.bloodPressureDiastolic || null, 'bloodPressureDiastolic')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.bloodPressureDiastolic}
        />
        <VitalSignCard
          title="呼吸频率"
          value={liveVitalSigns?.respiratoryRate || null}
          unit="/min"
          icon={<Wind className="h-5 w-5 text-teal-500" />}
          status={getVitalSignStatus(liveVitalSigns?.respiratoryRate || null, 'respiratoryRate')}
          quality={liveVitalSigns?.quality || 'disconnected'}
          range={vitalSignsRanges.respiratoryRate}
        />
      </div>

      {/* Real-time Charts */}
      {historicalData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                实时心率趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historicalData.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[50, 120]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                实时血压趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historicalData.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[60, 180]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="systolic" 
                    stackId="1" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="diastolic" 
                    stackId="1" 
                    stroke="#16a34a" 
                    fill="#16a34a" 
                    fillOpacity={0.6} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Panel */}
      {liveAlerts.length > 0 && showAlerts && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                实时警报 ({liveAlerts.filter(a => !a.acknowledged).length} 未处理)
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearAcknowledgedAlerts}>
                  清除已确认
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAlerts(false)}>
                  隐藏
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {liveAlerts.slice(0, 10).map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border ${
                    alert.acknowledged ? 'bg-gray-50 opacity-60' : 'bg-white'
                  } ${
                    alert.severity === 'critical' ? 'border-red-200' :
                    alert.severity === 'high' ? 'border-orange-200' :
                    alert.severity === 'medium' ? 'border-yellow-200' : 'border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {alert.severity === 'critical' ? '严重' :
                           alert.severity === 'high' ? '高' :
                           alert.severity === 'medium' ? '中' : '低'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString('zh-CN')}
                        </span>
                      </div>
                      <p className="font-medium">{alert.message}</p>
                      {alert.recommendations && alert.recommendations.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          建议：{alert.recommendations.slice(0, 2).join('；')}
                        </div>
                      )}
                    </div>
                    {!alert.acknowledged && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        确认
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Connection State */}
      {!isConnected && (
        <Card>
          <CardContent className="text-center py-8">
            <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">实时监测连接中断</p>
            <p className="text-sm text-gray-400 mb-4">正在尝试重新连接到监测服务器...</p>
            <Button onClick={connect} variant="outline">
              手动重连
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}