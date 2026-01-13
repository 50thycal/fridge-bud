'use client';

import { useMemo, useState, useEffect } from 'react';
import { InventoryItem, MealOpportunity, MealPattern } from '@/lib/types';
import { defaultMealPatterns } from '@/data/meal-patterns';
import { getCustomMealPatterns } from '@/lib/storage';
import {
  calculateOpportunities,
  getReadyMeals,
  getAlmostReady,
  getMealsThatUseAgingItems,
} from '@/lib/matching';

export function useMeals(inventory: InventoryItem[]) {
  const [customPatterns, setCustomPatterns] = useState<MealPattern[]>([]);

  // Load custom patterns on mount
  useEffect(() => {
    setCustomPatterns(getCustomMealPatterns());
  }, []);

  // Combine default and custom patterns
  const allPatterns = useMemo(() => {
    return [...defaultMealPatterns, ...customPatterns];
  }, [customPatterns]);

  // Calculate all opportunities
  const opportunities = useMemo(() => {
    return calculateOpportunities(inventory, allPatterns);
  }, [inventory, allPatterns]);

  // Get ready meals
  const ready = useMemo(() => {
    return getReadyMeals(inventory, allPatterns);
  }, [inventory, allPatterns]);

  // Get almost ready meals
  const almostReady = useMemo(() => {
    return getAlmostReady(inventory, allPatterns);
  }, [inventory, allPatterns]);

  // Get meals that use aging items
  const usesAging = useMemo(() => {
    return getMealsThatUseAgingItems(inventory, allPatterns);
  }, [inventory, allPatterns]);

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
