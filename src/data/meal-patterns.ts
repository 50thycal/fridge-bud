import { MealPattern } from '@/lib/types';

// Default meal patterns - templates, not recipes
// Each pattern defines what ingredients can satisfy it

export const defaultMealPatterns: MealPattern[] = [
  // Quick & Easy
  {
    id: 'eggs-toast',
    name: 'Eggs & Toast',
    description: 'Simple breakfast staple',
    requiredSlots: [
      { role: 'eggs', specificItems: ['Eggs'], optional: false },
      { role: 'bread', specificItems: ['Bread', 'Tortillas'], optional: false },
    ],
    flexibleSlots: [
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'vegetable', acceptedCategories: ['vegetable'], optional: true },
      { role: 'protein', specificItems: ['Bacon', 'Sausage'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['breakfast'],
    tags: ['quick', 'breakfast', 'classic'],
  },

  {
    id: 'stir-fry',
    name: 'Stir Fry',
    description: 'Protein and veggies over rice or noodles',
    requiredSlots: [
      { role: 'protein', acceptedCategories: ['protein'], optional: false },
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: false },
    ],
    flexibleSlots: [
      { role: 'base', specificItems: ['Rice', 'Pasta', 'Quinoa'], optional: true },
      { role: 'sauce', specificItems: ['Soy sauce'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'aromatics', specificItems: ['Garlic', 'Onions'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['lunch', 'dinner'],
    tags: ['quick', 'healthy', 'versatile'],
  },

  {
    id: 'grain-bowl',
    name: 'Grain Bowl',
    description: 'Protein over grains with toppings',
    requiredSlots: [
      { role: 'protein', acceptedCategories: ['protein'], optional: false },
      { role: 'grain', specificItems: ['Rice', 'Quinoa'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'sauce', acceptedCategories: ['condiment'], optional: true },
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['lunch', 'dinner'],
    tags: ['healthy', 'meal-prep'],
  },

  {
    id: 'pasta-dish',
    name: 'Pasta Night',
    description: 'Pasta with protein and sauce',
    requiredSlots: [
      { role: 'pasta', specificItems: ['Pasta'], optional: false },
    ],
    flexibleSlots: [
      { role: 'protein', acceptedCategories: ['protein'], optional: true },
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'cheese', specificItems: ['Parmesan', 'Feta cheese'], optional: true },
      { role: 'cream', specificItems: ['Heavy cream'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['dinner'],
    tags: ['comfort', 'classic'],
  },

  {
    id: 'sheet-pan-dinner',
    name: 'Sheet Pan Dinner',
    description: 'Roasted protein with vegetables',
    requiredSlots: [
      { role: 'protein', specificItems: ['Chicken breast', 'Chicken thighs', 'Salmon', 'Sausage'], optional: false },
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: false },
    ],
    flexibleSlots: [
      { role: 'starch', specificItems: ['Potatoes', 'Sweet potatoes'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'aromatics', specificItems: ['Garlic', 'Onions', 'Lemons'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['dinner'],
    tags: ['easy', 'healthy', 'one-pan'],
  },

  {
    id: 'tacos',
    name: 'Taco Night',
    description: 'Tacos with protein and toppings',
    requiredSlots: [
      { role: 'shell', specificItems: ['Tortillas'], optional: false },
      { role: 'protein', acceptedCategories: ['protein'], optional: false },
    ],
    flexibleSlots: [
      { role: 'toppings', acceptedCategories: ['vegetable'], optional: true },
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'salsa', specificItems: ['Salsa', 'Hot sauce'], optional: true },
      { role: 'cream', specificItems: ['Greek yogurt'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['dinner'],
    tags: ['fun', 'family', 'customizable'],
  },

  {
    id: 'salad-protein',
    name: 'Protein Salad',
    description: 'Greens with protein',
    requiredSlots: [
      { role: 'greens', specificItems: ['Spinach', 'Lettuce'], optional: false },
      { role: 'protein', acceptedCategories: ['protein'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
      { role: 'dressing', acceptedCategories: ['condiment'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['lunch', 'dinner'],
    tags: ['healthy', 'light', 'quick'],
  },

  {
    id: 'salmon-veg',
    name: 'Salmon & Vegetables',
    description: 'Pan-seared or baked salmon with sides',
    requiredSlots: [
      { role: 'salmon', specificItems: ['Salmon'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
      { role: 'grain', specificItems: ['Rice', 'Quinoa'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'citrus', specificItems: ['Lemons', 'Limes'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['dinner'],
    tags: ['healthy', 'omega-3', 'fancy'],
  },

  {
    id: 'omelette',
    name: 'Omelette',
    description: 'Eggs with fillings',
    requiredSlots: [
      { role: 'eggs', specificItems: ['Eggs'], optional: false },
    ],
    flexibleSlots: [
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'protein', specificItems: ['Bacon', 'Sausage'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    tags: ['quick', 'protein', 'versatile'],
  },

  {
    id: 'sandwich',
    name: 'Sandwich',
    description: 'Classic sandwich',
    requiredSlots: [
      { role: 'bread', specificItems: ['Bread'], optional: false },
    ],
    flexibleSlots: [
      { role: 'protein', acceptedCategories: ['protein', 'dairy'], optional: true },
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'spread', specificItems: ['Mayo', 'Mustard', 'Hummus'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['lunch'],
    tags: ['quick', 'portable', 'classic'],
  },

  {
    id: 'yogurt-bowl',
    name: 'Yogurt Bowl',
    description: 'Yogurt with toppings',
    requiredSlots: [
      { role: 'yogurt', specificItems: ['Greek yogurt'], optional: false },
    ],
    flexibleSlots: [
      { role: 'fruit', acceptedCategories: ['fruit'], optional: true },
      { role: 'grain', specificItems: ['Oats'], optional: true },
    ],
    optionalUpgrades: [],
    effort: 'minimal',
    mealTypes: ['breakfast', 'snack'],
    tags: ['healthy', 'quick', 'light'],
  },

  {
    id: 'quesadilla',
    name: 'Quesadilla',
    description: 'Cheesy tortilla',
    requiredSlots: [
      { role: 'tortilla', specificItems: ['Tortillas'], optional: false },
      { role: 'cheese', acceptedCategories: ['dairy'], optional: false },
    ],
    flexibleSlots: [
      { role: 'protein', acceptedCategories: ['protein'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
      { role: 'salsa', specificItems: ['Salsa', 'Hot sauce'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['lunch', 'dinner', 'snack'],
    tags: ['quick', 'cheesy', 'comfort'],
  },

  {
    id: 'fried-rice',
    name: 'Fried Rice',
    description: 'Quick rice dish with vegetables and protein',
    requiredSlots: [
      { role: 'rice', specificItems: ['Rice'], optional: false },
      { role: 'eggs', specificItems: ['Eggs'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
      { role: 'protein', acceptedCategories: ['protein'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'sauce', specificItems: ['Soy sauce'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['lunch', 'dinner'],
    tags: ['quick', 'use-leftovers', 'filling'],
  },

  {
    id: 'smoothie',
    name: 'Smoothie',
    description: 'Blended fruit drink',
    requiredSlots: [
      { role: 'fruit', acceptedCategories: ['fruit'], optional: false },
      { role: 'liquid', specificItems: ['Milk', 'Almond milk', 'Greek yogurt'], optional: false },
    ],
    flexibleSlots: [
      { role: 'greens', specificItems: ['Spinach'], optional: true },
    ],
    optionalUpgrades: [],
    effort: 'minimal',
    mealTypes: ['breakfast', 'snack'],
    tags: ['healthy', 'quick', 'refreshing'],
  },

  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    description: 'Trendy but delicious',
    requiredSlots: [
      { role: 'bread', specificItems: ['Bread'], optional: false },
      { role: 'avocado', specificItems: ['Avocado'], optional: false },
    ],
    flexibleSlots: [
      { role: 'eggs', specificItems: ['Eggs'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'heat', specificItems: ['Chili flakes', 'Hot sauce'], optional: true },
      { role: 'citrus', specificItems: ['Lemons', 'Limes'], optional: true },
    ],
    effort: 'minimal',
    mealTypes: ['breakfast', 'lunch'],
    tags: ['quick', 'healthy', 'trendy'],
  },

  {
    id: 'burrito-bowl',
    name: 'Burrito Bowl',
    description: 'Deconstructed burrito',
    requiredSlots: [
      { role: 'grain', specificItems: ['Rice'], optional: false },
      { role: 'protein', acceptedCategories: ['protein'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', acceptedCategories: ['vegetable'], optional: true },
      { role: 'cheese', acceptedCategories: ['dairy'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'salsa', specificItems: ['Salsa'], optional: true },
      { role: 'cream', specificItems: ['Greek yogurt'], optional: true },
    ],
    effort: 'moderate',
    mealTypes: ['lunch', 'dinner'],
    tags: ['filling', 'customizable', 'healthy'],
  },

  {
    id: 'mediterranean-chicken-salad',
    name: 'Mediterranean Chicken Salad',
    description: 'Fresh, hearty salad with lemon-herb chicken and homemade dressing',
    requiredSlots: [
      { role: 'protein', specificItems: ['Chicken breast', 'Chicken thighs', 'Chicken'], optional: false },
      { role: 'greens', specificItems: ['Kale', 'Spinach', 'Mixed greens'], optional: false },
    ],
    flexibleSlots: [
      { role: 'vegetables', specificItems: ['Red onion', 'Onions', 'Cucumber', 'Cherry tomatoes', 'Tomatoes', 'Red pepper', 'Bell peppers'], optional: true },
      { role: 'cheese', specificItems: ['Goat cheese', 'Feta cheese'], optional: true },
    ],
    optionalUpgrades: [
      { role: 'olives', specificItems: ['Olives', 'Kalamata olives'], optional: true },
      { role: 'nuts', specificItems: ['Pine nuts', 'Almonds', 'Walnuts'], optional: true },
    ],
    components: [
      {
        name: 'Lemon-Dijon Dressing',
        slots: [
          { role: 'citrus', specificItems: ['Lemons', 'Lemon juice'], optional: false },
          { role: 'mustard', specificItems: ['Dijon mustard', 'Mustard'], optional: false },
          { role: 'garlic', specificItems: ['Garlic'], optional: false },
          { role: 'oil', specificItems: ['Olive oil'], optional: true },
          { role: 'sweetener', specificItems: ['Honey'], optional: true },
        ],
      },
      {
        name: 'Herb Marinade',
        slots: [
          { role: 'citrus', specificItems: ['Lemons', 'Lemon juice'], optional: false },
          { role: 'garlic', specificItems: ['Garlic'], optional: false },
          { role: 'herbs', specificItems: ['Thyme', 'Oregano', 'Basil', 'Dill', 'Fresh herbs', 'Italian herbs'], optional: false },
          { role: 'oil', specificItems: ['Olive oil'], optional: true },
        ],
      },
    ],
    effort: 'moderate',
    mealTypes: ['lunch', 'dinner'],
    tags: ['healthy', 'fresh', 'mediterranean', 'salad'],
  },
];

// Get patterns by meal type
export function getPatternsByMealType(mealType: string): MealPattern[] {
  return defaultMealPatterns.filter(p =>
    p.mealTypes.includes(mealType as MealPattern['mealTypes'][number])
  );
}

// Get patterns by tag
export function getPatternsByTag(tag: string): MealPattern[] {
  return defaultMealPatterns.filter(p => p.tags.includes(tag));
}
