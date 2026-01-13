'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealPattern } from '@/lib/types';
import { defaultMealPatterns } from '@/data/meal-patterns';
import {
  getCustomMealPatterns,
  addCustomMealPattern,
  updateCustomMealPattern,
  removeCustomMealPattern,
} from '@/lib/storage';

export function useMealPatterns() {
  const [customPatterns, setCustomPatterns] = useState<MealPattern[]>([]);
  const [loading, setLoading] = useState(true);

  // Load custom patterns on mount
  useEffect(() => {
    setCustomPatterns(getCustomMealPatterns());
    setLoading(false);
  }, []);

  // Get all patterns (default + custom)
  const allPatterns = [...defaultMealPatterns, ...customPatterns];

  // Add custom pattern
  const add = useCallback((pattern: Omit<MealPattern, 'id'>) => {
    const newPattern = addCustomMealPattern(pattern);
    setCustomPatterns(prev => [...prev, newPattern]);
    return newPattern;
  }, []);

  // Update pattern (only custom patterns can be updated)
  const update = useCallback((id: string, updates: Partial<MealPattern>) => {
    // Check if it's a custom pattern
    if (!id.startsWith('custom-')) {
      console.warn('Cannot update default patterns');
      return null;
    }

    const updated = updateCustomMealPattern(id, updates);
    if (updated) {
      setCustomPatterns(prev => prev.map(p => p.id === id ? updated : p));
    }
    return updated;
  }, []);

  // Remove pattern (only custom patterns can be removed)
  const remove = useCallback((id: string) => {
    // Check if it's a custom pattern
    if (!id.startsWith('custom-')) {
      console.warn('Cannot remove default patterns');
      return false;
    }

    const success = removeCustomMealPattern(id);
    if (success) {
      setCustomPatterns(prev => prev.filter(p => p.id !== id));
    }
    return success;
  }, []);

  // Check if a pattern is custom (editable/deletable)
  const isCustomPattern = useCallback((id: string) => {
    return id.startsWith('custom-');
  }, []);

  // Get pattern by ID
  const getPattern = useCallback((id: string) => {
    return allPatterns.find(p => p.id === id) || null;
  }, [allPatterns]);

  return {
    patterns: allPatterns,
    defaultPatterns: defaultMealPatterns,
    customPatterns,
    loading,
    add,
    update,
    remove,
    isCustomPattern,
    getPattern,
  };
}
