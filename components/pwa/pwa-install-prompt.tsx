'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { pwaManager, PWAStatus } from '@/lib/pwa/pwa-manager';
import { notificationManager } from '@/lib/pwa/notification-manager';
import { backgroundSyncManager } from '@/lib/pwa/background-sync';
import { 
  Download, 
  Bell, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface PWAInstallPromptProps {
  showDetails?: boolean;
}

export default function PWAInstallPrompt({ showDetails = false }: PWAInstallPromptProps) {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
    serviceWorkerReady: false,
    notificationsEnabled: false,
    backgroundSyncEnabled: false
  });
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ totalTasks: 0, tasksByType: {}, tasksByPriority: {} });

  useEffect(() => {
    initializePWA();
  }, []);

  const initializePWA = async () => {
    try {
      // Initialize PWA Manager
      await pwaManager.initialize();
      
      // Get initial status
      const status = await pwaManager.getStatus();
      setPwaStatus(status);
      
      // Get sync status
      const syncStat = backgroundSyncManager.getSyncQueueStatus();
      setSyncStatus(syncStat);
      
      // Setup event listeners
      pwaManager.on('installPromptAvailable', () => {
        setShowPrompt(true);
      });
      
      pwaManager.on('updateAvailable', () => {
        setShowUpdate(true);
      });
      
      pwaManager.on('online', () => {
        setPwaStatus(prev => ({ ...prev, isOnline: true }));
      });
      
      pwaManager.on('offline', () => {
        setPwaStatus(prev => ({ ...prev, isOnline: false }));
      });
      
      pwaManager.on('appInstalled', () => {
        setShowPrompt(false);
        setPwaStatus(prev => ({ ...prev, isInstalled: true }));
      });
      
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaManager.installPWA();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Failed to install PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaManager.updatePWA();
      setShowUpdate(false);
    } catch (error) {
      console.error('Failed to update PWA:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      await notificationManager.requestPermission();
      const status = await pwaManager.getStatus();
      setPwaStatus(status);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const handleClearData = async () => {
    if (!confirm('确定要清理所有应用数据吗？这将删除所有缓存和离线数据。')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await pwaManager.clearData();
      const status = await pwaManager.getStatus();
      setPwaStatus(status);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const getStorageUsagePercent = () => {
    if (!pwaStatus.storageUsage?.usage || !pwaStatus.storageUsage?.quota) {
      return 0;
    }
    return (pwaStatus.storageUsage.usage / pwaStatus.storageUsage.quota) * 100;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Install Prompt */}
      {showPrompt && !pwaStatus.isInstalled && (
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>将应用安装到您的设备以获得更好的体验</span>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className="ml-2"
            >
              {isInstalling ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isInstalling ? '安装中...' : '立即安装'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Update Prompt */}
      {showUpdate && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>新版本已准备就绪，重启应用以更新</span>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              variant="outline"
              className="ml-2"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? '更新中...' : '立即更新'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Status */}
      {!pwaStatus.isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            您当前处于离线状态，部分功能可能受限。数据将在连接恢复时自动同步。
          </AlertDescription>
        </Alert>
      )}

      {/* PWA Status Details */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              应用状态
            </CardTitle>
            <CardDescription>
              查看应用安装状态、功能可用性和存储使用情况
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">应用已安装</span>
                <Badge variant={pwaStatus.isInstalled ? 'default' : 'secondary'}>
                  {pwaStatus.isInstalled ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {pwaStatus.isInstalled ? '已安装' : '未安装'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">网络连接</span>
                <Badge variant={pwaStatus.isOnline ? 'default' : 'destructive'}>
                  {pwaStatus.isOnline ? (
                    <Wifi className="h-3 w-3 mr-1" />
                  ) : (
                    <WifiOff className="h-3 w-3 mr-1" />
                  )}
                  {pwaStatus.isOnline ? '在线' : '离线'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">服务工作线程</span>
                <Badge variant={pwaStatus.serviceWorkerReady ? 'default' : 'secondary'}>
                  {pwaStatus.serviceWorkerReady ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {pwaStatus.serviceWorkerReady ? '就绪' : '未就绪'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">推送通知</span>
                <Badge variant={pwaStatus.notificationsEnabled ? 'default' : 'secondary'}>
                  {pwaStatus.notificationsEnabled ? (
                    <Bell className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {pwaStatus.notificationsEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">后台同步</span>
                <Badge variant={pwaStatus.backgroundSyncEnabled ? 'default' : 'secondary'}>
                  {pwaStatus.backgroundSyncEnabled ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {pwaStatus.backgroundSyncEnabled ? '支持' : '不支持'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">待同步任务</span>
                <Badge variant={syncStatus.totalTasks > 0 ? 'secondary' : 'default'}>
                  {syncStatus.totalTasks} 个任务
                </Badge>
              </div>
            </div>

            {/* Storage Usage */}
            {pwaStatus.storageUsage && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">存储使用</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(pwaStatus.storageUsage.usage || 0)} / {formatBytes(pwaStatus.storageUsage.quota || 0)}
                  </span>
                </div>
                <Progress value={getStorageUsagePercent()} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {!pwaStatus.notificationsEnabled && (
                <Button
                  onClick={handleEnableNotifications}
                  size="sm"
                  variant="outline"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  启用通知
                </Button>
              )}
              
              {pwaStatus.isInstalled && (
                <Button
                  onClick={handleClearData}
                  disabled={isClearing}
                  size="sm"
                  variant="outline"
                >
                  {isClearing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isClearing ? '清理中...' : '清理数据'}
                </Button>
              )}
            </div>

            {/* Sync Status Details */}
            {syncStatus.totalTasks > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">同步队列</h4>
                <div className="space-y-1">
                  {Object.entries(syncStatus.tasksByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>{count} 个任务</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}