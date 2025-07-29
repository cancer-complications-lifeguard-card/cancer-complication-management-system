'use client';

import { useState, useEffect } from 'react';
import { Bluetooth, Watch, Smartphone, Activity, Wifi, WifiOff, Plus, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';

interface Device {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'blood_pressure_monitor' | 'thermometer' | 'pulse_oximeter';
  brand: string;
  model: string;
  connectionType: 'bluetooth' | 'wifi' | 'usb';
  isConnected: boolean;
  lastSync: Date | null;
  batteryLevel: number | null;
  capabilities: string[];
  userId: number;
}

interface DeviceManagerProps {
  userId: number;
}

interface DeviceFormData {
  name: string;
  type: string;
  brand: string;
  model: string;
  connectionType: string;
}

const deviceTypes = [
  { value: 'smartwatch', label: '智能手表', icon: Watch },
  { value: 'fitness_tracker', label: '健身追踪器', icon: Activity },
  { value: 'blood_pressure_monitor', label: '血压计', icon: Activity },
  { value: 'thermometer', label: '体温计', icon: Activity },
  { value: 'pulse_oximeter', label: '血氧仪', icon: Activity },
];

const deviceCapabilities = {
  smartwatch: ['heart_rate', 'steps', 'sleep', 'activity', 'temperature'],
  fitness_tracker: ['heart_rate', 'steps', 'sleep', 'activity'],
  blood_pressure_monitor: ['blood_pressure'],
  thermometer: ['temperature'],
  pulse_oximeter: ['oxygen_saturation', 'heart_rate'],
};

export function DeviceManager({ userId }: DeviceManagerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [scanningDevices, setScanningDevices] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<DeviceFormData>();

  // Mock device data
  const mockDevices: Device[] = [
    {
      id: 'device-1',
      name: 'Apple Watch Series 9',
      type: 'smartwatch',
      brand: 'Apple',
      model: 'Series 9',
      connectionType: 'bluetooth',
      isConnected: true,
      lastSync: new Date(),
      batteryLevel: 85,
      capabilities: ['heart_rate', 'steps', 'sleep', 'activity', 'temperature'],
      userId,
    },
    {
      id: 'device-2',
      name: 'Omron HEM-7156',
      type: 'blood_pressure_monitor',
      brand: 'Omron',
      model: 'HEM-7156',
      connectionType: 'bluetooth',
      isConnected: false,
      lastSync: null,
      batteryLevel: null,
      capabilities: ['blood_pressure'],
      userId,
    },
  ];

  useEffect(() => {
    // Simulate loading devices
    setTimeout(() => {
      setDevices(mockDevices);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDeviceConnection = async (deviceId: string, connect: boolean) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, isConnected: connect, lastSync: connect ? new Date() : null }
        : device
    ));
  };

  const handleDeviceScan = async () => {
    setScanningDevices(true);
    
    // Simulate device discovery
    setTimeout(() => {
      const discovered = [
        { id: 'discovered-1', name: 'Mi Band 7', type: 'fitness_tracker', brand: 'Xiaomi' },
        { id: 'discovered-2', name: 'Galaxy Watch 5', type: 'smartwatch', brand: 'Samsung' },
        { id: 'discovered-3', name: 'Fingertip Pulse Oximeter', type: 'pulse_oximeter', brand: 'Generic' },
      ];
      setDiscoveredDevices(discovered);
      setScanningDevices(false);
    }, 2000);
  };

  const handleAddDevice = async (data: DeviceFormData) => {
    const newDevice: Device = {
      id: `device-${Date.now()}`,
      name: data.name,
      type: data.type as any,
      brand: data.brand,
      model: data.model,
      connectionType: data.connectionType as any,
      isConnected: false,
      lastSync: null,
      batteryLevel: null,
      capabilities: deviceCapabilities[data.type as keyof typeof deviceCapabilities] || [],
      userId,
    };

    setDevices(prev => [...prev, newDevice]);
    setShowAddForm(false);
    reset();
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId));
  };

  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find(dt => dt.value === type);
    return deviceType ? deviceType.icon : Activity;
  };

  const renderDeviceCard = (device: Device) => {
    const Icon = getDeviceIcon(device.type);
    
    return (
      <Card key={device.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${device.isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Icon className={`h-5 w-5 ${device.isConnected ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{device.name}</CardTitle>
                <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={device.isConnected ? 'default' : 'secondary'}>
                {device.isConnected ? '已连接' : '未连接'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDevice(device.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">连接方式:</span>
                <span className="ml-2 text-gray-600">
                  {device.connectionType === 'bluetooth' ? '蓝牙' : 
                   device.connectionType === 'wifi' ? 'WiFi' : 'USB'}
                </span>
              </div>
              {device.batteryLevel && (
                <div>
                  <span className="font-medium">电量:</span>
                  <span className="ml-2 text-gray-600">{device.batteryLevel}%</span>
                </div>
              )}
              {device.lastSync && (
                <div className="col-span-2">
                  <span className="font-medium">上次同步:</span>
                  <span className="ml-2 text-gray-600">
                    {device.lastSync.toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="font-medium text-sm">监测能力:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {device.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability === 'heart_rate' ? '心率' :
                     capability === 'blood_pressure' ? '血压' :
                     capability === 'temperature' ? '体温' :
                     capability === 'oxygen_saturation' ? '血氧' :
                     capability === 'steps' ? '步数' :
                     capability === 'sleep' ? '睡眠' :
                     capability === 'activity' ? '活动' : capability}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={device.isConnected ? 'outline' : 'default'}
                onClick={() => handleDeviceConnection(device.id, !device.isConnected)}
              >
                {device.isConnected ? (
                  <>
                    <WifiOff className="h-4 w-4 mr-1" />
                    断开连接
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-1" />
                    连接设备
                  </>
                )}
              </Button>
              {device.isConnected && (
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-1" />
                  设置
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAddDeviceForm = () => (
    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加设备
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加新设备</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleAddDevice)} className="space-y-4">
          <div>
            <Label htmlFor="name">设备名称 *</Label>
            <Input
              id="name"
              {...register('name', { required: '请输入设备名称' })}
              placeholder="例：我的智能手表"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">设备类型 *</Label>
            <Select onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择设备类型" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">请选择设备类型</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">品牌</Label>
              <Input
                id="brand"
                {...register('brand')}
                placeholder="例：Apple"
              />
            </div>
            <div>
              <Label htmlFor="model">型号</Label>
              <Input
                id="model"
                {...register('model')}
                placeholder="例：Series 9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="connectionType">连接方式 *</Label>
            <Select onValueChange={(value) => setValue('connectionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择连接方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bluetooth">蓝牙</SelectItem>
                <SelectItem value="wifi">WiFi</SelectItem>
                <SelectItem value="usb">USB</SelectItem>
              </SelectContent>
            </Select>
            {errors.connectionType && (
              <p className="text-sm text-red-600 mt-1">请选择连接方式</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button type="submit">
              添加设备
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

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
        <h2 className="text-2xl font-bold">设备管理</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDeviceScan}
            disabled={scanningDevices}
          >
            <Bluetooth className="h-4 w-4 mr-2" />
            {scanningDevices ? '搜索中...' : '搜索设备'}
          </Button>
          {renderAddDeviceForm()}
        </div>
      </div>

      {/* Device Discovery */}
      {discoveredDevices.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">发现的设备</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {discoveredDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-600">{device.brand} - {device.type}</p>
                  </div>
                  <Button size="sm">
                    添加
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map(renderDeviceCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Watch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">还没有添加任何设备</p>
            <p className="text-sm text-gray-400 mt-2">添加您的可穿戴设备开始监测健康数据</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}