// apps/web/lib/offline/hooks/use-offline-sync.ts
// React hook for offline synchronization

import { useState, useEffect, useCallback } from 'react';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncAt: number | null;
  hasConflicts: boolean;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingActions: 0,
    lastSyncAt: null,
    hasConflicts: false,
  });

  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || status.isSyncing) return;
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    // Sync logic here
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus(prev => ({ ...prev, isSyncing: false, lastSyncAt: Date.now() }));
  }, [status.isSyncing]);

  const queueAction = useCallback(async (action: any) => {
    console.log('Queueing action:', action);
  }, []);

  return {
    ...status,
    sync,
    queueAction,
  };
}
