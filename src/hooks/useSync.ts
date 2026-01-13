'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHouseholdCode,
  createHousehold,
  joinHousehold,
  syncFromCloud,
  syncToCloud,
  pullAndMerge,
  clearHouseholdCode,
  getState,
  pollForChanges,
} from '@/lib/storage';
import { HouseholdState } from '@/lib/types';

export type SyncStatus = 'disconnected' | 'syncing' | 'synced' | 'error';

// Polling interval in milliseconds (15 seconds when visible)
const POLL_INTERVAL_MS = 15000;

export function useSync(onDataChange?: () => void) {
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Load household code on mount
  useEffect(() => {
    const code = getHouseholdCode();
    setHouseholdCode(code);
    if (code) {
      setSyncStatus('synced');
    }
  }, []);

  // Initial sync on mount if connected
  useEffect(() => {
    if (householdCode) {
      pullAndMerge().then(() => {
        setLastSynced(Date.now());
      });
    }
  }, [householdCode]);

  // Polling function - checks timestamp, fetches full state only if changed
  const poll = useCallback(async () => {
    if (!householdCode || isPollingRef.current) return;

    isPollingRef.current = true;
    try {
      const result = await pollForChanges();
      if (result.updated) {
        setLastSynced(Date.now());
        // Notify parent that data changed so it can refresh
        onDataChange?.();
      }
    } catch (err) {
      console.error('Poll error:', err);
    } finally {
      isPollingRef.current = false;
    }
  }, [householdCode, onDataChange]);

  // Set up visibility-aware polling
  useEffect(() => {
    if (!householdCode) return;

    const startPolling = () => {
      if (pollIntervalRef.current) return; // Already polling
      pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Poll immediately when becoming visible, then start interval
        poll();
        startPolling();
      }
    };

    // Start polling if page is visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [householdCode, poll]);

  // Create a new household
  const create = useCallback(async (): Promise<boolean> => {
    setSyncStatus('syncing');
    setError(null);

    const result = await createHousehold();

    if (result.success && result.code) {
      setHouseholdCode(result.code);
      setSyncStatus('synced');
      setLastSynced(Date.now());
      return true;
    } else {
      setError(result.error || 'Failed to create household');
      setSyncStatus('error');
      return false;
    }
  }, []);

  // Join an existing household
  const join = useCallback(async (code: string): Promise<boolean> => {
    setSyncStatus('syncing');
    setError(null);

    const result = await joinHousehold(code.toUpperCase());

    if (result.success) {
      setHouseholdCode(code.toUpperCase());
      setSyncStatus('synced');
      setLastSynced(Date.now());
      // Trigger page reload to refresh all data
      window.location.reload();
      return true;
    } else {
      setError(result.error || 'Failed to join household');
      setSyncStatus('error');
      return false;
    }
  }, []);

  // Manual sync
  const sync = useCallback(async (): Promise<boolean> => {
    if (!householdCode) return false;

    setSyncStatus('syncing');
    setError(null);

    try {
      const state = await pullAndMerge();
      if (state) {
        setSyncStatus('synced');
        setLastSynced(Date.now());
        return true;
      }
      return false;
    } catch (err) {
      setError('Sync failed');
      setSyncStatus('error');
      return false;
    }
  }, [householdCode]);

  // Disconnect from household
  const disconnect = useCallback(() => {
    clearHouseholdCode();
    setHouseholdCode(null);
    setSyncStatus('disconnected');
    setLastSynced(null);
    setError(null);
  }, []);

  return {
    householdCode,
    syncStatus,
    lastSynced,
    error,
    isConnected: !!householdCode,
    create,
    join,
    sync,
    disconnect,
  };
}
