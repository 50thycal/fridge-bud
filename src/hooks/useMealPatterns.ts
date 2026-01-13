'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealPattern } from '@/lib/types';
import { defaultMealPatterns } from '@/data/meal-patterns';
import {
  getMealPatterns,
  saveMealPatterns,
  addMealPattern,
  updateMealPattern,
  removeMealPattern,
  arePatternsInitialized,
  markPatternsInitialized,
} from '@/lib/storage';

export function useMealPatterns() {
  const [patterns, setPatterns] = useState<MealPattern[]>([]);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, []);

  // Add pattern
  const add = useCallback((pattern: Omit<MealPattern, 'id'>) => {
    const newPattern = addMealPattern(pattern);
    setPatterns(prev => [...prev, newPattern]);
    return newPattern;
  }, []);

  // Update pattern
  const update = useCallback((id: string, updates: Partial<MealPattern>) => {
    const updated = updateMealPattern(id, updates);
    if (updated) {
      setPatterns(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  }, []);

  // Remove pattern
  const remove = useCallback((id: string) => {
    const success = removeMealPattern(id);
    if (success) {
      setPatterns(prev => prev.filter(p => p.id !== id));
    }
    return success;
  }, []);

  // Get pattern by ID
  const getPattern = useCallback((id: string) => {
    return patterns.find(p => p.id === id) || null;
  }, [patterns]);

  return {
    patterns,
    loading,
    add,
    update,
    remove,
    getPattern,
  };
}
