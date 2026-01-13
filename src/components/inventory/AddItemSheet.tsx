'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CommonItem, InventoryItem, IngredientCategory, StorageLocation, QuantityLevel } from '@/lib/types';
import { getItemsByCategory, getRecentItems } from '@/data/common-items';
import { getRecentItemNames } from '@/lib/storage';

interface AddItemSheetProps {
  onAdd: (item: Omit<InventoryItem, 'id' | 'addedAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

interface PendingItem {
  name: string;
  category: IngredientCategory;
  location: StorageLocation;
  quantity: QuantityLevel;
}

const categoryLabels: Record<IngredientCategory, string> = {
  protein: 'Protein',
  vegetable: 'Vegetables',
  fruit: 'Fruit',
  dairy: 'Dairy',
  grain: 'Grains',
  condiment: 'Condiments',
  spice: 'Spices',
  beverage: 'Beverages',
  frozen: 'Frozen',
  other: 'Other',
};

const quantityLabels: Record<QuantityLevel, string> = {
  low: 'Low',
  some: 'Some',
  plenty: 'Plenty',
};

export function AddItemSheet({ onAdd, onClose }: AddItemSheetProps) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // Custom mode state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<IngredientCategory>('other');
  const [customLocation, setCustomLocation] = useState<StorageLocation>('fridge');
  const [customQuantity, setCustomQuantity] = useState<QuantityLevel>('plenty');

  const itemsByCategory = getItemsByCategory();
  const recentNames = getRecentItemNames();
  const recentItems = recentNames.length > 0 ? getRecentItems(recentNames) : [];

  const addToPending = (commonItem: CommonItem) => {
    // Check if item already in pending list
    const existingIndex = pendingItems.findIndex(p => p.name === commonItem.name);
    if (existingIndex >= 0) {
      // Remove if already added (toggle behavior)
      setPendingItems(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add to pending
      setPendingItems(prev => [...prev, {
        name: commonItem.name,
        category: commonItem.category,
        location: commonItem.defaultLocation,
        quantity: 'plenty',
      }]);
    }
  };

  const removeFromPending = (index: number) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePendingQuantity = (index: number, quantity: QuantityLevel) => {
    setPendingItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity } : item
    ));
  };

  const handleCustomAdd = () => {
    if (!customName.trim()) return;

    setPendingItems(prev => [...prev, {
      name: customName.trim(),
      category: customCategory,
      location: customLocation,
      quantity: customQuantity,
    }]);

    // Reset custom fields
    setCustomName('');
  };

  const handleDone = () => {
    // Add all pending items
    pendingItems.forEach(item => {
      onAdd({
        name: item.name,
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        freshness: 'fresh',
        confidence: 'sure',
      });
    });
    onClose();
  };

  const isPending = (itemName: string) => pendingItems.some(p => p.name === itemName);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold">Add Items</h2>
            {pendingItems.length > 0 && (
              <p className="text-sm text-green-400">{pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {pendingItems.length > 0 && (
              <Button size="sm" onClick={handleDone}>
                Done
              </Button>
            )}
          </div>
        </div>

        {/* Pending Items Preview */}
        {pendingItems.length > 0 && (
          <div className="p-3 border-b border-zinc-800 bg-zinc-800/50">
            <div className="flex flex-wrap gap-2">
              {pendingItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="bg-green-600/20 border border-green-600/40 text-green-400 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                >
                  <span>{item.name}</span>
                  <select
                    value={item.quantity}
                    onChange={(e) => updatePendingQuantity(index, e.target.value as QuantityLevel)}
                    className="bg-transparent text-green-300 text-xs border-none focus:outline-none cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="low" className="bg-zinc-800 text-white">Low</option>
                    <option value="some" className="bg-zinc-800 text-white">Some</option>
                    <option value="plenty" className="bg-zinc-800 text-white">Plenty</option>
                  </select>
                  <button
                    onClick={() => removeFromPending(index)}
                    className="text-green-300 hover:text-white ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex p-2 gap-2 border-b border-zinc-800">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'quick' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            Quick Add
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'custom' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'quick' ? (
            <>
              {/* Recent Items */}
              {recentItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentItems.slice(0, 6).map((item) => (
                      <button
                        key={item.name}
                        onClick={() => addToPending(item)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          isPending(item.name)
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        }`}
                      >
                        {isPending(item.name) && '✓ '}{item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Tabs */}
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === null
                        ? 'bg-green-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  {Object.entries(itemsByCategory).map(([category]) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category as IngredientCategory)}
                      className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {categoryLabels[category as IngredientCategory]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 gap-2">
                {selectedCategory === null ? (
                  // Show all items grouped
                  Object.entries(itemsByCategory).flatMap(([, items]) => items).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => addToPending(item)}
                      className={`p-3 rounded-xl text-left transition-colors active:scale-95 ${
                        isPending(item.name)
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isPending(item.name) && '✓ '}{item.name}
                    </button>
                  ))
                ) : (
                  // Show selected category items
                  itemsByCategory[selectedCategory]?.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => addToPending(item)}
                      className={`p-3 rounded-xl text-left transition-colors active:scale-95 ${
                        isPending(item.name)
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isPending(item.name) && '✓ '}{item.name}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Custom Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Leftover pasta"
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCustomCategory(key as IngredientCategory)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        customCategory === key
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Location
                </label>
                <div className="flex gap-2">
                  {(['fridge', 'freezer', 'pantry'] as StorageLocation[]).map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setCustomLocation(loc)}
                      className={`flex-1 p-3 rounded-lg font-medium capitalize transition-colors ${
                        customLocation === loc
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Quantity
                </label>
                <div className="flex gap-2">
                  {(['low', 'some', 'plenty'] as QuantityLevel[]).map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setCustomQuantity(qty)}
                      className={`flex-1 p-3 rounded-lg font-medium capitalize transition-colors ${
                        customQuantity === qty
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {quantityLabels[qty]}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCustomAdd}
                disabled={!customName.trim()}
                className="w-full"
                size="lg"
              >
                + Add to List
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Action Bar - Only show when items are pending */}
        {pendingItems.length > 0 && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <Button onClick={handleDone} className="w-full" size="lg">
              Add {pendingItems.length} Item{pendingItems.length !== 1 ? 's' : ''} to Inventory
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
