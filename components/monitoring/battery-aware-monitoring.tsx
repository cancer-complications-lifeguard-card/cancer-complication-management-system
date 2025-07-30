'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Battery, Wifi, Signal, Pause, Play, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeMonitoring } from '@/lib/hooks/use-realtime-monitoring';

interface BatteryAwareMonitoringProps {
  userId: number;
  onSettingsChange?: (settings: MonitoringSettings) => void;
}

interface MonitoringSettings {
  refreshInterval: number;
  enableAdaptiveMode: boolean;
  pauseWhenBackground: boolean;
  lowBatteryThreshold: number;
  networkOptimization: boolean;
  dataCompression: boolean;
}

interface DeviceCapabilities {
  batteryLevel: number | null;
  isCharging: boolean;
  networkEffectiveType: string;
  deviceMemory: number | null;
  hardwareConcurrency: number;
  isBackground: boolean;
  connectionType: string;
}

interface AdaptiveSettings {
  refreshInterval: number;
  chartUpdateInterval: number;
  dataBufferSize: number;
  compressionLevel: 'low' | 'medium' | 'high';
  visualEffects: boolean;
}

const DEFAULT_SETTINGS: MonitoringSettings = {
  refreshInterval: 5000,
  enableAdaptiveMode: true,
  pauseWhenBackground: true,
  lowBatteryThreshold: 20,
  networkOptimization: true,
  dataCompression: true
};

const ADAPTIVE_PROFILES = {
  performance: {
    refreshInterval: 1000,
    chartUpdateInterval: 100,
    dataBufferSize: 100,
    compressionLevel: 'low' as const,
    visualEffects: true
  },
  balanced: {
    refreshInterval: 5000,
    chartUpdateInterval: 500,
    dataBufferSize: 50,
    compressionLevel: 'medium' as const,
    visualEffects: true
  },
  battery: {
    refreshInterval: 30000,
    chartUpdateInterval: 2000,
    dataBufferSize: 20,
    compressionLevel: 'high' as const,
    visualEffects: false
  },
  emergency: {
    refreshInterval: 2000,
    chartUpdateInterval: 200,
    dataBufferSize: 30,
    compressionLevel: 'low' as const,
    visualEffects: false
  }
};

