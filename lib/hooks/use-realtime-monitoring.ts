/**
 * Real-time Monitoring Hook
 * Manages WebSocket connections and live data updates for monitoring dashboards
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketManager, VitalSignsData } from '@/lib/realtime/websocket-manager';
import { aiAlertEngine } from '@/lib/realtime/ai-alert-engine';
import '@/lib/realtime/websocket-simulator'; // Initialize simulator

export interface MonitoringState {
  isConnected: boolean;
  isConnecting: boolean;
  lastUpdate: number | null;
  connectionState: string;
  dataReceived: number;
  alertsReceived: number;
}

export interface LiveVitalSigns extends VitalSignsData {
  timestamp?: number;
  quality?: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export interface LiveAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: number;
  acknowledged?: boolean;
  metric?: string;
  value?: number;
  recommendations?: string[];
}

export interface DeviceStatus {
  deviceId: string;
  status: 'connected' | 'disconnected' | 'low-battery' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: number;
}

export function useRealtimeMonitoring(userId: number) {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    isConnected: false,
    isConnecting: false,
    lastUpdate: null,
    connectionState: 'disconnected',
    dataReceived: 0,
    alertsReceived: 0,
  });

  const [liveVitalSigns, setLiveVitalSigns] = useState<LiveVitalSigns | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [deviceStatuses, setDeviceStatuses] = useState<Map<string, DeviceStatus>>(new Map());
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const dataBufferRef = useRef<VitalSignsData[]>([]);

  /**
   * Connect to real-time monitoring
   */
  const connect = useCallback(async () => {
    if (monitoringState.isConnecting || monitoringState.isConnected) {
      console.log('Already connecting or connected');
      return;
    }

    console.log('Connecting to real-time monitoring...');
    
    setMonitoringState(prev => ({
      ...prev,
      isConnecting: true,
      connectionState: 'connecting'
    }));

    try {
      await websocketManager.connect(userId);
      
      // Set up message handlers
      setupMessageHandlers();
      
      setMonitoringState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionState: 'connected',
        lastUpdate: Date.now()
      }));

      console.log('Connected to real-time monitoring');
    } catch (error) {
      console.error('Failed to connect to real-time monitoring:', error);
      
      setMonitoringState(prev => ({
        ...prev,
        isConnecting: false,
        connectionState: 'error'
      }));

      // Schedule reconnection
      scheduleReconnect();
    }
  }, [userId, monitoringState.isConnecting, monitoringState.isConnected]);

  /**
   * Disconnect from real-time monitoring
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting from real-time monitoring...');
    
    websocketManager.disconnect();
    
    setMonitoringState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionState: 'disconnected'
    }));

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatRef.current) {
      clearTimeout(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  /**
   * Send vital signs data
   */
  const sendVitalSigns = useCallback((data: VitalSignsData) => {
    if (!monitoringState.isConnected) {
      console.warn('Cannot send vital signs: not connected');
      // Buffer data for later transmission
      dataBufferRef.current.push(data);
      return;
    }

    const timestampedData = {
      ...data,
      timestamp: Date.now()
    };

    websocketManager.sendVitalSigns(userId, timestampedData);
    
    // Process through AI engine
    aiAlertEngine.processVitalSigns(timestampedData);
    
    setMonitoringState(prev => ({
      ...prev,
      dataReceived: prev.dataReceived + 1,
      lastUpdate: Date.now()
    }));
  }, [userId, monitoringState.isConnected]);

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setLiveAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  }, []);

  /**
   * Clear acknowledged alerts
   */
  const clearAcknowledgedAlerts = useCallback(() => {
    setLiveAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  /**
   * Get device status
   */
  const getDeviceStatus = useCallback((deviceId: string): DeviceStatus | null => {
    return deviceStatuses.get(deviceId) || null;
  }, [deviceStatuses]);

  /**
   * Setup message handlers
   */
  const setupMessageHandlers = useCallback(() => {
    // Vital signs handler
    const vitalSignsHandler = (message: any) => {
      const data = message.data as VitalSignsData;
      const quality = determineDataQuality(data);
      
      setLiveVitalSigns({
        ...data,
        timestamp: message.timestamp,
        quality
      });

      setMonitoringState(prev => ({
        ...prev,
        dataReceived: prev.dataReceived + 1,
        lastUpdate: Date.now()
      }));
    };

    // Alert handler
    const alertHandler = (message: any) => {
      const alert = message.data as LiveAlert;
      
      setLiveAlerts(prev => {
        // Avoid duplicates
        const existing = prev.find(a => a.id === alert.id);
        if (existing) return prev;
        
        // Add new alert and keep only last 50
        const updated = [alert, ...prev];
        return updated.slice(0, 50);
      });

      setMonitoringState(prev => ({
        ...prev,
        alertsReceived: prev.alertsReceived + 1,
        lastUpdate: Date.now()
      }));
    };

    // Device status handler
    const deviceStatusHandler = (message: any) => {
      const { deviceId, status, batteryLevel, signalStrength } = message.data;
      
      setDeviceStatuses(prev => {
        const updated = new Map(prev);
        updated.set(deviceId, {
          deviceId,
          status,
          batteryLevel,
          signalStrength,
          lastSeen: Date.now()
        });
        return updated;
      });
    };

    // Emergency handler
    const emergencyHandler = (message: any) => {
      const emergencyAlert: LiveAlert = {
        id: `emergency_${Date.now()}`,
        severity: 'critical',
        type: 'emergency',
        message: message.data.message || '紧急情况',
        timestamp: message.timestamp,
        recommendations: ['立即就医', '拨打急救电话']
      };

      setLiveAlerts(prev => [emergencyAlert, ...prev.slice(0, 49)]);
    };

    // Subscribe to message types
    websocketManager.subscribe('vital-signs', vitalSignsHandler);
    websocketManager.subscribe('alert', alertHandler);
    websocketManager.subscribe('device-status', deviceStatusHandler);
    websocketManager.subscribe('emergency', emergencyHandler);

    // Cleanup function
    return () => {
      websocketManager.unsubscribe('vital-signs', vitalSignsHandler);
      websocketManager.unsubscribe('alert', alertHandler);
      websocketManager.unsubscribe('device-status', deviceStatusHandler);
      websocketManager.unsubscribe('emergency', emergencyHandler);
    };
  }, []);

  /**
   * Schedule reconnection
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    const delay = 5000 + Math.random() * 5000; // 5-10 seconds with jitter
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      console.log('Attempting to reconnect...');
      connect();
    }, delay);
  }, [connect]);

  /**
   * Start heartbeat monitoring
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) return;

    heartbeatRef.current = setInterval(() => {
      if (!websocketManager.isConnected()) {
        console.log('Heartbeat detected disconnection');
        setMonitoringState(prev => ({
          ...prev,
          isConnected: false,
          connectionState: 'disconnected'
        }));
        
        scheduleReconnect();
      }
    }, 10000); // Check every 10 seconds
  }, [scheduleReconnect]);

  /**
   * Determine data quality based on various factors
   */
  const determineDataQuality = useCallback((data: VitalSignsData): LiveVitalSigns['quality'] => {
    const deviceStatus = data.deviceId ? deviceStatuses.get(data.deviceId) : null;
    
    if (!deviceStatus || deviceStatus.status === 'disconnected') {
      return 'disconnected';
    }
    
    if (deviceStatus.status === 'error' || deviceStatus.batteryLevel && deviceStatus.batteryLevel < 10) {
      return 'poor';
    }
    
    if (deviceStatus.signalStrength && deviceStatus.signalStrength < 30) {
      return 'poor';
    }
    
    if (deviceStatus.signalStrength && deviceStatus.signalStrength > 80) {
      return 'excellent';
    }
    
    return 'good';
  }, [deviceStatuses]);

  /**
   * Flush buffered data when connection is established
   */
  const flushBufferedData = useCallback(() => {
    if (!monitoringState.isConnected || dataBufferRef.current.length === 0) {
      return;
    }

    console.log(`Flushing ${dataBufferRef.current.length} buffered readings`);
    
    dataBufferRef.current.forEach(data => {
      websocketManager.sendVitalSigns(userId, data);
    });
    
    dataBufferRef.current = [];
  }, [userId, monitoringState.isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [userId]); // Only reconnect if userId changes

  // Flush buffered data when connection is established
  useEffect(() => {
    if (monitoringState.isConnected) {
      startHeartbeat();
      flushBufferedData();
    }
  }, [monitoringState.isConnected, startHeartbeat, flushBufferedData]);

  // Listen for browser events that might affect connection
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser back online, reconnecting...');
      if (!monitoringState.isConnected) {
        connect();
      }
    };

    const handleOffline = () => {
      console.log('Browser offline, monitoring will buffer data');
      setMonitoringState(prev => ({
        ...prev,
        connectionState: 'offline'
      }));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, check connection
        if (!websocketManager.isConnected()) {
          console.log('Page visible, checking connection...');
          connect();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, monitoringState.isConnected]);

  return {
    // State
    monitoringState,
    liveVitalSigns,
    liveAlerts,
    deviceStatuses,
    
    // Actions
    connect,
    disconnect,
    sendVitalSigns,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    getDeviceStatus,
    
    // Computed
    isConnected: monitoringState.isConnected,
    hasUnacknowledgedAlerts: liveAlerts.some(alert => !alert.acknowledged),
    criticalAlerts: liveAlerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged),
    connectedDevices: Array.from(deviceStatuses.values()).filter(device => device.status === 'connected'),
    bufferedDataCount: dataBufferRef.current.length,
  };
}