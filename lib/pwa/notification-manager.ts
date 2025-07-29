/**
 * PWA Notification Manager
 * Handles push notifications, medication reminders, and emergency alerts
 */

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  category?: 'medication' | 'emergency' | 'appointment' | 'monitoring' | 'general';
  actions?: NotificationAction[];
  data?: any;
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_KEY || '';

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize notification system
   */
  async initialize(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration;
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      await this.requestPermission();
    }

    // Set up push subscription if permission granted
    if (Notification.permission === 'granted') {
      await this.setupPushSubscription();
    }

    console.log('Notification system initialized');
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Setup push subscription
   */
  private async setupPushSubscription(): Promise<void> {
    if (!this.registration || !this.vapidPublicKey) {
      console.log('Service worker or VAPID key not available');
      return;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      console.log('Push subscription established');
    } catch (error) {
      console.error('Failed to setup push subscription:', error);
    }
  }

  /**
   * Send notification
   */
  async sendNotification(config: NotificationConfig): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: config.body,
      icon: config.icon || '/icons/icon-192x192.png',
      badge: config.badge || '/icons/badge-72x72.png',
      image: config.image,
      tag: config.tag,
      data: {
        ...config.data,
        category: config.category,
        priority: config.priority,
        timestamp: config.timestamp || Date.now()
      },
      silent: config.silent,
      requireInteraction: config.requireInteraction || config.priority === 'critical',
      actions: config.actions
    };

    // Use service worker registration for better reliability
    if (this.registration) {
      await this.registration.showNotification(config.title, options);
    } else {
      new Notification(config.title, options);
    }
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(medicationName: string, dosage: string, time: string): Promise<void> {
    await this.sendNotification({
      title: '💊 用药提醒',
      body: `该服用 ${medicationName} (${dosage}) 了`,
      category: 'medication',
      priority: 'high',
      tag: `medication-${medicationName}`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '已服用', icon: '/icons/check.png' },
        { action: 'snooze', title: '稍后提醒', icon: '/icons/snooze.png' },
        { action: 'skip', title: '跳过', icon: '/icons/skip.png' }
      ],
      data: {
        medicationName,
        dosage,
        scheduledTime: time,
        type: 'medication-reminder'
      }
    });
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(message: string, location?: string): Promise<void> {
    await this.sendNotification({
      title: '🚨 紧急警报',
      body: message,
      category: 'emergency',
      priority: 'critical',
      tag: 'emergency-alert',
      requireInteraction: true,
      actions: [
        { action: 'call-120', title: '拨打120', icon: '/icons/emergency-call.png' },
        { action: 'view-card', title: '查看急救卡', icon: '/icons/emergency-card.png' },
        { action: 'dismiss', title: '知道了', icon: '/icons/dismiss.png' }
      ],
      data: {
        location,
        type: 'emergency-alert',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Send vital signs alert
   */
  async sendVitalSignsAlert(metric: string, value: number, threshold: number, risk: 'low' | 'medium' | 'high'): Promise<void> {
    const priority = risk === 'high' ? 'critical' : risk === 'medium' ? 'high' : 'normal';
    const icon = risk === 'high' ? '🔴' : risk === 'medium' ? '🟡' : '🟢';
    
    await this.sendNotification({
      title: `${icon} 生命体征异常`,
      body: `${metric}: ${value} (阈值: ${threshold})`,
      category: 'monitoring',
      priority,
      tag: `vital-signs-${metric}`,
      requireInteraction: risk === 'high',
      actions: [
        { action: 'view-details', title: '查看详情', icon: '/icons/view.png' },
        { action: 'record-symptoms', title: '记录症状', icon: '/icons/symptoms.png' },
        { action: 'contact-doctor', title: '联系医生', icon: '/icons/doctor.png' }
      ],
      data: {
        metric,
        value,
        threshold,
        risk,
        type: 'vital-signs-alert'
      }
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(doctorName: string, department: string, time: string): Promise<void> {
    await this.sendNotification({
      title: '📅 就诊提醒',
      body: `明天 ${time} 在 ${department} 看 ${doctorName} 医生`,
      category: 'appointment',
      priority: 'normal',
      tag: `appointment-${time}`,
      actions: [
        { action: 'confirm', title: '确认', icon: '/icons/confirm.png' },
        { action: 'reschedule', title: '改期', icon: '/icons/reschedule.png' },
        { action: 'cancel', title: '取消', icon: '/icons/cancel.png' }
      ],
      data: {
        doctorName,
        department,
        appointmentTime: time,
        type: 'appointment-reminder'
      }
    });
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(config: NotificationConfig, delay: number): Promise<void> {
    setTimeout(() => {
      this.sendNotification(config);
    }, delay);
  }

  /**
   * Cancel notification by tag
   */
  async cancelNotification(tag: string): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  }

  /**
   * Get active notifications
   */
  async getActiveNotifications(): Promise<Notification[]> {
    if (this.registration) {
      return await this.registration.getNotifications();
    }
    return [];
  }

  /**
   * Convert VAPID key
   */
  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();