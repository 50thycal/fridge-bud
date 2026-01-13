'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItemCard } from '@/components/inventory/InventoryItem';
import { AddItemSheet } from '@/components/inventory/AddItemSheet';
import { EditItemSheet } from '@/components/inventory/EditItemSheet';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { InventoryItem, StorageLocation } from '@/lib/types';

export default function InventoryPage() {
  const { items, add, update, remove, getByLocation } = useInventory();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<StorageLocation | 'all'>('all');

  const displayItems = activeTab === 'all' ? items : getByLocation(activeTab);

  // Group by freshness for display
  const urgentItems = displayItems.filter(i => i.freshness === 'useSoon' || i.freshness === 'bad');
  const normalItems = displayItems.filter(i => i.freshness !== 'useSoon' && i.freshness !== 'bad');

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Inventory</h1>
            <Button onClick={() => setShowAddSheet(true)} size="md">
              + Add
            </Button>
          </div>

          {/* Location Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {(['all', 'fridge', 'freezer', 'pantry'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'all' && ` (${items.length})`}
                {tab !== 'all' && ` (${getByLocation(tab).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {displayItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg mb-4">
              {items.length === 0 ? 'No items yet' : `No items in ${activeTab === 'all' ? 'inventory' : activeTab}`}
            </p>
            <Button onClick={() => setShowAddSheet(true)}>
              {items.length === 0 ? 'Add your first item' : 'Add item'}
            </Button>
          </div>
        ) : (
          <>
            {/* Urgent Items */}
            {urgentItems.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-yellow-500 mb-3 uppercase tracking-wide">
                  Use Soon ({urgentItems.length})
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {urgentItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => remove(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Normal Items */}
            {normalItems.length > 0 && (
              <div>
                {urgentItems.length > 0 && (
                  <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
                    Other Items ({normalItems.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {normalItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => remove(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Usage hint */}
        {displayItems.length > 0 && (
          <p className="text-center text-zinc-600 text-sm mt-6">
            Swipe left to delete • Swipe right to edit
          </p>
        )}
      </div>

      {/* Sheets */}
      {showAddSheet && (
        <AddItemSheet
          onAdd={add}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {editingItem && (
        <EditItemSheet
          item={editingItem}
          onUpdate={(updates) => update(editingItem.id, updates)}
          onDelete={() => remove(editingItem.id)}
          onClose={() => setEditingItem(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
