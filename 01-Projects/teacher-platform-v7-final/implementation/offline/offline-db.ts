// apps/web/lib/offline/offline-db.ts
// IndexedDB wrapper for offline-first data storage

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ==================== DATABASE SCHEMA ====================

interface TeacherCommandCenterDB extends DBSchema {
  // User data cache
  'user-profile': {
    key: string;
    value: {
      id: string;
      email: string;
      name: string;
      role: 'teacher' | 'admin';
      preferences: Record<string, any>;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
  
  // Content items (lessons, materials)
  'content-items': {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      type: 'lesson' | 'worksheet' | 'presentation' | 'video';
      source: 'upload' | 'canva' | 'skool' | 'twinkl' | 'pinterest' | 'vk' | 'odnoklassniki';
      sourceData?: {
        canvaDesignId?: string;
        skoolPostId?: string;
        twinklResourceId?: string;
        pinterestPinId?: string;
        vkPostId?: string;
        okPostId?: string;
      };
      files: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        blob?: Blob; // Stored offline
        url: string;
      }>;
      tags: string[];
      metadata: Record<string, any>;
      createdAt: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
      version: number; // For CRDT
      vectorClock: Record<string, number>; // For conflict resolution
    };
    indexes: {
      'by-source': string;
      'by-type': string;
      'by-sync-status': string;
      'by-updated': number;
    };
  };
  
  // WhatsApp messages
  'whatsapp-messages': {
    key: string;
    value: {
      id: string;
      teacherId: string;
      recipientPhone: string;
      templateName: string;
      parameters: Record<string, string>;
      body?: string;
      mediaUrl?: string;
      status: 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
      error?: string;
      createdAt: number;
      sentAt?: number;
      deliveredAt?: number;
      readAt?: number;
      retryCount: number;
    };
    indexes: {
      'by-status': string;
      'by-teacher': string;
      'by-recipient': string;
      'by-created': number;
    };
  };
  
  // Chat conversations
  'chat-conversations': {
    key: string;
    value: {
      id: string;
      type: 'individual' | 'group';
      name: string;
      participants: Array<{
        id: string;
        name: string;
        phone?: string;
        avatar?: string;
      }>;
      lastMessage?: {
        id: string;
        content: string;
        timestamp: number;
        senderId: string;
      };
      unreadCount: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending';
    };
    indexes: {
      'by-updated': number;
      'by-type': string;
    };
  };
  
  // Live session data
  'live-sessions': {
    key: string;
    value: {
      id: string;
      title: string;
      platform: 'classin' | 'paricall';
      platformData: {
        roomId: string;
        joinUrl: string;
        startUrl?: string;
      };
      scheduledAt: number;
      duration: number;
      status: 'scheduled' | 'live' | 'ended' | 'cancelled';
      participants: string[];
      recordingUrl?: string;
      createdAt: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending';
    };
    indexes: {
      'by-status': string;
      'by-scheduled': number;
    };
  };
  
  // Action queue for background sync
  'action-queue': {
    key: string;
    value: QueuedAction;
    indexes: {
      'by-status': string;
      'by-entity': string;
      'by-timestamp': number;
    };
  };
  
  // Failed actions (for manual resolution)
  'failed-actions': {
    key: string;
    value: FailedAction;
    indexes: {
      'by-entity': string;
      'by-failed-at': number;
    };
  };
  
  // Sync metadata
  'sync-metadata': {
    key: string;
    value: {
      key: string;
      lastSyncAt: number;
      lastSyncCursor?: string;
      vectorClock: Record<string, number>;
    };
  };
  
  // Parent/Student contacts
  'contacts': {
    key: string;
    value: {
      id: string;
      type: 'parent' | 'student';
      name: string;
      phone?: string;
      email?: string;
      whatsappOptIn: boolean;
      tags: string[];
      notes: string;
      createdAt: number;
      updatedAt: number;
      syncStatus: 'synced' | 'pending';
    };
    indexes: {
      'by-type': string;
      'by-phone': string;
    };
  };
}

