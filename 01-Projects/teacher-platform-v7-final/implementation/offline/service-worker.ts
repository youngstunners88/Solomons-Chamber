// apps/web/public/sw.ts
// Service Worker for Offline-First Architecture
/// <reference lib="webworker" />

const CACHE_NAME = 'teacher-command-center-v7';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Dynamic caches
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';
const IMAGE_CACHE = 'images-v1';

// Install: Cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && !name.startsWith('dynamic'))
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

// Fetch: Cache strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (for now)
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE with background sync
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      event.respondWith(handleMutation(request));
    }
    return;
  }
  
  // Strategy 1: Cache-first for static assets
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Strategy 2: Network-first for API calls (with cache fallback)
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Strategy 3: Stale-while-revalidate for images
  if (isImage(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Background Sync: Queue failed mutations
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(processPendingActions());
  }
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncWhatsAppMessages());
  }
  
  if (event.tag === 'sync-content') {
    event.waitUntil(syncContentChanges());
  }
});

// Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  
  const options: NotificationOptions = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction ?? false,
    actions: data.actions || [],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Teacher Command Center', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  
  const { action, data } = event.notification;
  
  if (action === 'reply') {
    // Handle quick reply
    event.waitUntil(handleQuickReply(data));
  } else {
    // Open app
    event.waitUntil(
      self.clients.openWindow(data.url || '/dashboard')
    );
  }
});

// ==================== CACHE STRATEGIES ====================

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return offline fallback
    return new Response('Offline', { 
      status: 503, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }
}

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return cached version or offline error
    const cached = await cache.match(request);
    
    if (cached) {
      // Add header to indicate cached response
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');
      
      return new Response(cached.body, {
        status: 200,
        statusText: 'OK (from cache)',
        headers,
      });
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline', cached: false }), 
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function staleWhileRevalidate(
  request: Request, 
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Return cached immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

async function networkWithCacheFallback(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// ==================== MUTATION HANDLING ====================

interface QueuedAction {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  body: any;
  retries: number;
}

async function handleMutation(request: Request): Promise<Response> {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Queue for background sync
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      method: request.method,
      url: request.url,
      body: await request.clone().json(),
      retries: 0,
    };
    
    await queueAction(action);
    
    // Register for background sync
    const registration = self.registration;
    if ('sync' in registration) {
      await registration.sync.register('sync-pending-actions');
    }
    
    // Return optimistic response
    return new Response(
      JSON.stringify({ 
        queued: true, 
        id: action.id,
        message: 'Action queued for sync' 
      }), 
      { 
        status: 202, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function queueAction(action: QueuedAction): Promise<void> {
  const db = await openDB('teacher-command-center', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('action-queue')) {
        db.createObjectStore('action-queue', { keyPath: 'id' });
      }
    },
  });
  
  await db.add('action-queue', action);
}

async function processPendingActions(): Promise<void> {
  const db = await openDB('teacher-command-center', 1);
  const actions = await db.getAll('action-queue');
  
  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.body),
      });
      
      if (response.ok) {
        await db.delete('action-queue', action.id);
      } else {
        // Retry logic
        action.retries++;
        if (action.retries < 3) {
          await db.put('action-queue', action);
        } else {
          // Move to failed queue for manual resolution
          await moveToFailedQueue(action);
        }
      }
    } catch (error) {
      // Keep in queue for next sync
      action.retries++;
      await db.put('action-queue', action);
    }
  }
  
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      processed: actions.length,
    });
  });
}

// ==================== WHATSAPP SYNC ====================

async function syncWhatsAppMessages(): Promise<void> {
  // Sync pending WhatsApp messages
  const db = await openDB('teacher-command-center', 1);
  const pendingMessages = await db.getAllFromIndex(
    'whatsapp-messages', 
    'by-status', 
    'pending'
  );
  
  for (const message of pendingMessages) {
    try {
      // Send via Kapso API
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (response.ok) {
        await db.put('whatsapp-messages', { 
          ...message, 
          status: 'sent',
          sentAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('[SW] Failed to sync WhatsApp message:', error);
    }
  }
}

// ==================== CONTENT SYNC ====================

async function syncContentChanges(): Promise<void> {
  // Sync content changes (CRDT merge)
  const db = await openDB('teacher-command-center', 1);
  const changes = await db.getAll('content-changes');
  
  // Batch sync to server
  try {
    const response = await fetch('/api/sync/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });
    
    if (response.ok) {
      // Clear synced changes
      const tx = db.transaction('content-changes', 'readwrite');
      const store = tx.objectStore('content-changes');
      await Promise.all(changes.map(c => store.delete(c.id)));
    }
  } catch (error) {
    console.error('[SW] Failed to sync content:', error);
  }
}

// ==================== UTILITIES ====================

function isStaticAsset(url: URL): boolean {
  return STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/static/');
}

function isAPIRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/');
}

function isImage(request: Request): boolean {
  return request.headers.get('accept')?.includes('image') ?? false;
}

async function handleQuickReply(data: any): Promise<void> {
  // Implementation for quick reply from notification
  console.log('[SW] Quick reply:', data);
}

async function moveToFailedQueue(action: QueuedAction): Promise<void> {
  const db = await openDB('teacher-command-center', 1);
  await db.add('failed-actions', {
    ...action,
    failedAt: Date.now(),
  });
}

// IDB helper (simplified)
interface IDBPDatabase {
  objectStoreNames: DOMStringList;
  createObjectStore(name: string, options?: any): IDBObjectStore;
}

interface OpenDBCallbacks {
  upgrade?(db: IDBPDatabase, oldVersion: number, newVersion: number, transaction: IDBTransaction): void;
}

async function openDB(
  name: string, 
  version: number, 
  callbacks?: OpenDBCallbacks
): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    if (callbacks?.upgrade) {
      request.onupgradeneeded = (event) => {
        const db = request.result as IDBPDatabase;
        callbacks.upgrade!(db, event.oldVersion, event.newVersion, request.transaction!);
      };
    }
  });
}

export {};
