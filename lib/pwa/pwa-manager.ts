/**
 * PWA Manager
 * Central management for PWA features including installation, updates, and offline functionality
 */

import { notificationManager } from './notification-manager';
import { backgroundSyncManager } from './background-sync';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAUpdateInfo {
  available: boolean;
  waiting: ServiceWorker | null;
  skipWaiting: () => Promise<void>;
}

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  serviceWorkerReady: boolean;
  notificationsEnabled: boolean;
  backgroundSyncEnabled: boolean;
  storageUsage?: StorageEstimate;
}

export class PWAManager {
  private static instance: PWAManager;
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private updateInfo: PWAUpdateInfo = { available: false, waiting: null, skipWaiting: async () => {} };
  private listeners: { [key: string]: Function[] } = {};

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  /**
   * Initialize PWA Manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing PWA Manager...');
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Initialize notification manager
      if (this.registration) {
        await notificationManager.initialize(this.registration);
        await backgroundSyncManager.initialize(this.registration);
      }
      
      // Check for app install prompt
      this.setupInstallPrompt();
      
      // Check for updates
      await this.checkForUpdates();
      
      // Monitor storage usage
      this.monitorStorageUsage();
      
      console.log('PWA Manager initialized successfully');
      this.emit('ready');
      
    } catch (error) {
      console.error('Failed to initialize PWA Manager:', error);
      throw error;
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', this.registration);
      
      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        this.handleServiceWorkerUpdate();
      });
      
      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        this.handleServiceWorkerUpdate();
      }
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Handle service worker update
   */
  private handleServiceWorkerUpdate(): void {
    if (!this.registration?.waiting) return;
    
    this.updateInfo = {
      available: true,
      waiting: this.registration.waiting,
      skipWaiting: async () => {
        if (this.registration?.waiting) {
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Wait for controlling change
          return new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              resolve();
              window.location.reload();
            });
          });
        }
      }
    };
    
    this.emit('updateAvailable', this.updateInfo);
    
    // Show update notification
    notificationManager.sendNotification({
      title: '应用更新可用',
      body: '新版本已下载完成，点击刷新应用',
      category: 'general',
      priority: 'normal',
      tag: 'app-update',
      actions: [
        { action: 'update', title: '立即更新' },
        { action: 'later', title: '稍后更新' }
      ],
      data: { type: 'app-update' }
    });
  }

  /**
   * Setup app install prompt
   */
  private setupInstallPrompt(): void {
    if (typeof window === 'undefined') {
      return; // Skip on server side
    }
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as any;
      this.emit('installPromptAvailable');
      console.log('Install prompt available');
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.emit('appInstalled');
      console.log('App installed');
    });
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;
    
    try {
      await this.registration.update();
      console.log('Checked for service worker updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }
    
    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('User accepted PWA install');
        this.emit('installAccepted');
        return true;
      } else {
        console.log('User dismissed PWA install');
        this.emit('installDismissed');
        return false;
      }
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    } finally {
      this.installPrompt = null;
    }
  }

  /**
   * Update PWA
   */
  async updatePWA(): Promise<void> {
    if (!this.updateInfo.available || !this.updateInfo.waiting) {
      console.warn('No update available');
      return;
    }
    
    await this.updateInfo.skipWaiting();
  }

  /**
   * Get PWA status
   */
  async getStatus(): Promise<PWAStatus> {
    const isInstalled = this.isStandalone() || this.isDisplayModeStandalone();
    const storageUsage = await this.getStorageUsage();
    
    return {
      isInstalled,
      isOnline: navigator.onLine,
      isUpdateAvailable: this.updateInfo.available,
      serviceWorkerReady: !!this.registration?.active,
      notificationsEnabled: Notification.permission === 'granted',
      backgroundSyncEnabled: !!(this.registration && 'sync' in this.registration),
      storageUsage
    };
  }

  /**
   * Clear PWA data
   */
  async clearData(): Promise<void> {
    try {
      // Clear caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Clear local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Clear IndexedDB
      await this.clearIndexedDB();
      
      // Clear background sync queue
      backgroundSyncManager.clearSyncQueue();
      
      console.log('PWA data cleared');
      this.emit('dataCleared');
      
    } catch (error) {
      console.error('Failed to clear PWA data:', error);
      throw error;
    }
  }

  /**
   * Monitor storage usage
   */
  private async monitorStorageUsage(): Promise<void> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return;
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      const usagePercent = estimate.usage && estimate.quota ? 
        (estimate.usage / estimate.quota) * 100 : 0;
      
      // Warn if storage usage is high
      if (usagePercent > 80) {
        await notificationManager.sendNotification({
          title: '存储空间不足',
          body: `应用存储使用率已达 ${usagePercent.toFixed(1)}%，建议清理数据`,
          category: 'general',
          priority: 'normal',
          tag: 'storage-warning',
          actions: [
            { action: 'clear-cache', title: '清理缓存' },
            { action: 'view-usage', title: '查看详情' }
          ],
          data: { type: 'storage-warning', usage: estimate }
        });
      }
      
      console.log(`Storage usage: ${(estimate.usage || 0) / 1024 / 1024}MB / ${(estimate.quota || 0) / 1024 / 1024}MB`);
      
    } catch (error) {
      console.error('Failed to monitor storage usage:', error);
    }
  }

  /**
   * Get storage usage
   */
  private async getStorageUsage(): Promise<StorageEstimate | undefined> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return undefined;
    }
    
    try {
      return await navigator.storage.estimate();
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
      return undefined;
    }
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const databases = ['cancer-management-db'];
      let completed = 0;
      
      if (databases.length === 0) {
        resolve();
        return;
      }
      
      databases.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        
        deleteReq.onsuccess = () => {
          completed++;
          if (completed === databases.length) {
            resolve();
          }
        };
        
        deleteReq.onerror = () => {
          completed++;
          if (completed === databases.length) {
            resolve(); // Continue even if some deletions fail
          }
        };
      });
    });
  }

  /**
   * Check if running in standalone mode
   */
  private isStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check display mode
   */
  private isDisplayModeStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') {
      return; // Skip on server side
    }
    
    // Online/offline status
    window.addEventListener('online', () => {
      this.emit('online');
      console.log('App is online');
    });
    
    window.addEventListener('offline', () => {
      this.emit('offline');
      console.log('App is offline');
    });
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Event emitter methods
   */
  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  private emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }

  /**
   * Get install prompt availability
   */
  isInstallPromptAvailable(): boolean {
    return !!this.installPrompt;
  }

  /**
   * Get update availability
   */
  isUpdateAvailable(): boolean {
    return this.updateInfo.available;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();