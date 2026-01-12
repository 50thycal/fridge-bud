'use client';

import { useState, useEffect, useCallback } from 'react';
import { GroceryItem, InventoryItem, IngredientCategory } from '@/lib/types';
import {
  getGroceryItems,
  addGroceryItem,
  toggleGroceryItem,
  removeGroceryItem,
  clearCheckedGroceryItems,
} from '@/lib/storage';
import { deriveGrocerySuggestions } from '@/lib/matching';

export function useGrocery(inventory: InventoryItem[]) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items on mount
  useEffect(() => {
    setItems(getGroceryItems());
    setLoading(false);
  }, []);

  // Add item
  const add = useCallback((
    name: string,
    category: IngredientCategory,
    reason: string = 'Manual add',
    priority: GroceryItem['priority'] = 'manual'
  ) => {
    const newItem = addGroceryItem({ name, category, reason, priority });
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  // Toggle checked
  const toggle = useCallback((id: string) => {
    const success = toggleGroceryItem(id);
    if (success) {
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ));
    }
    return success;
  }, []);

  // Remove item
  const remove = useCallback((id: string) => {
    const success = removeGroceryItem(id);
    if (success) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
    return success;
  }, []);

  // Clear checked items
  const clearChecked = useCallback(() => {
    clearCheckedGroceryItems();
    setItems(prev => prev.filter(item => !item.checked));
  }, []);

  // Get derived suggestions
  const suggestions = useCallback(() => {
    return deriveGrocerySuggestions(inventory);
  }, [inventory]);

  // Sorted items (unchecked first, then by priority)
  const sortedItems = [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;

    const priorityOrder = { urgent: 0, replenish: 1, opportunity: 2, manual: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    items: sortedItems,
    loading,
    add,
    toggle,
    remove,
    clearChecked,
    suggestions,
    uncheckedCount: items.filter(i => !i.checked).length,
  };
}
