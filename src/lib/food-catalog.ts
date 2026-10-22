import catalog from '../../data/food/catalog.json';
import type { MealPattern } from './types';

export interface FoodEntry {
  id: string;
  kind: 'pattern' | 'recipe' | 'idea';
  status: 'saved' | 'idea' | 'cooked' | 'favorite' | 'archived';
  title: string;
  description: string;
  tags: string[];
  source: {
    type: 'app-default' | 'app-export' | 'user-chat' | 'url';
    reference: string;
    notes: string;
  };
  notes: string[];
  recipe?: {
    servings?: string;
    ingredients: string[];
    steps: string[];
  };
  pattern?: MealPattern;
}

export interface FoodCatalog {
  schemaVersion: 1;
  entries: FoodEntry[];
}

// scripts/validate-food.mjs validates this data before build and merge.
export const foodCatalog = catalog as FoodCatalog;
