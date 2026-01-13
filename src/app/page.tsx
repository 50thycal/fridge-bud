'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInventory } from '@/hooks/useInventory';
import { useMeals } from '@/hooks/useMeals';
import { useGrocery } from '@/hooks/useGrocery';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { SyncIndicator } from '@/components/sync/SyncIndicator';
import { SyncSheet } from '@/components/sync/SyncSheet';
import { exportData } from '@/lib/storage';

export default function HomePage() {
  const [showSyncSheet, setShowSyncSheet] = useState(false);
  const { items: inventory, getUrgent } = useInventory();
  const { topSuggestions, readyCount } = useMeals(inventory);
  const { uncheckedCount } = useGrocery(inventory);
  const urgentItems = getUrgent();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fridgebud-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="p-4 pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-bold">FridgeBud</h1>
          <SyncIndicator onClick={() => setShowSyncSheet(true)} />
        </div>
        <p className="text-zinc-500">What&apos;s for dinner?</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/inventory">
            <Card className="text-center hover:bg-zinc-800 transition-colors">
              <div className="text-3xl font-bold text-white">{inventory.length}</div>
              <div className="text-sm text-zinc-500">Items</div>
            </Card>
          </Link>
          <Link href="/meals">
            <Card className="text-center hover:bg-zinc-800 transition-colors">
              <div className="text-3xl font-bold text-green-500">{readyCount}</div>
              <div className="text-sm text-zinc-500">Meals Ready</div>
            </Card>
          </Link>
          <Link href="/grocery">
            <Card className="text-center hover:bg-zinc-800 transition-colors">
              <div className="text-3xl font-bold text-white">{uncheckedCount}</div>
              <div className="text-sm text-zinc-500">To Buy</div>
            </Card>
          </Link>
        </div>

        {/* Urgent Items Alert */}
        {urgentItems.length > 0 && (
          <Link href="/inventory">
            <Card className="border-yellow-600 bg-yellow-950/20">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-500">Use Soon</div>
                  <div className="text-sm text-zinc-400">
                    {urgentItems.slice(0, 3).map(i => i.name).join(', ')}
                    {urgentItems.length > 3 && ` +${urgentItems.length - 3} more`}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Tonight's Suggestions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tonight&apos;s Options</h2>
            <Link href="/meals" className="text-green-500 text-sm font-medium">
              See all →
            </Link>
          </div>

          {topSuggestions.length > 0 ? (
            <div className="space-y-3">
              {topSuggestions.slice(0, 3).map((opportunity) => (
                <Card key={opportunity.pattern.id} className="hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{opportunity.pattern.name}</div>
                      <div className="text-sm text-zinc-400">
                        {opportunity.satisfied.length} ingredients ready
                      </div>
                    </div>
                    <Badge
                      variant={opportunity.frictionLevel === 'ready' ? 'success' : 'warning'}
                    >
                      {opportunity.frictionLevel === 'ready' ? 'Ready' : '1 away'}
                    </Badge>
                  </div>
                  {opportunity.usesAgingItems.length > 0 && (
                    <div className="text-xs text-green-400 mt-2">
                      Uses: {opportunity.usesAgingItems.map(i => i.name).join(', ')}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <p className="text-zinc-500 mb-2">No meal suggestions yet</p>
              <Link href="/inventory">
                <Button size="sm">Add some items</Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/inventory">
              <Card className="hover:bg-zinc-800 transition-colors">
                <div className="text-2xl mb-2">📦</div>
                <div className="font-medium">Add Items</div>
                <div className="text-sm text-zinc-500">Update inventory</div>
              </Card>
            </Link>
            <Link href="/grocery">
              <Card className="hover:bg-zinc-800 transition-colors">
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-medium">Grocery List</div>
                <div className="text-sm text-zinc-500">Shopping mode</div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Data</h2>
          <Card>
            <Button variant="secondary" onClick={handleExport} className="w-full">
              Export Backup (JSON)
            </Button>
            <p className="text-xs text-zinc-600 mt-2 text-center">
              Last updated: {inventory.length > 0 ? 'Just now' : 'Never'}
            </p>
          </Card>
        </section>
      </div>

      <BottomNav />

      {/* Sync Sheet */}
      {showSyncSheet && <SyncSheet onClose={() => setShowSyncSheet(false)} />}
    </div>
  );
}
