import { HouseholdState, InventoryItem, GroceryItem, MealLog } from './types';

const STORAGE_KEY = 'fridgebud_state';
const RECENT_ITEMS_KEY = 'fridgebud_recent';

// Default empty state
function getDefaultState(): HouseholdState {
  return {
    inventory: [],
    groceryList: [],
    mealLog: [],
    lastUpdated: Date.now(),
  };
}

// Get state from localStorage
export function getState(): HouseholdState {
  if (typeof window === 'undefined') return getDefaultState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();
    return JSON.parse(stored);
  } catch {
    return getDefaultState();
  }
}

// Save state to localStorage
export function saveState(state: HouseholdState): void {
  if (typeof window === 'undefined') return;

  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Inventory operations
export function addInventoryItem(item: Omit<InventoryItem, 'id' | 'addedAt' | 'updatedAt'>): InventoryItem {
  const state = getState();
  const now = Date.now();

  const newItem: InventoryItem = {
    ...item,
    id: generateId(),
    addedAt: now,
    updatedAt: now,
  };

  state.inventory.push(newItem);
  saveState(state);

  // Track as recent item
  addRecentItem(item.name);

  return newItem;
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const state = getState();
  const index = state.inventory.findIndex(item => item.id === id);

  if (index === -1) return null;

  state.inventory[index] = {
    ...state.inventory[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveState(state);
  return state.inventory[index];
}

export function removeInventoryItem(id: string): boolean {
  const state = getState();
  const index = state.inventory.findIndex(item => item.id === id);

  if (index === -1) return false;

  state.inventory.splice(index, 1);
  saveState(state);
  return true;
}

export function getInventoryItems(): InventoryItem[] {
  return getState().inventory;
}

// Grocery list operations
export function addGroceryItem(item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>): GroceryItem {
  const state = getState();

  const newItem: GroceryItem = {
    ...item,
    id: generateId(),
    addedAt: Date.now(),
    checked: false,
  };

  state.groceryList.push(newItem);
  saveState(state);
  return newItem;
}

export function toggleGroceryItem(id: string): boolean {
  const state = getState();
  const item = state.groceryList.find(i => i.id === id);

  if (!item) return false;

  item.checked = !item.checked;
  saveState(state);
  return true;
}

export function removeGroceryItem(id: string): boolean {
  const state = getState();
  const index = state.groceryList.findIndex(item => item.id === id);

  if (index === -1) return false;

  state.groceryList.splice(index, 1);
  saveState(state);
  return true;
}

export function clearCheckedGroceryItems(): void {
  const state = getState();
  state.groceryList = state.groceryList.filter(item => !item.checked);
  saveState(state);
}

export function getGroceryItems(): GroceryItem[] {
  return getState().groceryList;
}

// Meal log operations
export function logMeal(log: Omit<MealLog, 'id' | 'createdAt'>): MealLog {
  const state = getState();

  const newLog: MealLog = {
    ...log,
    id: generateId(),
    createdAt: Date.now(),
  };

  state.mealLog.push(newLog);
  saveState(state);
  return newLog;
}

export function getMealLogs(): MealLog[] {
  return getState().mealLog;
}

// Recent items tracking (for quick-add)
export function getRecentItemNames(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addRecentItem(name: string): void {
  if (typeof window === 'undefined') return;

  const recent = getRecentItemNames();
  const filtered = recent.filter(n => n !== name);
  filtered.unshift(name);

  // Keep only last 10
  const trimmed = filtered.slice(0, 10);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(trimmed));
}

// Export data as JSON (for backup)
export function exportData(): string {
  const state = getState();
  return JSON.stringify(state, null, 2);
}

// Import data from JSON
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as HouseholdState;

    // Basic validation
    if (!Array.isArray(data.inventory)) return false;
    if (!Array.isArray(data.groceryList)) return false;
    if (!Array.isArray(data.mealLog)) return false;

    saveState(data);
    return true;
  } catch {
    return false;
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECENT_ITEMS_KEY);
}
