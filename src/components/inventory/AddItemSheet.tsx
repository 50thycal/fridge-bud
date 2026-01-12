'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CommonItem, InventoryItem, IngredientCategory, StorageLocation } from '@/lib/types';
import { commonItems, getItemsByCategory, getRecentItems } from '@/data/common-items';
import { getRecentItemNames } from '@/lib/storage';

interface AddItemSheetProps {
  onAdd: (item: Omit<InventoryItem, 'id' | 'addedAt' | 'updatedAt'>) => void;
  onClose: () => void;
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

export function AddItemSheet({ onAdd, onClose }: AddItemSheetProps) {
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<IngredientCategory>('other');
  const [customLocation, setCustomLocation] = useState<StorageLocation>('fridge');

  const itemsByCategory = getItemsByCategory();
  const recentNames = getRecentItemNames();
  const recentItems = recentNames.length > 0 ? getRecentItems(recentNames) : [];

  const handleQuickAdd = (commonItem: CommonItem) => {
    onAdd({
      name: commonItem.name,
      category: commonItem.category,
      location: commonItem.defaultLocation,
      quantity: 'plenty',
      freshness: 'fresh',
      confidence: 'sure',
    });
    onClose();
  };

  const handleCustomAdd = () => {
    if (!customName.trim()) return;

    onAdd({
      name: customName.trim(),
      category: customCategory,
      location: customLocation,
      quantity: 'plenty',
      freshness: 'fresh',
      confidence: 'sure',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Add Item</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

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
                        onClick={() => handleQuickAdd(item)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Selection */}
              {!selectedCategory ? (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">Categories</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(itemsByCategory).map(([category, items]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category as IngredientCategory)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-xl text-left transition-colors"
                      >
                        <div className="font-semibold">{categoryLabels[category as IngredientCategory]}</div>
                        <div className="text-sm text-zinc-400">{items.length} items</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-green-500 mb-4 font-medium"
                  >
                    ← Back to categories
                  </button>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">
                    {categoryLabels[selectedCategory]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {itemsByCategory[selectedCategory]?.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleQuickAdd(item)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl text-left transition-colors active:scale-95"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

              <Button
                onClick={handleCustomAdd}
                disabled={!customName.trim()}
                className="w-full"
                size="lg"
              >
                Add Item
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