export function BatteryAwareMonitoring({ userId, onSettingsChange }: BatteryAwareMonitoringProps) {
  const [settings, setSettings] = useState<MonitoringSettings>(DEFAULT_SETTINGS);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    batteryLevel: null,
    isCharging: false,
    networkEffectiveType: '4g',
    deviceMemory: null,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isBackground: false,
    connectionType: 'unknown'
  });
  
  const [adaptiveSettings, setAdaptiveSettings] = useState<AdaptiveSettings>(ADAPTIVE_PROFILES.balanced);
  const [currentProfile, setCurrentProfile] = useState<keyof typeof ADAPTIVE_PROFILES>('balanced');
  const [isPaused, setIsPaused] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgLatency: 0,
    dataTransferred: 0,
    batteryUsage: 0,
    cpuUsage: 0
  });

  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  const {
    monitoringState,
    liveVitalSigns,
    liveAlerts,
    isConnected,
    sendVitalSigns,
    connect,
    disconnect
  } = useRealtimeMonitoring(userId);

  // Monitor device capabilities
  useEffect(() => {
    const updateDeviceCapabilities = async () => {
      let batteryInfo = null;
      
      // Get battery information
      if ('getBattery' in navigator) {
        try {
          batteryInfo = await (navigator as any).getBattery();
        } catch (error) {
          console.log('Battery API not available');
        }
      }

      // Get network information
      const networkInfo = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      // Get device memory
      const deviceMemory = (navigator as any).deviceMemory || null;

      setDeviceCapabilities(prev => ({
        ...prev,
        batteryLevel: batteryInfo ? Math.round(batteryInfo.level * 100) : null,
        isCharging: batteryInfo ? batteryInfo.charging : false,
        networkEffectiveType: networkInfo ? networkInfo.effectiveType : '4g',
        deviceMemory,
        connectionType: networkInfo ? networkInfo.type : 'unknown'
      }));

      // Set up battery level monitoring
      if (batteryInfo) {
        const updateBatteryInfo = () => {
          setDeviceCapabilities(prev => ({
            ...prev,
            batteryLevel: Math.round(batteryInfo.level * 100),
            isCharging: batteryInfo.charging
          }));
        };

        batteryInfo.addEventListener('levelchange', updateBatteryInfo);
        batteryInfo.addEventListener('chargingchange', updateBatteryInfo);
      }

      // Set up network monitoring
      if (networkInfo) {
        const updateNetworkInfo = () => {
          setDeviceCapabilities(prev => ({
            ...prev,
            networkEffectiveType: networkInfo.effectiveType,
            connectionType: networkInfo.type
          }));
        };

        networkInfo.addEventListener('change', updateNetworkInfo);
      }
    };

    updateDeviceCapabilities();

    // Monitor page visibility
    const handleVisibilityChange = () => {
      const isBackground = document.hidden;
      setDeviceCapabilities(prev => ({ ...prev, isBackground }));

      if (settings.pauseWhenBackground) {
        if (isBackground) {
          // Delay pause to avoid brief background states
          visibilityTimeoutRef.current = setTimeout(() => {
            setIsPaused(true);
          }, 5000);
        } else {
          if (visibilityTimeoutRef.current) {
            clearTimeout(visibilityTimeoutRef.current);
          }
          setIsPaused(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [settings.pauseWhenBackground]);

  // Adaptive settings calculation
  useEffect(() => {
    if (!settings.enableAdaptiveMode) return;

    const calculateAdaptiveSettings = () => {
      const { batteryLevel, isCharging, networkEffectiveType, deviceMemory } = deviceCapabilities;
      
      let profile: keyof typeof ADAPTIVE_PROFILES = 'balanced';

      // Emergency mode for critical battery
      if (batteryLevel !== null && batteryLevel < 10 && !isCharging) {
        profile = 'emergency';
      }
      // Battery saver mode
      else if (batteryLevel !== null && batteryLevel < settings.lowBatteryThreshold && !isCharging) {
        profile = 'battery';
      }
      // Performance mode for good conditions
      else if (
        (batteryLevel === null || batteryLevel > 80 || isCharging) &&
        ['4g', '5g'].includes(networkEffectiveType) &&
        (deviceMemory === null || deviceMemory >= 4)
      ) {
        profile = 'performance';
      }

      if (profile !== currentProfile) {
        setCurrentProfile(profile);
        setAdaptiveSettings(ADAPTIVE_PROFILES[profile]);
        console.log(`Switched to ${profile} monitoring profile`);
      }
    };

    calculateAdaptiveSettings();
  }, [deviceCapabilities, settings, currentProfile]);

  // Performance monitoring
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        // Calculate average latency from navigation entries
        const navigationEntries = entries.filter(entry => entry.entryType === 'navigation');
        if (navigationEntries.length > 0) {
          const avgLatency = navigationEntries.reduce((sum, entry) => 
            sum + (entry as PerformanceNavigationTiming).responseEnd - (entry as PerformanceNavigationTiming).requestStart, 0
          ) / navigationEntries.length;
          
          setPerformanceMetrics(prev => ({ ...prev, avgLatency }));
        }

        // Calculate data transfer from resource entries
        const resourceEntries = entries.filter(entry => entry.entryType === 'resource');
        const dataTransferred = resourceEntries.reduce((sum, entry) => 
          sum + ((entry as PerformanceResourceTiming).transferSize || 0), 0
        );
        
        setPerformanceMetrics(prev => ({ 
          ...prev, 
          dataTransferred: prev.dataTransferred + dataTransferred 
        }));
      });

      performanceObserverRef.current.observe({ 
        entryTypes: ['navigation', 'resource'],
        buffered: true 
      });
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: Partial<MonitoringSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  }, [settings, onSettingsChange]);

  // Manual profile override
  const handleProfileChange = useCallback((profile: keyof typeof ADAPTIVE_PROFILES) => {
    setCurrentProfile(profile);
    setAdaptiveSettings(ADAPTIVE_PROFILES[profile]);
    
    // Temporarily disable adaptive mode when manually changed
    handleSettingsChange({ enableAdaptiveMode: false });
    
    // Re-enable after 5 minutes
    setTimeout(() => {
      handleSettingsChange({ enableAdaptiveMode: true });
    }, 300000);
  }, [handleSettingsChange]);

  // Pause/resume monitoring
  const toggleMonitoring = useCallback(() => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      disconnect();
    } else {
      connect();
    }
  }, [isPaused, disconnect, connect]);

  return (
    <div className="space-y-6">
      {/* Device Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Battery className={`h-5 w-5 ${deviceCapabilities.batteryLevel && deviceCapabilities.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
            设备状态与性能优化
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Battery Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                <span className="text-sm font-medium">电池</span>
              </div>
              {deviceCapabilities.batteryLevel !== null ? (
                <div className="space-y-1">
                  <div className="text-lg font-bold">
                    {deviceCapabilities.batteryLevel}%
                  </div>
                  <Badge variant={deviceCapabilities.isCharging ? 'default' : 'outline'}>
                    {deviceCapabilities.isCharging ? '🔌 充电中' : '🔋 使用中'}
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-gray-500">电池信息不可用</div>
              )}
            </div>

            {/* Network Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4" />
                <span className="text-sm font-medium">网络</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold">
                  {deviceCapabilities.networkEffectiveType.toUpperCase()}
                </div>
                <Badge variant="outline">
                  {deviceCapabilities.connectionType}
                </Badge>
              </div>
            </div>

            {/* Current Profile */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">模式</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold">
                  {currentProfile === 'performance' ? '高性能' :
                   currentProfile === 'balanced' ? '平衡' :
                   currentProfile === 'battery' ? '省电' : '紧急'}
                </div>
                <Badge variant={
                  settings.enableAdaptiveMode ? 'default' : 'secondary'
                }>
                  {settings.enableAdaptiveMode ? '自适应' : '手动'}
                </Badge>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">性能</span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold">
                  {performanceMetrics.avgLatency > 0 ? 
                    `${Math.round(performanceMetrics.avgLatency)}ms` : 'N/A'}
                </div>
                <Badge variant="outline">
                  延迟
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Adaptive Settings */}
      <Card>
        <CardHeader>
          <CardTitle>当前监测设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">刷新间隔:</span>
              <p className="font-medium">{adaptiveSettings.refreshInterval / 1000}秒</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">图表更新:</span>
              <p className="font-medium">{adaptiveSettings.chartUpdateInterval}ms</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">数据缓冲:</span>
              <p className="font-medium">{adaptiveSettings.dataBufferSize} 条记录</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">压缩级别:</span>
              <p className="font-medium">{adaptiveSettings.compressionLevel}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">监测状态:</span>
            <div className="flex items-center gap-2">
              <Badge variant={isPaused ? 'destructive' : 'default'}>
                {isPaused ? '已暂停' : '运行中'}
              </Badge>
              <Button
                onClick={toggleMonitoring}
                variant="outline"
                size="sm"
                className="min-h-[40px] min-w-[40px]"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Settings */}
      <Card>
        <CardHeader>
          <CardTitle>手动设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Profile Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">性能模式</label>
            <Select value={currentProfile} onValueChange={handleProfileChange}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">高性能模式</SelectItem>
                <SelectItem value="balanced">平衡模式</SelectItem>
                <SelectItem value="battery">省电模式</SelectItem>
                <SelectItem value="emergency">紧急模式</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adaptive Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">智能自适应</label>
              <p className="text-xs text-gray-600">根据设备状态自动调整性能</p>
            </div>
            <Switch
              checked={settings.enableAdaptiveMode}
              onCheckedChange={(checked) => 
                handleSettingsChange({ enableAdaptiveMode: checked })
              }
            />
          </div>

          {/* Low Battery Threshold */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              低电量阈值: {settings.lowBatteryThreshold}%
            </label>
            <Slider
              value={[settings.lowBatteryThreshold]}
              onValueChange={(value) => 
                handleSettingsChange({ lowBatteryThreshold: value[0] })
              }
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          {/* Background Pause */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">后台暂停</label>
              <p className="text-xs text-gray-600">应用在后台时暂停监测</p>
            </div>
            <Switch
              checked={settings.pauseWhenBackground}
              onCheckedChange={(checked) => 
                handleSettingsChange({ pauseWhenBackground: checked })
              }
            />
          </div>

          {/* Network Optimization */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">网络优化</label>
              <p className="text-xs text-gray-600">根据网络状况优化数据传输</p>
            </div>
            <Switch
              checked={settings.networkOptimization}
              onCheckedChange={(checked) => 
                handleSettingsChange({ networkOptimization: checked })
              }
            />
          </div>

          {/* Data Compression */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">数据压缩</label>
              <p className="text-xs text-gray-600">启用数据压缩以节省流量</p>
            </div>
            <Switch
              checked={settings.dataCompression}
              onCheckedChange={(checked) => 
                handleSettingsChange({ dataCompression: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>性能统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">平均延迟:</span>
              <p className="font-medium">
                {performanceMetrics.avgLatency > 0 ? 
                  `${Math.round(performanceMetrics.avgLatency)}ms` : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">数据传输:</span>
              <p className="font-medium">
                {(performanceMetrics.dataTransferred / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}