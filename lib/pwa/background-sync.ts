/**
 * Background Sync Manager
 * Handles offline data synchronization for medical data
 */

export interface SyncTask {
  id: string;
  type: 'vital-signs' | 'medication-log' | 'symptoms' | 'emergency-data' | 'medical-records';
  data: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
}

export interface SyncResult {
  success: boolean;
  taskId: string;
  error?: string;
  response?: any;
}

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private registration: ServiceWorkerRegistration | null = null;
  private syncQueue: SyncTask[] = [];
  private readonly STORAGE_KEY = 'cancer-sync-queue';
  private readonly MAX_QUEUE_SIZE = 100;

  private constructor() {
    this.loadSyncQueue();
  }

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /**
   * Initialize background sync
   */
  async initialize(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration;

    // Check if Background Sync is supported
    if ('sync' in registration) {
      console.log('Background Sync supported');
      
      // Process any existing sync tasks
      await this.processSyncQueue();
      
      // Set up periodic sync for critical data
      await this.setupPeriodicSync();
    } else {
      console.warn('Background Sync not supported, using fallback');
      // Fallback to immediate sync when online
      this.setupOnlineListener();
    }

    console.log('Background Sync Manager initialized');
  }

  /**
   * Add task to sync queue
   */
  async addSyncTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    // Add to queue
    this.syncQueue.push(syncTask);
    
    // Ensure queue doesn't exceed max size
    if (this.syncQueue.length > this.MAX_QUEUE_SIZE) {
      // Remove oldest non-critical tasks
      this.syncQueue = this.syncQueue
        .filter(t => t.priority === 'critical')
        .concat(
          this.syncQueue
            .filter(t => t.priority !== 'critical')
            .slice(-this.MAX_QUEUE_SIZE / 2)
        );
    }

    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    // Save queue
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.processSyncQueue();
    } else if (this.registration && 'sync' in this.registration) {
      // Register background sync
      await this.registration.sync.register(`sync-${syncTask.type}`);
    }

    console.log(`Added sync task: ${syncTask.id} (${syncTask.type})`);
    return syncTask.id;
  }

  /**
   * Sync vital signs data
   */
  async syncVitalSigns(data: any): Promise<string> {
    return await this.addSyncTask({
      type: 'vital-signs',
      data,
      priority: 'high',
      maxRetries: 5,
      endpoint: '/api/vital-signs',
      method: 'POST'
    });
  }

  /**
   * Sync medication log
   */
  async syncMedicationLog(data: any): Promise<string> {
    return await this.addSyncTask({
      type: 'medication-log',
      data,
      priority: 'normal',
      maxRetries: 3,
      endpoint: '/api/medications/log',
      method: 'POST'
    });
  }

  /**
   * Sync symptom data
   */
  async syncSymptoms(data: any): Promise<string> {
    return await this.addSyncTask({
      type: 'symptoms',
      data,
      priority: 'high',
      maxRetries: 5,
      endpoint: '/api/symptoms',
      method: 'POST'
    });
  }

  /**
   * Sync emergency data (highest priority)
   */
  async syncEmergencyData(data: any): Promise<string> {
    return await this.addSyncTask({
      type: 'emergency-data',
      data,
      priority: 'critical',
      maxRetries: 10,
      endpoint: '/api/emergency-calls',
      method: 'POST'
    });
  }

  /**
   * Sync medical records
   */
  async syncMedicalRecords(data: any): Promise<string> {
    return await this.addSyncTask({
      type: 'medical-records',
      data,
      priority: 'normal',
      maxRetries: 3,
      endpoint: '/api/medical-records',
      method: 'POST'
    });
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<SyncResult[]> {
    if (this.syncQueue.length === 0) {
      return [];
    }

    console.log(`Processing ${this.syncQueue.length} sync tasks`);
    const results: SyncResult[] = [];
    const tasksToProcess = [...this.syncQueue];
    
    for (const task of tasksToProcess) {
      try {
        const result = await this.executeTask(task);
        results.push(result);

        if (result.success) {
          // Remove successful task from queue
          this.syncQueue = this.syncQueue.filter(t => t.id !== task.id);
        } else {
          // Increment retry count
          const taskIndex = this.syncQueue.findIndex(t => t.id === task.id);
          if (taskIndex !== -1) {
            this.syncQueue[taskIndex].retryCount++;
            
            // Remove task if max retries exceeded
            if (this.syncQueue[taskIndex].retryCount >= task.maxRetries) {
              console.warn(`Task ${task.id} exceeded max retries, removing from queue`);
              this.syncQueue.splice(taskIndex, 1);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        results.push({
          success: false,
          taskId: task.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Save updated queue
    this.saveSyncQueue();
    
    console.log(`Processed ${results.length} tasks, ${results.filter(r => r.success).length} successful`);
    return results;
  }

  /**
   * Execute individual sync task
   */
  private async executeTask(task: SyncTask): Promise<SyncResult> {
    try {
      const response = await fetch(task.endpoint, {
        method: task.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Task-ID': task.id,
          'X-Retry-Count': task.retryCount.toString()
        },
        body: JSON.stringify({
          ...task.data,
          syncMetadata: {
            taskId: task.id,
            originalTimestamp: task.timestamp,
            retryCount: task.retryCount,
            priority: task.priority
          }
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(`Task ${task.id} completed successfully`);
        
        return {
          success: true,
          taskId: task.id,
          response: responseData
        };
      } else {
        const errorText = await response.text();
        console.warn(`Task ${task.id} failed: ${response.status} ${errorText}`);
        
        return {
          success: false,
          taskId: task.id,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      console.error(`Task ${task.id} execution error:`, error);
      return {
        success: false,
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Setup periodic sync for critical data
   */
  private async setupPeriodicSync(): Promise<void> {
    if (!this.registration || !('periodicSync' in this.registration)) {
      console.log('Periodic Background Sync not supported');
      return;
    }

    try {
      // Register periodic sync for vital signs (every 15 minutes)
      await (this.registration as any).periodicSync.register('vital-signs-sync', {
        minInterval: 15 * 60 * 1000 // 15 minutes
      });

      // Register periodic sync for medication reminders (every 30 minutes)
      await (this.registration as any).periodicSync.register('medication-sync', {
        minInterval: 30 * 60 * 1000 // 30 minutes
      });

      console.log('Periodic sync registered');
    } catch (error) {
      console.warn('Failed to register periodic sync:', error);
    }
  }

  /**
   * Setup online listener for fallback
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', async () => {
      console.log('Connection restored, processing sync queue');
      await this.processSyncQueue();
    });
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): { totalTasks: number; tasksByType: Record<string, number>; tasksByPriority: Record<string, number> } {
    const tasksByType: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};

    this.syncQueue.forEach(task => {
      tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });

    return {
      totalTasks: this.syncQueue.length,
      tasksByType,
      tasksByPriority
    };
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
    console.log('Sync queue cleared');
  }

  /**
   * Save sync queue to local storage
   */
  private saveSyncQueue(): void {
    if (typeof window === 'undefined') {
      return; // Skip on server side
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from local storage
   */
  private loadSyncQueue(): void {
    if (typeof window === 'undefined') {
      return; // Skip on server side
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`Loaded ${this.syncQueue.length} tasks from storage`);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const backgroundSyncManager = BackgroundSyncManager.getInstance();