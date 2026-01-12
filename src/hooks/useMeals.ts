'use client';

import { useMemo } from 'react';
import { InventoryItem, MealOpportunity } from '@/lib/types';
import {
  calculateOpportunities,
  getReadyMeals,
  getAlmostReady,
  getMealsThatUseAgingItems,
} from '@/lib/matching';

export function useMeals(inventory: InventoryItem[]) {
  // Calculate all opportunities
  const opportunities = useMemo(() => {
    return calculateOpportunities(inventory);
  }, [inventory]);

  // Get ready meals
  const ready = useMemo(() => {
    return getReadyMeals(inventory);
  }, [inventory]);

  // Get almost ready meals
  const almostReady = useMemo(() => {
    return getAlmostReady(inventory);
  }, [inventory]);

  // Get meals that use aging items
  const usesAging = useMemo(() => {
    return getMealsThatUseAgingItems(inventory);
  }, [inventory]);

  // Get top suggestions (ready + prioritize aging items)
  const topSuggestions = useMemo((): MealOpportunity[] => {
    // First, ready meals that use aging items
    const agingReady = ready.filter(o => o.usesAgingItems.length > 0);

    // Then other ready meals
    const otherReady = ready.filter(o => o.usesAgingItems.length === 0);

    // Then almost ready that use aging
    const agingAlmost = almostReady.filter(o => o.usesAgingItems.length > 0);

    return [...agingReady, ...otherReady, ...agingAlmost].slice(0, 5);
  }, [ready, almostReady]);

  return {
    opportunities,
    ready,
    almostReady,
    usesAging,
    topSuggestions,
    readyCount: ready.length,
  };
}
