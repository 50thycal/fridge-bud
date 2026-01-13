'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSync, SyncStatus } from '@/hooks/useSync';

interface SyncSheetProps {
  onClose: () => void;
}

export function SyncSheet({ onClose }: SyncSheetProps) {
  const { householdCode, syncStatus, lastSynced, error, isConnected, create, join, sync, disconnect } = useSync();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    await create();
    setIsCreating(false);
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) return;
    setIsJoining(true);
    const success = await join(joinCode);
    setIsJoining(false);
    if (!success) {
      // Keep input visible on error
    }
  };

  const formatLastSynced = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'syncing': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-zinc-900 w-full max-w-lg rounded-t-3xl p-6 pb-8 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Household Sync</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        {isConnected ? (
          // Connected state
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(syncStatus)}`} />
                  <span className="text-white capitalize">{syncStatus}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Last synced</span>
                <span className="text-white">{formatLastSynced(lastSynced)}</span>
              </div>
            </div>

            {/* Household Code Display */}
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400 text-sm mb-2">Your household code</p>
              <p className="text-3xl font-mono font-bold text-white tracking-widest text-center py-2">
                {householdCode}
              </p>
              <p className="text-zinc-500 text-sm text-center mt-2">
                Share this code with family members to sync
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={sync} variant="secondary" className="w-full" disabled={syncStatus === 'syncing'}>
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button onClick={disconnect} variant="danger" className="w-full">
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          // Disconnected state
          <div className="space-y-6">
            <p className="text-zinc-400 text-center">
              Connect to sync your inventory across devices and keep your data safe in the cloud.
            </p>

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {showJoinInput ? (
              // Join existing household
              <div className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block">Enter household code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="XXXXXX"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-widest placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowJoinInput(false)} variant="secondary" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleJoin}
                    disabled={joinCode.length < 6 || isJoining}
                    className="flex-1"
                  >
                    {isJoining ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </div>
            ) : (
              // Initial options
              <div className="space-y-3">
                <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create New Household'}
                </Button>
                <Button onClick={() => setShowJoinInput(true)} variant="secondary" className="w-full">
                  Join Existing Household
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
