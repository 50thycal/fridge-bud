'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useGrocery } from '@/hooks/useGrocery';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { IngredientCategory } from '@/lib/types';

export default function GroceryPage() {
  const { items: inventory } = useInventory();
  const { items, add, toggle, remove, clearChecked, suggestions, uncheckedCount } = useGrocery(inventory);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const grocerySuggestions = suggestions();

  const handleAddManual = () => {
    if (!newItemName.trim()) return;
    add(newItemName.trim(), 'other', 'Manual add', 'manual');
    setNewItemName('');
    setShowAddInput(false);
  };

  const handleAddSuggestion = (name: string, reason: string) => {
    add(name, 'other' as IngredientCategory, reason, 'opportunity');
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Grocery List</h1>
          <Button onClick={() => setShowAddInput(true)} size="sm">
            + Add
          </Button>
        </div>
        <p className="text-zinc-500">
          {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to get
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Add Input */}
        {showAddInput && (
          <Card>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name..."
                className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddManual();
                  if (e.key === 'Escape') setShowAddInput(false);
                }}
              />
              <Button onClick={handleAddManual} disabled={!newItemName.trim()}>
                Add
              </Button>
            </div>
          </Card>
        )}

        {/* Suggestions from meal patterns */}
        {grocerySuggestions.length > 0 && items.length === 0 && (
          <section>
            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">
              Suggested Items
            </h2>
            <div className="space-y-2">
              {grocerySuggestions.slice(0, 5).map((suggestion) => (
                <Card
                  key={suggestion.name}
                  padding="sm"
                  className="flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                  onClick={() => handleAddSuggestion(suggestion.name, suggestion.reason)}
                >
                  <div>
                    <div className="font-medium text-white">{suggestion.name}</div>
                    <div className="text-sm text-zinc-500">{suggestion.reason}</div>
                  </div>
                  <span className="text-green-500 text-2xl">+</span>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Current List */}
        {uncheckedItems.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">
              To Get
            </h2>
            <div className="space-y-2">
              {uncheckedItems.map((item) => (
                <Card
                  key={item.id}
                  padding="sm"
                  className="flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => toggle(item.id)}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-zinc-600 flex items-center justify-center">
                    {/* Empty circle */}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-sm text-zinc-500">{item.reason}</div>
                  </div>
                  <Badge variant={item.priority === 'urgent' ? 'danger' : item.priority === 'replenish' ? 'warning' : 'default'}>
                    {item.priority}
                  </Badge>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Got It ({checkedItems.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={clearChecked}>
                Clear
              </Button>
            </div>
            <div className="space-y-2 opacity-60">
              {checkedItems.map((item) => (
                <Card
                  key={item.id}
                  padding="sm"
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggle(item.id)}
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-zinc-400 line-through">{item.name}</div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {items.length === 0 && grocerySuggestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg mb-2">No items yet</p>
            <p className="text-zinc-600 mb-4">Add items to your grocery list</p>
            <Button onClick={() => setShowAddInput(true)}>
              Add First Item
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
