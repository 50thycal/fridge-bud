'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getHouseholdCode,
  createHousehold,
  joinHousehold,
  syncFromCloud,
  syncToCloud,
  pullAndMerge,
  clearHouseholdCode,
  getState,
} from '@/lib/storage';
import { HouseholdState } from '@/lib/types';

export type SyncStatus = 'disconnected' | 'syncing' | 'synced' | 'error';

export function useSync() {
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