// ==================== ACTION TYPES ====================

export interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'content' | 'message' | 'session' | 'contact' | 'profile';
  entityId: string;
  payload: any;
  timestamp: number;
  vectorClock: Record<string, number>;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

export interface FailedAction extends QueuedAction {
  failedAt: number;
  errorDetails: string;
}

// ==================== DATABASE CLASS ====================

const DB_NAME = 'teacher-command-center';
const DB_VERSION = 1;

export class OfflineDB {
  private db: IDBPDatabase<TeacherCommandCenterDB> | null = null;
  private nodeId: string;
  
  constructor() {
    // Unique node ID for this browser instance
    this.nodeId = this.getOrCreateNodeId();
  }
  
  private getOrCreateNodeId(): string {
    let nodeId = localStorage.getItem('tcc-node-id');
    if (!nodeId) {
      nodeId = crypto.randomUUID();
      localStorage.setItem('tcc-node-id', nodeId);
    }
    return nodeId;
  }
  
  async initialize(): Promise<void> {
    this.db = await openDB<TeacherCommandCenterDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // User profile store
        if (!db.objectStoreNames.contains('user-profile')) {
          db.createObjectStore('user-profile', { keyPath: 'id' });
        }
        
        // Content items store
        if (!db.objectStoreNames.contains('content-items')) {
          const contentStore = db.createObjectStore('content-items', { keyPath: 'id' });
          contentStore.createIndex('by-source', 'source');
          contentStore.createIndex('by-type', 'type');
          contentStore.createIndex('by-sync-status', 'syncStatus');
          contentStore.createIndex('by-updated', 'updatedAt');
        }
        
        // WhatsApp messages store
        if (!db.objectStoreNames.contains('whatsapp-messages')) {
          const messageStore = db.createObjectStore('whatsapp-messages', { keyPath: 'id' });
          messageStore.createIndex('by-status', 'status');
          messageStore.createIndex('by-teacher', 'teacherId');
          messageStore.createIndex('by-recipient', 'recipientPhone');
          messageStore.createIndex('by-created', 'createdAt');
        }
        
        // Chat conversations store
        if (!db.objectStoreNames.contains('chat-conversations')) {
          const convoStore = db.createObjectStore('chat-conversations', { keyPath: 'id' });
          convoStore.createIndex('by-updated', 'updatedAt');
          convoStore.createIndex('by-type', 'type');
        }
        
        // Live sessions store
        if (!db.objectStoreNames.contains('live-sessions')) {
          const sessionStore = db.createObjectStore('live-sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-status', 'status');
          sessionStore.createIndex('by-scheduled', 'scheduledAt');
        }
        
        // Action queue store
        if (!db.objectStoreNames.contains('action-queue')) {
          const actionStore = db.createObjectStore('action-queue', { keyPath: 'id' });
          actionStore.createIndex('by-status', 'status');
          actionStore.createIndex('by-entity', 'entity');
          actionStore.createIndex('by-timestamp', 'timestamp');
        }
        
        // Failed actions store
        if (!db.objectStoreNames.contains('failed-actions')) {
          const failedStore = db.createObjectStore('failed-actions', { keyPath: 'id' });
          failedStore.createIndex('by-entity', 'entity');
          failedStore.createIndex('by-failed-at', 'failedAt');
        }
        
        // Sync metadata store
        if (!db.objectStoreNames.contains('sync-metadata')) {
          db.createObjectStore('sync-metadata', { keyPath: 'key' });
        }
        
        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('by-type', 'type');
          contactStore.createIndex('by-phone', 'phone');
        }
      },
    });
    
    console.log('[OfflineDB] Initialized with node ID:', this.nodeId);
  }
  
  // ==================== CONTENT OPERATIONS ====================
  
  async saveContent(content: Omit<TeacherCommandCenterDB['content-items']['value'], 'vectorClock' | 'version'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.db.get('content-items', content.id);
    const vectorClock = this.incrementVectorClock(existing?.vectorClock);
    
    await this.db.put('content-items', {
      ...content,
      version: (existing?.version ?? 0) + 1,
      vectorClock,
      updatedAt: Date.now(),
    });
    
    // Queue for sync
    await this.queueAction({
      id: crypto.randomUUID(),
      type: existing ? 'update' : 'create',
      entity: 'content',
      entityId: content.id,
      payload: content,
      timestamp: Date.now(),
      vectorClock,
      retries: 0,
      status: 'pending',
    });
  }
  
  async getContent(id: string): Promise<TeacherCommandCenterDB['content-items']['value'] | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('content-items', id);
  }
  
  async getAllContent(options?: {
    source?: string;
    type?: string;
    syncStatus?: string;
    limit?: number;
  }): Promise<TeacherCommandCenterDB['content-items']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const tx = this.db.transaction('content-items', 'readonly');
    const store = tx.objectStore('content-items');
    
    let items: TeacherCommandCenterDB['content-items']['value'][];
    
    if (options?.source) {
      items = await store.index('by-source').getAll(options.source);
    } else if (options?.type) {
      items = await store.index('by-type').getAll(options.type);
    } else if (options?.syncStatus) {
      items = await store.index('by-sync-status').getAll(options.syncStatus);
    } else {
      items = await store.getAll();
    }
    
    await tx.done;
    
    // Sort by updatedAt desc
    items.sort((a, b) => b.updatedAt - a.updatedAt);
    
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    
    return items;
  }
  
  async deleteContent(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const vectorClock = this.incrementVectorClock();
    
    await this.db.delete('content-items', id);
    
    await this.queueAction({
      id: crypto.randomUUID(),
      type: 'delete',
      entity: 'content',
      entityId: id,
      payload: { id },
      timestamp: Date.now(),
      vectorClock,
      retries: 0,
      status: 'pending',
    });
  }
  
  // ==================== WHATSAPP OPERATIONS ====================
  
  async saveMessage(message: Omit<TeacherCommandCenterDB['whatsapp-messages']['value'], 'retryCount'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.put('whatsapp-messages', {
      ...message,
      retryCount: 0,
    });
  }
  
  async getPendingMessages(): Promise<TeacherCommandCenterDB['whatsapp-messages']['value'][]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('whatsapp-messages', 'by-status', 'pending');
  }
  
  async updateMessageStatus(
    id: string, 
    status: TeacherCommandCenterDB['whatsapp-messages']['value']['status'],
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const message = await this.db.get('whatsapp-messages', id);
    if (!message) return;
    
    await this.db.put('whatsapp-messages', {
      ...message,
      status,
      error,
      ...(status === 'sent' && { sentAt: Date.now() }),
      ...(status === 'delivered' && { deliveredAt: Date.now() }),
      ...(status === 'read' && { readAt: Date.now() }),
    });
  }
  
  // ==================== ACTION QUEUE ====================
  
  async queueAction(action: QueuedAction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('action-queue', action);
  }
  
  async getPendingActions(): Promise<QueuedAction[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllFromIndex('action-queue', 'by-status', 'pending');
  }
  
  async updateActionStatus(id: string, status: QueuedAction['status'], error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const action = await this.db.get('action-queue', id);
    if (!action) return;
    
    await this.db.put('action-queue', {
      ...action,
      status,
      error,
    });
  }
  
  async removeAction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('action-queue', id);
  }
  
  async moveToFailed(action: QueuedAction, errorDetails: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.put('failed-actions', {
      ...action,
      failedAt: Date.now(),
      errorDetails,
      status: 'failed',
    });
    
    await this.db.delete('action-queue', action.id);
  }
  
  // ==================== CRDT / SYNC ====================
  
  private incrementVectorClock(existing?: Record<string, number>): Record<string, number> {
    const clock = { ...(existing || {}) };
    clock[this.nodeId] = (clock[this.nodeId] || 0) + 1;
    return clock;
  }
  
  async mergeContent(serverContent: TeacherCommandCenterDB['content-items']['value']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const localContent = await this.db.get('content-items', serverContent.id);
    
    if (!localContent) {
      // No local copy, just save server version
      await this.db.put('content-items', serverContent);
      return;
    }
    
    // Check for conflicts using vector clocks
    const comparison = this.compareVectorClocks(
      localContent.vectorClock,
      serverContent.vectorClock
    );
    
    if (comparison === 'concurrent') {
      // Conflict detected - use LWW with tiebreaker
      if (serverContent.updatedAt > localContent.updatedAt) {
        await this.db.put('content-items', {
          ...serverContent,
          syncStatus: 'synced',
        });
      } else if (serverContent.updatedAt === localContent.updatedAt) {
        // Tiebreaker: server wins (deterministic)
        await this.db.put('content-items', {
          ...serverContent,
          syncStatus: 'synced',
        });
      }
      // Else: local is newer, keep it but mark conflict
    } else if (comparison === 'server-ahead') {
      await this.db.put('content-items', {
        ...serverContent,
        syncStatus: 'synced',
      });
    }
    // Else: local is ahead, keep it
  }
  
  private compareVectorClocks(
    local: Record<string, number>,
    server: Record<string, number>
  ): 'local-ahead' | 'server-ahead' | 'concurrent' {
    const allNodes = new Set([...Object.keys(local), ...Object.keys(server)]);
    
    let localAhead = false;
    let serverAhead = false;
    
    for (const node of allNodes) {
      const localTime = local[node] || 0;
      const serverTime = server[node] || 0;
      
      if (localTime > serverTime) localAhead = true;
      if (serverTime > localTime) serverAhead = true;
    }
    
    if (localAhead && serverAhead) return 'concurrent';
    if (localAhead) return 'local-ahead';
    if (serverAhead) return 'server-ahead';
    return 'concurrent'; // Equal
  }
  
  // ==================== SYNC STATUS ====================
  
  async getSyncMetadata(key: string): Promise<TeacherCommandCenterDB['sync-metadata']['value'] | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('sync-metadata', key);
  }
  
  async updateSyncMetadata(key: string, data: Partial<TeacherCommandCenterDB['sync-metadata']['value']>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.db.get('sync-metadata', key);
    
    await this.db.put('sync-metadata', {
      key,
      lastSyncAt: Date.now(),
      vectorClock: {},
      ...existing,
      ...data,
    });
  }
  
  async getStats(): Promise<{
    contentCount: number;
    pendingMessages: number;
    pendingActions: number;
    failedActions: number;
    storageUsage: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [content, pendingMessages, pendingActions, failedActions] = await Promise.all([
      this.db.count('content-items'),
      this.db.countFromIndex('whatsapp-messages', 'by-status', 'pending'),
      this.db.countFromIndex('action-queue', 'by-status', 'pending'),
      this.db.count('failed-actions'),
    ]);
    
    // Estimate storage usage
    const estimate = await navigator.storage?.estimate?.() || {};
    
    return {
      contentCount: content,
      pendingMessages,
      pendingActions,
      failedActions,
      storageUsage: (estimate.usage || 0) as number,
    };
  }
  
  // ==================== CLEANUP ====================
  
  async clearSyncedData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Keep only pending items
    const tx = this.db.transaction(['content-items', 'whatsapp-messages'], 'readwrite');
    
    const contentStore = tx.objectStore('content-items');
    const allContent = await contentStore.getAll();
    for (const item of allContent) {
      if (item.syncStatus === 'synced') {
        // Keep but clear blob data to save space
        if (item.files) {
          item.files = item.files.map(f => ({ ...f, blob: undefined }));
          await contentStore.put(item);
        }
      }
    }
    
    // Delete old sent messages (older than 30 days)
    const messageStore = tx.objectStore('whatsapp-messages');
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldMessages = await messageStore.index('by-created').getAll(IDBKeyRange.upperBound(thirtyDaysAgo));
    for (const msg of oldMessages) {
      if (msg.status === 'read' || msg.status === 'delivered') {
        await messageStore.delete(msg.id);
      }
    }
    
    await tx.done;
  }
}

// Singleton instance
export const offlineDB = new OfflineDB();
