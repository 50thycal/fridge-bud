'use client';

import { useCallback, useState } from 'react';
import { PullToRefresh } from '@/components/sync/PullToRefresh';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    // Increment key to trigger re-render of children
    setRefreshKey(k => k + 1);
    // Dispatch custom event for pages to listen to
    window.dispatchEvent(new CustomEvent('fridgebud:sync'));
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div key={refreshKey} className="min-h-screen">
        {children}
      </div>
    </PullToRefresh>
  );
}
