'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { InventoryItem, QuantityLevel, FreshnessState, StorageLocation } from '@/lib/types';

interface EditItemSheetProps {
  item: InventoryItem;
  onUpdate: (updates: Partial<InventoryItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EditItemSheet({ item, onUpdate, onDelete, onClose }: EditItemSheetProps) {
  const [quantity, setQuantity] = useState<QuantityLevel>(item.quantity);
  const [freshness, setFreshness] = useState<FreshnessState>(item.freshness);
  const [location, setLocation] = useState<StorageLocation>(item.location);

  const handleSave = () => {
    onUpdate({ quantity, freshness, location });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              How much is left?
            </label>
            <div className="flex gap-2">
              {(['plenty', 'some', 'low'] as QuantityLevel[]).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`flex-1 p-4 rounded-xl font-medium capitalize transition-colors ${
                    quantity === q
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-lg mb-1">
                    {q === 'plenty' ? '●●●' : q === 'some' ? '●●○' : '●○○'}
                  </div>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Freshness */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              How fresh is it?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'fresh', label: 'Fresh', color: 'green' },
                { value: 'good', label: 'Good', color: 'zinc' },
                { value: 'useSoon', label: 'Use Soon', color: 'yellow' },
                { value: 'bad', label: 'Toss It', color: 'red' },
              ] as const).map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setFreshness(value)}
                  className={`p-4 rounded-xl font-medium transition-colors ${
                    freshness === value
                      ? color === 'green'
                        ? 'bg-green-600 text-white'
                        : color === 'yellow'
                        ? 'bg-yellow-600 text-white'
                        : color === 'red'
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Location
            </label>
            <div className="flex gap-2">
              {(['fridge', 'freezer', 'pantry'] as StorageLocation[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`flex-1 p-3 rounded-xl font-medium capitalize transition-colors ${
                    location === loc
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <Button onClick={handleSave} className="w-full" size="lg">
            Save Changes
          </Button>
          <Button onClick={handleDelete} variant="danger" className="w-full" size="lg">
            Remove Item
          </Button>
        </div>
      </div>
    </div>
  );
}
