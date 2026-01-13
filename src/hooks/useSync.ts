'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHouseholdCode,
  getHouseholdName,
  createHousehold,
  joinHousehold,
  syncFromCloud,
  syncToCloud,
  pullAndMerge,
  clearHouseholdCode,
  getState,
  saveState,
} from '@/lib/storage';
import { HouseholdState } from '@/lib/types';

export type SyncStatus = 'disconnected' | 'syncing' | 'synced' | 'error';

const POLL_INTERVAL = 5000; // Check for updates every 5 seconds

export function useSync() {
  const [householdCode, setHouseholdCodeState] = useState<string | null>(null);
  const [householdName, setHouseholdNameState] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCloudTimestampRef = useRef<number>(0);

  // Load household code on mount
  useEffect(() => {
    const code = getHouseholdCode();
    const name = getHouseholdName();
    setHouseholdCodeState(code);
    setHouseholdNameState(name);
    if (code) {
      setSyncStatus('synced');
    }
  }, []);

  // Poll for updates from cloud
  const pollForUpdates = useCallback(async () => {
    const code = getHouseholdCode();
    if (!code) return;

    try {
      const cloudState = await syncFromCloud();
      if (!cloudState) return;

      const localState = getState();

      // If cloud has newer data, update local
      if (cloudState.lastUpdated > localState.lastUpdated) {
        // Only update if timestamp actually changed (avoid unnecessary re-renders)
        if (cloudState.lastUpdated !== lastCloudTimestampRef.current) {
          lastCloudTimestampRef.current = cloudState.lastUpdated;
          // Save to localStorage without triggering another sync
          if (typeof window !== 'undefined') {
            localStorage.setItem('fridgebud_state', JSON.stringify(cloudState));
          }
          // Dispatch custom event to notify components of data change
          window.dispatchEvent(new CustomEvent('fridgebud-sync', { detail: cloudState }));
          setLastSynced(Date.now());
        }
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  }, []);

  // Start/stop polling based on connection status
  useEffect(() => {
    if (householdCode) {
      // Initial sync
      pullAndMerge().then((state) => {
        if (state) {
          lastCloudTimestampRef.current = state.lastUpdated;
          setLastSynced(Date.now());
        }
      });

      // Start polling
      pollIntervalRef.current = setInterval(pollForUpdates, POLL_INTERVAL);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [householdCode, pollForUpdates]);

  // Create a new household
  const create = useCallback(async (name: string, customCode?: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    setSyncStatus('syncing');
    setError(null);

    const result = await createHousehold(name, customCode);

    if (result.success && result.code) {
      setHouseholdCodeState(result.code);
      setHouseholdNameState(name);
      setSyncStatus('synced');
      setLastSynced(Date.now());
      return { success: true, code: result.code };
    } else {
      setError(result.error || 'Failed to create household');
      setSyncStatus('error');
      return { success: false, error: result.error };
    }
  }, []);

  // Join an existing household
  const join = useCallback(async (code: string): Promise<boolean> => {
    setSyncStatus('syncing');
    setError(null);

    const result = await joinHousehold(code.toUpperCase());

    if (result.success) {
      setHouseholdCodeState(code.toUpperCase());
      setHouseholdNameState(result.state?.householdName || null);
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
        lastCloudTimestampRef.current = state.lastUpdated;
        setSyncStatus('synced');
        setLastSynced(Date.now());
        // Notify components
        window.dispatchEvent(new CustomEvent('fridgebud-sync', { detail: state }));
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
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    clearHouseholdCode();
    setHouseholdCodeState(null);
    setHouseholdNameState(null);
    setSyncStatus('disconnected');
    setLastSynced(null);
    setError(null);
    lastCloudTimestampRef.current = 0;
  }, []);

  return {
    householdCode,
    householdName,
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
