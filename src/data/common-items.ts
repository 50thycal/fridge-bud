import { CommonItem } from '@/lib/types';

// Predefined common items for quick-add
// Organized by category for easy browsing

export const commonItems: CommonItem[] = [
  // Proteins
  { name: 'Chicken breast', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 3 },
  { name: 'Chicken thighs', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 3 },
  { name: 'Ground beef', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 2 },
  { name: 'Salmon', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 2 },
  { name: 'Shrimp', category: 'protein', defaultLocation: 'freezer', typicalFreshnessDays: 90 },
  { name: 'Eggs', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 21 },
  { name: 'Tofu', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Bacon', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Sausage', category: 'protein', defaultLocation: 'fridge', typicalFreshnessDays: 5 },

  // Vegetables
  { name: 'Spinach', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 5 },
  { name: 'Broccoli', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 5 },
  { name: 'Bell peppers', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Onions', category: 'vegetable', defaultLocation: 'pantry', typicalFreshnessDays: 30 },
  { name: 'Garlic', category: 'vegetable', defaultLocation: 'pantry', typicalFreshnessDays: 21 },
  { name: 'Tomatoes', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Carrots', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Zucchini', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 5 },
  { name: 'Mushrooms', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 5 },
  { name: 'Lettuce', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 5 },
  { name: 'Cucumber', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Avocado', category: 'vegetable', defaultLocation: 'fridge', typicalFreshnessDays: 4 },
  { name: 'Potatoes', category: 'vegetable', defaultLocation: 'pantry', typicalFreshnessDays: 21 },
  { name: 'Sweet potatoes', category: 'vegetable', defaultLocation: 'pantry', typicalFreshnessDays: 21 },

  // Fruits
  { name: 'Bananas', category: 'fruit', defaultLocation: 'pantry', typicalFreshnessDays: 5 },
  { name: 'Apples', category: 'fruit', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Lemons', category: 'fruit', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Limes', category: 'fruit', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Berries', category: 'fruit', defaultLocation: 'fridge', typicalFreshnessDays: 4 },

  // Dairy
  { name: 'Milk', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Greek yogurt', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Butter', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 30 },
  { name: 'Cheddar cheese', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 21 },
  { name: 'Parmesan', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 30 },
  { name: 'Feta cheese', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Cream cheese', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Heavy cream', category: 'dairy', defaultLocation: 'fridge', typicalFreshnessDays: 10 },

  // Grains
  { name: 'Rice', category: 'grain', defaultLocation: 'pantry', typicalFreshnessDays: 365 },
  { name: 'Pasta', category: 'grain', defaultLocation: 'pantry', typicalFreshnessDays: 365 },
  { name: 'Bread', category: 'grain', defaultLocation: 'pantry', typicalFreshnessDays: 5 },
  { name: 'Tortillas', category: 'grain', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Quinoa', category: 'grain', defaultLocation: 'pantry', typicalFreshnessDays: 365 },
  { name: 'Oats', category: 'grain', defaultLocation: 'pantry', typicalFreshnessDays: 365 },

  // Condiments
  { name: 'Soy sauce', category: 'condiment', defaultLocation: 'pantry', typicalFreshnessDays: 365 },
  { name: 'Olive oil', category: 'condiment', defaultLocation: 'pantry', typicalFreshnessDays: 365 },
  { name: 'Hot sauce', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 180 },
  { name: 'Mayo', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 60 },
  { name: 'Mustard', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 180 },
  { name: 'Ketchup', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 180 },
  { name: 'Salsa', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 14 },
  { name: 'Hummus', category: 'condiment', defaultLocation: 'fridge', typicalFreshnessDays: 7 },

  // Spices (always pantry, long shelf life)
  { name: 'Salt', category: 'spice', defaultLocation: 'pantry' },
  { name: 'Black pepper', category: 'spice', defaultLocation: 'pantry' },
  { name: 'Cumin', category: 'spice', defaultLocation: 'pantry' },
  { name: 'Paprika', category: 'spice', defaultLocation: 'pantry' },
  { name: 'Italian seasoning', category: 'spice', defaultLocation: 'pantry' },
  { name: 'Chili flakes', category: 'spice', defaultLocation: 'pantry' },

  // Frozen
  { name: 'Frozen vegetables', category: 'frozen', defaultLocation: 'freezer', typicalFreshnessDays: 180 },
  { name: 'Frozen berries', category: 'frozen', defaultLocation: 'freezer', typicalFreshnessDays: 180 },
  { name: 'Ice cream', category: 'frozen', defaultLocation: 'freezer', typicalFreshnessDays: 60 },

  // Beverages
  { name: 'Orange juice', category: 'beverage', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Almond milk', category: 'beverage', defaultLocation: 'fridge', typicalFreshnessDays: 7 },
  { name: 'Coffee', category: 'beverage', defaultLocation: 'pantry', typicalFreshnessDays: 90 },
];

// Group items by category for UI display
export function getItemsByCategory(): Record<string, CommonItem[]> {
  return commonItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommonItem[]>);
}

// Get recently used items (to be populated from storage)
export function getRecentItems(recentNames: string[]): CommonItem[] {
  return recentNames
    .map(name => commonItems.find(item => item.name === name))
    .filter((item): item is CommonItem => item !== undefined);
}
