'use client';

import { useMemo, useState, useEffect } from 'react';
import { InventoryItem, MealOpportunity, MealPattern } from '@/lib/types';
import { defaultMealPatterns } from '@/data/meal-patterns';
import { getMealPatterns, arePatternsInitialized, saveMealPatterns, markPatternsInitialized } from '@/lib/storage';
import {
  calculateOpportunities,
  getReadyMeals,
  getAlmostReady,
  getMealsThatUseAgingItems,
} from '@/lib/matching';

export function useMeals(inventory: InventoryItem[]) {
  const [patterns, setPatterns] = useState<MealPattern[]>([]);

  // Load patterns on mount, initialize with defaults if first time
  useEffect(() => {
    if (!arePatternsInitialized()) {
      // First time - initialize with default patterns (assign unique IDs)
      const initialPatterns = defaultMealPatterns.map((pattern, index) => ({
        ...pattern,
        id: `init-${Date.now()}-${index}`,
      }));
      saveMealPatterns(initialPatterns);
      markPatternsInitialized();
      setPatterns(initialPatterns);
    } else {
      setPatterns(getMealPatterns());
    }
  }, []);

  // Calculate all opportunities
  const opportunities = useMemo(() => {
    return calculateOpportunities(inventory, patterns);
  }, [inventory, patterns]);

  // Get ready meals
  const ready = useMemo(() => {
    return getReadyMeals(inventory, patterns);
  }, [inventory, patterns]);

  // Get almost ready meals
  const almostReady = useMemo(() => {
    return getAlmostReady(inventory, patterns);
  }, [inventory, patterns]);

  // Get meals that use aging items
  const usesAging = useMemo(() => {
    return getMealsThatUseAgingItems(inventory, patterns);
  }, [inventory, patterns]);

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
