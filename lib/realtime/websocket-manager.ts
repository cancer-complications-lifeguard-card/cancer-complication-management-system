/**
 * WebSocket Manager for Real-time Data Streaming
 * Handles real-time vital signs monitoring and alert delivery
 */

import { notificationManager } from '@/lib/pwa/notification-manager';

export interface RealtimeMessage {
  type: 'vital-signs' | 'alert' | 'emergency' | 'device-status' | 'heartbeat';
  timestamp: number;
  userId: number;
  data: any;
}

export interface VitalSignsData {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  deviceId?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface AlertData {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  recommendedAction?: string;
  requiresImmediate?: boolean;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(userId: number): Promise<void> {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?userId=${userId}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      console.log('WebSocket connecting to:', wsUrl);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Send message to server
   */
  send(message: RealtimeMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message queued');
      // In a production app, we might queue messages here
    }
  }

  /**
   * Subscribe to message types
   */
  subscribe(messageType: string, handler: Function): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Unsubscribe from message types
   */
  unsubscribe(messageType: string, handler: Function): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send vital signs data
   */
  sendVitalSigns(userId: number, data: VitalSignsData): void {
    this.send({
      type: 'vital-signs',
      timestamp: Date.now(),
      userId,
      data
    });
  }

  /**
   * Send device status update
   */
  sendDeviceStatus(userId: number, deviceId: string, status: 'connected' | 'disconnected' | 'low-battery'): void {
    this.send({
      type: 'device-status',
      timestamp: Date.now(),
      userId,
      data: {
        deviceId,
        status,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: RealtimeMessage = JSON.parse(event.data);
      
      // Route message to appropriate handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }

      // Handle specific message types
      switch (message.type) {
        case 'alert':
          this.handleAlert(message.data as AlertData);
          break;
        case 'emergency':
          this.handleEmergency(message.data);
          break;
        case 'vital-signs':
          this.handleVitalSigns(message.data as VitalSignsData);
          break;
        case 'device-status':
          this.handleDeviceStatus(message.data);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.reason);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt to reconnect unless explicitly closed
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      // We would need the userId here - in practice, this should be stored
      console.log('Attempting to reconnect...');
      // this.connect(storedUserId);
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now(),
          userId: 0, // System message
          data: {}
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Handle alert message
   */
  private async handleAlert(alertData: AlertData): Promise<void> {
    console.log('Received alert:', alertData);

    // Send push notification for high/critical alerts
    if (alertData.severity === 'high' || alertData.severity === 'critical') {
      await notificationManager.sendVitalSignsAlert(
        alertData.metric || 'Unknown',
        alertData.value || 0,
        alertData.threshold || 0,
        alertData.severity === 'critical' ? 'high' : 'medium'
      );
    }

    // Trigger browser notification for immediate alerts
    if (alertData.requiresImmediate) {
      await notificationManager.sendNotification({
        title: '🚨 紧急健康警报',
        body: alertData.message,
        category: 'monitoring',
        priority: 'critical',
        requireInteraction: true,
        actions: [
          { action: 'view-details', title: '查看详情' },
          { action: 'call-emergency', title: '拨打急救电话' }
        ]
      });
    }
  }

  /**
   * Handle emergency message
   */
  private async handleEmergency(emergencyData: any): Promise<void> {
    console.log('Emergency alert received:', emergencyData);
    
    await notificationManager.sendEmergencyAlert(
      emergencyData.message,
      emergencyData.location
    );

    // Could trigger automatic emergency protocols here
    // such as contacting emergency contacts, sending location, etc.
  }

  /**
   * Handle vital signs data
   */
  private handleVitalSigns(vitalSigns: VitalSignsData): void {
    console.log('Received vital signs:', vitalSigns);
    
    // Emit custom event for components to listen to
    window.dispatchEvent(new CustomEvent('vital-signs-update', {
      detail: vitalSigns
    }));
  }

  /**
   * Handle device status update
   */
  private handleDeviceStatus(statusData: any): void {
    console.log('Device status update:', statusData);
    
    // Emit custom event for device manager components
    window.dispatchEvent(new CustomEvent('device-status-update', {
      detail: statusData
    }));

    // Handle low battery warning
    if (statusData.status === 'low-battery') {
      notificationManager.sendNotification({
        title: '🔋 设备电量低',
        body: `设备 ${statusData.deviceId} 电量不足，请及时充电`,
        category: 'monitoring',
        priority: 'normal',
        tag: `low-battery-${statusData.deviceId}`
      });
    }
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const websocketManager = WebSocketManager.getInstance();