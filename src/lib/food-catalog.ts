import catalog from '../../data/food/catalog.json';
import type { MealPattern, MealType } from './types';

export interface FoodEntry {
  id: string;
  kind: 'pattern' | 'recipe' | 'idea' | 'meal';
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
  preparedBy?: 'Calvin' | 'Zoe';
  mealTypes?: MealType[];
  ingredients?: {
    name: string;
    certainty: 'confirmed' | 'draft';
    optional: boolean;
    component: string;
    notes?: string;
  }[];
  ingredientReview?: {
    status: 'needs-audit' | 'approved';
    notes: string[];
  };
  meal?: { components: string[] };
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
  activeCollectionId?: string;
  collections?: { id: string; title: string; entryIds: string[] }[];
}

// scripts/validate-food.mjs validates this data before build and merge.
export const foodCatalog = catalog as FoodCatalog;
