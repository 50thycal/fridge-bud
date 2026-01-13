'use client';

import { useSync } from '@/hooks/useSync';

interface SyncIndicatorProps {
  onClick: () => void;
}

export function SyncIndicator({ onClick }: SyncIndicatorProps) {
  const { householdCode, syncStatus, isConnected } = useSync();

  const getStatusColor = () => {
    if (!isConnected) return 'bg-zinc-600';
    switch (syncStatus) {
      case 'synced': return 'bg-green-500';
      case 'syncing': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm text-zinc-300">
        {isConnected ? householdCode : 'Not synced'}
      </span>
    </button>
  );
}
