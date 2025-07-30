'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, MapPin, Heart, AlertTriangle, Vibrate, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MobileEmergencyInterfaceProps {
  userId: number;
  emergencyCard?: any;
  onEmergencyCall?: () => void;
  onLocationShare?: () => void;
}

interface EmergencyState {
  isEmergencyMode: boolean;
  countdown: number;
  location: GeolocationPosition | null;
  batteryLevel: number | null;
  networkStatus: 'online' | 'offline' | 'slow';
}

export function MobileEmergencyInterface({ 
  userId, 
  emergencyCard,
  onEmergencyCall,
  onLocationShare 
}: MobileEmergencyInterfaceProps) {
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    isEmergencyMode: false,
    countdown: 0,
    location: null,
    batteryLevel: null,
    networkStatus: 'online'
  });

  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');

  // Check for mobile capabilities on mount
  useEffect(() => {
    // Check vibration support
    setVibrationSupported('vibrate' in navigator);

    // Check location permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }

    // Monitor battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setEmergencyState(prev => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100)
        }));

        // Monitor battery level changes
        battery.addEventListener('levelchange', () => {
          setEmergencyState(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100)
          }));
        });
      });
    }

    // Monitor network status
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        setEmergencyState(prev => ({
          ...prev,
          networkStatus: effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'online'
        }));
      } else {
        setEmergencyState(prev => ({
          ...prev,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        }));
      }
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((pattern: number | number[] = 200) => {
    if (vibrationSupported) {
      navigator.vibrate(pattern);
    }
  }, [vibrationSupported]);

  // Audio alert function
  const playAudioAlert = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    if ('AudioContext' in window) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    }
  }, []);

  // Emergency activation with countdown
  const startEmergencyCountdown = useCallback(() => {
    setEmergencyState(prev => ({ ...prev, isEmergencyMode: true, countdown: 5 }));
    
    // Strong haptic feedback pattern
    triggerHapticFeedback([100, 50, 100, 50, 100]);
    
    // Audio alert
    playAudioAlert();

    const countdownInterval = setInterval(() => {
      setEmergencyState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(countdownInterval);
          // Execute emergency call
          handleEmergencyCall();
          return { ...prev, countdown: 0 };
        }
        
        // Haptic feedback for each countdown tick
        triggerHapticFeedback(50);
        
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  }, [triggerHapticFeedback, playAudioAlert]);

  // Cancel emergency countdown
  const cancelEmergencyCountdown = useCallback(() => {
    setEmergencyState(prev => ({ ...prev, isEmergencyMode: false, countdown: 0 }));
    triggerHapticFeedback(25); // Light feedback for cancel
  }, [triggerHapticFeedback]);

  // Handle emergency call
  const handleEmergencyCall = useCallback(async () => {
    try {
      // Get current location if available
      let currentLocation = null;
      if (locationPermission === 'granted') {
        currentLocation = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000
          });
        });
      }

      // Log emergency call
      await fetch('/api/emergency-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          callType: 'emergency',
          location: currentLocation ? {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy
          } : null,
          deviceInfo: {
            batteryLevel: emergencyState.batteryLevel,
            networkStatus: emergencyState.networkStatus,
            timestamp: Date.now()
          }
        })
      });

      // Trigger external callback
      if (onEmergencyCall) {
        onEmergencyCall();
      }

      // Try to make actual call (requires user gesture)
      if ('tel:' in window) {
        window.location.href = 'tel:120';
      }

      // Strong success haptic feedback
      triggerHapticFeedback([200, 100, 200]);

    } catch (error) {
      console.error('Emergency call failed:', error);
      
      // Error haptic feedback
      triggerHapticFeedback([50, 50, 50, 50]);
      
      // Show SMS fallback option
      showSMSFallback();
    }
  }, [userId, emergencyState, locationPermission, onEmergencyCall, triggerHapticFeedback]);

  // SMS fallback for poor network conditions
  const showSMSFallback = useCallback(() => {
    if (emergencyState.networkStatus === 'slow' || emergencyState.networkStatus === 'offline') {
      const smsBody = `EMERGENCY: Medical assistance needed. Patient ID: ${userId}. Location: ${
        emergencyState.location ? 
        `${emergencyState.location.coords.latitude},${emergencyState.location.coords.longitude}` : 
        'Unknown'
      }`;
      
      if ('sms:' in window) {
        window.location.href = `sms:120?body=${encodeURIComponent(smsBody)}`;
      }
    }
  }, [userId, emergencyState]);

  // Quick location sharing
  const shareLocation = useCallback(async () => {
    triggerHapticFeedback(100);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      setEmergencyState(prev => ({ ...prev, location: position }));

      if (onLocationShare) {
        onLocationShare();
      }

      // Success feedback
      triggerHapticFeedback([100, 50, 100]);

    } catch (error) {
      console.error('Location sharing failed:', error);
      triggerHapticFeedback([50, 50, 50]);
    }
  }, [triggerHapticFeedback, onLocationShare]);

  return (
    <div className="space-y-4 p-4">
      {/* Network and Battery Status */}
      <div className="flex items-center justify-between text-sm">
        <Badge variant={emergencyState.networkStatus === 'online' ? 'default' : 'destructive'}>
          {emergencyState.networkStatus === 'online' ? '📶 在线' : 
           emergencyState.networkStatus === 'slow' ? '📶 网络缓慢' : '📵 离线'}
        </Badge>
        {emergencyState.batteryLevel !== null && (
          <Badge variant={emergencyState.batteryLevel > 20 ? 'outline' : 'destructive'}>
            🔋 {emergencyState.batteryLevel}%
          </Badge>
        )}
      </div>

      {/* Emergency Countdown */}
      {emergencyState.isEmergencyMode && (
        <Alert className="border-red-500 bg-red-50 animate-pulse">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">紧急呼叫启动中</AlertTitle>
          <AlertDescription className="text-red-700">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{emergencyState.countdown}秒后自动呼叫120</span>
              <Button 
                onClick={cancelEmergencyCountdown}
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
              >
                取消
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Emergency Button */}
      <Card className="border-red-500 bg-red-50">
        <CardHeader>
          <CardTitle className="text-center text-red-800 flex items-center justify-center gap-2">
            <Heart className="h-6 w-6" />
            紧急医疗救助
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={startEmergencyCountdown}
            disabled={emergencyState.isEmergencyMode}
            className="w-full h-20 text-xl font-bold bg-red-600 hover:bg-red-700 text-white min-h-[80px] touch-manipulation"
            size="lg"
          >
            <div className="flex flex-col items-center gap-2">
              <Phone className="h-8 w-8" />
              <span>紧急呼叫 120</span>
              {vibrationSupported && (
                <div className="flex items-center gap-1 text-sm opacity-80">
                  <Vibrate className="h-4 w-4" />
                  <span>长按启动</span>
                </div>
              )}
            </div>
          </Button>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareLocation}
              variant="outline"
              className="h-16 min-h-[64px] touch-manipulation flex-col gap-1"
              disabled={locationPermission === 'denied'}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-sm">分享位置</span>
            </Button>

            <Button
              onClick={() => playAudioAlert()}
              variant="outline"
              className="h-16 min-h-[64px] touch-manipulation flex-col gap-1"
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-sm">音频警报</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Information Card */}
      {emergencyCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              紧急医疗信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">姓名:</span>
                <p className="truncate">{emergencyCard.patientName}</p>
              </div>
              <div>
                <span className="font-medium">年龄:</span>
                <p>{emergencyCard.age}岁</p>
              </div>
              <div>
                <span className="font-medium">癌症类型:</span>
                <p className="truncate">{emergencyCard.cancerType}</p>
              </div>
              <div>
                <span className="font-medium">血型:</span>
                <p>{emergencyCard.bloodType || 'N/A'}</p>
              </div>
            </div>
            
            {emergencyCard.allergies && (
              <div className="bg-yellow-50 p-2 rounded border-yellow-200 border">
                <span className="font-medium text-yellow-800">过敏史:</span>
                <p className="text-sm text-yellow-700">{emergencyCard.allergies}</p>
              </div>
            )}

            {emergencyCard.currentTreatments && emergencyCard.currentTreatments.length > 0 && (
              <div className="bg-blue-50 p-2 rounded border-blue-200 border">
                <span className="font-medium text-blue-800">当前治疗:</span>
                <p className="text-sm text-blue-700">
                  {emergencyCard.currentTreatments.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Status */}
      {emergencyState.location && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-800">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">位置已获取</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              精度: ±{Math.round(emergencyState.location.coords.accuracy)}米
            </p>
          </CardContent>
        </Card>
      )}

      {/* Network Fallback Options */}
      {emergencyState.networkStatus !== 'online' && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">网络连接问题</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <div className="space-y-2">
              <p>检测到网络连接不稳定，建议使用以下备用选项：</p>
              <div className="flex gap-2">
                <Button
                  onClick={showSMSFallback}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] touch-manipulation"
                >
                  发送紧急短信
                </Button>
                <Button
                  onClick={() => window.location.href = 'tel:120'}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] touch-manipulation"
                >
                  直接拨打120
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Accessibility Features */}
      <div className="text-xs text-gray-500 space-y-1">
        {vibrationSupported && (
          <p>✓ 触觉反馈已启用</p>
        )}
        <p>✓ 大号触摸按钮 (最小44px)</p>
        <p>✓ 高对比度紧急界面</p>
        {locationPermission === 'granted' && (
          <p>✓ 位置服务已授权</p>
        )}
      </div>
    </div>
  );
}