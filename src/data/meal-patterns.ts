import { MealPattern } from '@/lib/types';
import { foodCatalog } from '@/lib/food-catalog';

// The committed food catalog is the single source for built-in patterns.
export const defaultMealPatterns: MealPattern[] = foodCatalog.entries.flatMap(
  entry => entry.kind === 'pattern' && entry.status !== 'archived' && entry.pattern ? [entry.pattern] : []
);

export function getPatternsByMealType(mealType: string): MealPattern[] {
  return defaultMealPatterns.filter(p => p.mealTypes.includes(mealType as MealPattern['mealTypes'][number]));
}

export function getPatternsByTag(tag: string): MealPattern[] {
  return defaultMealPatterns.filter(p => p.tags.includes(tag));
}
