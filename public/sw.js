/**
 * Service Worker for Cancer Management System
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'cancer-management-v1.0.0';
const STATIC_CACHE = 'cancer-management-static-v1.0.0';
const DYNAMIC_CACHE = 'cancer-management-dynamic-v1.0.0';
const OFFLINE_PAGE = '/offline';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/dashboard/emergency',
  '/dashboard/health',
  '/dashboard/monitoring',
  '/dashboard/triage',
  '/manifest.json',
  // CSS and JS will be handled by Next.js automatically
];

// API endpoints to cache for offline access
const CRITICAL_API_CACHE = [
  '/api/user',
  '/api/emergency-cards',
  '/api/medical-profile',
  '/api/medications',
  '/api/vital-signs'
];

// Emergency-related resources (highest priority)
const EMERGENCY_CACHE = [
  '/dashboard/emergency',
  '/api/emergency-cards',
  '/api/emergency-calls'
];

// Medical data that should be available offline
const MEDICAL_DATA_CACHE = [
  '/api/medical-profile',
  '/api/medications',
  '/api/medical-records',
  '/api/vital-signs'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache emergency resources with high priority
      caches.open('emergency-cache-v1').then((cache) => {
        console.log('[SW] Caching emergency resources');
        return cache.addAll(EMERGENCY_CACHE);
      })
    ]).then(() => {
      console.log('[SW] Service worker installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                !cacheName.includes('emergency-cache') &&
                !cacheName.includes('medical-cache')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activation complete');
    })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isEmergencyRequest(url)) {
    event.respondWith(handleEmergencyRequest(request));
  } else if (isMedicalDataRequest(url)) {
    event.respondWith(handleMedicalDataRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Emergency requests - Cache First strategy (highest priority)
async function handleEmergencyRequest(request) {
  try {
    const cache = await caches.open('emergency-cache-v1');
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving emergency data from cache:', request.url);
      // Update cache in background
      fetch(request).then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Silent fail for background update
      
      return cached;
    }
    
    // If not cached, try network
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('[SW] Emergency request failed:', error);
    // Return cached emergency page if available
    const cache = await caches.open('emergency-cache-v1');
    const fallback = await cache.match('/dashboard/emergency');
    return fallback || new Response('Emergency service unavailable', { status: 503 });
  }
}

// Medical data requests - Stale While Revalidate strategy
async function handleMedicalDataRequest(request) {
  try {
    const cache = await caches.open('medical-cache-v1');
    const cached = await cache.match(request);
    
    // Always try to update from network in background
    const networkPromise = fetch(request).then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => null);
    
    // Return cached version immediately if available
    if (cached) {
      console.log('[SW] Serving medical data from cache:', request.url);
      return cached;
    }
    
    // If not cached, wait for network
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
    
    throw new Error('Network and cache both failed');
    
  } catch (error) {
    console.error('[SW] Medical data request failed:', error);
    return new Response(JSON.stringify({
      error: 'Medical data temporarily unavailable',
      offline: true,
      message: '医疗数据暂时不可用，请检查网络连接'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Static assets - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('[SW] Static asset failed:', error);
    return new Response('Resource not available', { status: 404 });
  }
}

// API requests - Network First with cache fallback
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Network failed, checking cache for:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline response for API calls
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      message: '网络不可用，显示缓存数据'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
    
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match(OFFLINE_PAGE);
    return offline || new Response('Offline', { status: 503 });
  }
}

// Generic requests - Network First
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    return cached || new Response('Not available offline', { status: 503 });
  }
}

// Helper functions
function isEmergencyRequest(url) {
  return url.pathname.includes('/emergency') || 
         url.pathname.includes('/api/emergency-');
}

function isMedicalDataRequest(url) {
  return url.pathname.includes('/api/medical-') ||
         url.pathname.includes('/api/medications') ||
         url.pathname.includes('/api/vital-signs') ||
         url.pathname.includes('/dashboard/health');
}

function isStaticAsset(url) {
  return url.pathname.includes('/_next/static/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.includes('/images/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && 
          request.headers.get('accept') && 
          request.headers.get('accept').includes('text/html'));
}

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'emergency-data-sync') {
    event.waitUntil(syncEmergencyData());
  } else if (event.tag === 'medical-data-sync') {
    event.waitUntil(syncMedicalData());
  } else if (event.tag === 'vital-signs-sync') {
    event.waitUntil(syncVitalSigns());
  }
});

// Sync functions
async function syncEmergencyData() {
  try {
    // Get queued emergency data from IndexedDB
    const queuedData = await getQueuedData('emergency');
    
    for (const data of queuedData) {
      await fetch('/api/emergency-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    
    await clearQueuedData('emergency');
    console.log('[SW] Emergency data synced successfully');
    
  } catch (error) {
    console.error('[SW] Emergency sync failed:', error);
  }
}

async function syncMedicalData() {
  try {
    const queuedData = await getQueuedData('medical');
    
    for (const data of queuedData) {
      await fetch(data.endpoint, {
        method: data.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.payload)
      });
    }
    
    await clearQueuedData('medical');
    console.log('[SW] Medical data synced successfully');
    
  } catch (error) {
    console.error('[SW] Medical sync failed:', error);
  }
}

async function syncVitalSigns() {
  try {
    const queuedData = await getQueuedData('vital-signs');
    
    for (const data of queuedData) {
      await fetch('/api/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    
    await clearQueuedData('vital-signs');
    console.log('[SW] Vital signs synced successfully');
    
  } catch (error) {
    console.error('[SW] Vital signs sync failed:', error);
  }
}

// IndexedDB helper functions (simplified)
async function getQueuedData(type) {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function clearQueuedData(type) {
  // Clear queued data from IndexedDB
  console.log(`[SW] Cleared queued ${type} data`);
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'medical-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '查看详情',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/icons/dismiss-action.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('癌症管理系统', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard/health')
    );
  }
  // dismiss action closes notification automatically
});

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (!event.data) {
    console.warn('[SW] Push event without data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);
    
    const options = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image,
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now()
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '癌症管理系统', options)
    );
    
  } catch (error) {
    console.error('[SW] Failed to process push event:', error);
  }
});

// Background sync event handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

// Periodic background sync handler (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);
    
    switch (event.tag) {
      case 'vital-signs-sync':
        event.waitUntil(syncVitalSigns());
        break;
      case 'medication-sync':
        event.waitUntil(syncMedications());
        break;
    }
  });
}

// Handle background sync
async function handleBackgroundSync(tag) {
  try {
    const syncType = tag.replace('sync-', '');
    console.log('[SW] Processing background sync for:', syncType);
    
    // Get pending sync data from cache
    const pendingData = await getPendingSyncData(syncType);
    
    if (pendingData.length === 0) {
      console.log('[SW] No pending sync data for:', syncType);
      return;
    }
    
    // Process each pending item
    for (const item of pendingData) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Background-Sync': 'true'
          },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          await removePendingSyncData(syncType, item.id);
          console.log('[SW] Successfully synced item:', item.id);
        } else {
          console.warn('[SW] Failed to sync item:', item.id, response.status);
        }
      } catch (error) {
        console.error('[SW] Error syncing item:', item.id, error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Sync vital signs data
async function syncVitalSigns() {
  try {
    const pendingData = await getPendingSyncData('vital-signs');
    
    for (const item of pendingData) {
      const response = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Periodic-Sync': 'true'
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        await removePendingSyncData('vital-signs', item.id);
      }
    }
  } catch (error) {
    console.error('[SW] Vital signs sync error:', error);
  }
}

// Sync medication data
async function syncMedications() {
  try {
    const pendingData = await getPendingSyncData('medications');
    
    for (const item of pendingData) {
      const response = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Periodic-Sync': 'true'
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        await removePendingSyncData('medications', item.id);
      }
    }
  } catch (error) {
    console.error('[SW] Medication sync error:', error);
  }
}

// Get pending sync data
async function getPendingSyncData(type) {
  try {
    const cache = await caches.open('sync-queue-v1');
    const response = await cache.match(`/sync-queue/${type}`);
    if (response) {
      const data = await response.json();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error('[SW] Error getting pending sync data:', error);
    return [];
  }
}

// Remove pending sync data
async function removePendingSyncData(type, itemId) {
  try {
    const cache = await caches.open('sync-queue-v1');
    const response = await cache.match(`/sync-queue/${type}`);
    
    if (response) {
      const data = await response.json();
      data.items = data.items.filter(item => item.id !== itemId);
      
      const newResponse = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put(`/sync-queue/${type}`, newResponse);
    }
  } catch (error) {
    console.error('[SW] Error removing pending sync data:', error);
  }
}

// Message event handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker script loaded with PWA features');