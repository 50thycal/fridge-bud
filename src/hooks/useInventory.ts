'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, HouseholdState } from '@/lib/types';
import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
} from '@/lib/storage';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items on mount
  useEffect(() => {
    setItems(getInventoryItems());
    setLoading(false);
  }, []);

  // Listen for sync events to refresh data
  useEffect(() => {
    const handleSync = (event: CustomEvent<HouseholdState>) => {
      if (event.detail?.inventory) {
        setItems(event.detail.inventory);
      }
    };

    window.addEventListener('fridgebud-sync', handleSync as EventListener);
    return () => {
      window.removeEventListener('fridgebud-sync', handleSync as EventListener);
    };
  }, []);

  // Add item
  const add = useCallback((item: Omit<InventoryItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    const newItem = addInventoryItem(item);
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  // Update item
  const update = useCallback((id: string, updates: Partial<InventoryItem>) => {
    const updated = updateInventoryItem(id, updates);
    if (updated) {
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    }
    return updated;
  }, []);

  // Remove item
  const remove = useCallback((id: string) => {
    const success = removeInventoryItem(id);
    if (success) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
    return success;
  }, []);

  // Decrement quantity (plenty -> some -> low -> remove)
  const decrement = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.quantity === 'plenty') {
      update(id, { quantity: 'some' });
    } else if (item.quantity === 'some') {
      update(id, { quantity: 'low' });
    } else {
      remove(id);
    }
  }, [items, update, remove]);

  // Get items by location
  const getByLocation = useCallback((location: InventoryItem['location']) => {
    return items.filter(item => item.location === location);
  }, [items]);

  // Get items that need attention (use soon or bad)
  const getUrgent = useCallback(() => {
    return items.filter(item =>
      item.freshness === 'useSoon' || item.freshness === 'bad'
    );
  }, [items]);

  return {
    items,
    loading,
    add,
    update,
    remove,
    decrement,
    getByLocation,
    getUrgent,
  };
}
