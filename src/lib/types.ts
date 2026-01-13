// Core Types for FridgeBud

export type IngredientCategory =
  | 'protein'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'grain'
  | 'condiment'
  | 'spice'
  | 'beverage'
  | 'frozen'
  | 'other';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export type QuantityLevel = 'plenty' | 'some' | 'low';

export type FreshnessState = 'fresh' | 'good' | 'useSoon' | 'bad';

export type ConfidenceLevel = 'sure' | 'unsure';

export type EffortLevel = 'minimal' | 'moderate' | 'involved';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Inventory Item - what exists in the household
export interface InventoryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  location: StorageLocation;
  quantity: QuantityLevel;
  freshness: FreshnessState;
  confidence: ConfidenceLevel;
  addedAt: number; // timestamp
  updatedAt: number; // timestamp
}

// Ingredient Slot - defines what a meal pattern accepts
export interface IngredientSlot {
  role: string; // e.g., "protein", "green", "grain"
  acceptedCategories?: IngredientCategory[];
  specificItems?: string[]; // specific item names that satisfy this slot
  optional: boolean;
}

// Meal Pattern - a template for a meal (not a recipe)
export interface MealPattern {
  id: string;
  name: string;
  description?: string;
  requiredSlots: IngredientSlot[];
  flexibleSlots: IngredientSlot[];
  optionalUpgrades: IngredientSlot[];
  effort: EffortLevel;
  mealTypes: MealType[];
  tags: string[];
}

// Meal Opportunity - computed result showing what's possible
export interface MealOpportunity {
  pattern: MealPattern;
  score: number; // 0-100
  satisfied: { slot: IngredientSlot; item: InventoryItem }[];
  missing: IngredientSlot[];
  usesAgingItems: InventoryItem[];
  frictionLevel: 'ready' | 'oneAway' | 'needsShopping';
}

// Grocery Item - derived shopping list item
export interface GroceryItem {
  id: string;
  name: string;
  category: IngredientCategory;
  reason: string; // why this is on the list
  priority: 'urgent' | 'replenish' | 'opportunity' | 'manual';
  checked: boolean;
  addedAt: number;
}

// Meal Log - record of what was eaten
export interface MealLog {
  id: string;
  date: string; // ISO date string
  mealType: MealType;
  patternId?: string;
  description?: string;
  itemsUsed: string[]; // inventory item IDs
  createdAt: number;
}

// Household State - the complete data model
export interface HouseholdState {
  inventory: InventoryItem[];
  groceryList: GroceryItem[];
  mealLog: MealLog[];
  lastUpdated: number;
  householdCode?: string; // for sync
  householdName?: string; // custom name for the household (e.g., "Cal's Kitchen")
}

// Common Item - predefined item for quick add
export interface CommonItem {
  name: string;
  category: IngredientCategory;
  defaultLocation: StorageLocation;
  typicalFreshnessDays?: number;
}

// =============================================================================
// Voice Input Types
// =============================================================================

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'error';

export type VoiceIntent = 'add_items' | 'remove_items' | 'create_pattern' | 'edit_pattern' | 'unknown';

export interface ParsedItem {
  name: string;
  category: IngredientCategory;
  location: StorageLocation;
  quantity: QuantityLevel;
  confidence: number;
  ambiguous: boolean;
  alternatives?: string[];
}

export interface ParsedPattern {
  name?: string;
  targetPattern?: string;
  addIngredients?: string[];
  removeIngredients?: string[];
}

export interface ParsedVoiceInput {
  intent: VoiceIntent;
  confidence: number;
  items?: ParsedItem[];
  pattern?: ParsedPattern;
  extractedLocation?: StorageLocation;
  raw: string;
}

export interface VoiceRecordingResult {
  audioBlob: Blob;
  durationMs: number;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}
