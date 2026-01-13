import { HouseholdState, InventoryItem, GroceryItem, MealLog, MealPattern } from './types';

const STORAGE_KEY = 'fridgebud_state';
const RECENT_ITEMS_KEY = 'fridgebud_recent';
const HOUSEHOLD_CODE_KEY = 'fridgebud_household_code';
const MEAL_PATTERNS_KEY = 'fridgebud_meal_patterns';
const PATTERNS_INITIALIZED_KEY = 'fridgebud_patterns_initialized';

// Sync status tracking
let syncInProgress = false;
let lastSyncTime = 0;
const SYNC_DEBOUNCE_MS = 2000; // Debounce syncs to avoid hammering the API

// Default empty state
function getDefaultState(): HouseholdState {
  return {
    inventory: [],
    groceryList: [],
    mealLog: [],
    lastUpdated: Date.now(),
  };
}

// =============================================================================
// Household Code Management
// =============================================================================

export function getHouseholdCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(HOUSEHOLD_CODE_KEY);
}

export function setHouseholdCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HOUSEHOLD_CODE_KEY, code);
}

export function clearHouseholdCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HOUSEHOLD_CODE_KEY);
}

export function generateHouseholdCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =============================================================================
// Local Storage Operations
// =============================================================================

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

// Save state to localStorage (and trigger sync)
export function saveState(state: HouseholdState): void {
  if (typeof window === 'undefined') return;

  state.lastUpdated = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Trigger background sync (debounced)
  scheduleSyncToCloud();
}

// =============================================================================
// Cloud Sync Operations
// =============================================================================

// Schedule a sync to cloud (debounced)
function scheduleSyncToCloud(): void {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
    // Schedule for later
    setTimeout(() => {
      syncToCloud();
    }, SYNC_DEBOUNCE_MS);
    return;
  }
  syncToCloud();
}

// Sync local state to Vercel KV
export async function syncToCloud(): Promise<boolean> {
  if (syncInProgress) return false;

  const code = getHouseholdCode();
  if (!code) return false;

  syncInProgress = true;
  lastSyncTime = Date.now();

  try {
    const state = getState();
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      console.error('Sync to cloud failed:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Sync to cloud error:', error);
    return false;
  } finally {
    syncInProgress = false;
  }
}

// Fetch state from Vercel KV
export async function syncFromCloud(): Promise<HouseholdState | null> {
  const code = getHouseholdCode();
  if (!code) return null;

  try {
    const response = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);

    if (response.status === 404) {
      // Household doesn't exist in cloud yet
      return null;
    }

    if (!response.ok) {
      console.error('Sync from cloud failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.state as HouseholdState;
  } catch (error) {
    console.error('Sync from cloud error:', error);
    return null;
  }
}

// Lightweight check - fetch only the timestamp from cloud
export async function checkCloudTimestamp(): Promise<number | null> {
  const code = getHouseholdCode();
  if (!code) return null;

  try {
    const response = await fetch(`/api/sync?code=${encodeURIComponent(code)}&timestamp=true`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.lastUpdated as number;
  } catch (error) {
    console.error('Check cloud timestamp error:', error);
    return null;
  }
}

// Check if cloud has newer data and pull if needed
export async function pollForChanges(): Promise<{ updated: boolean; state?: HouseholdState }> {
  const cloudTimestamp = await checkCloudTimestamp();
  if (cloudTimestamp === null) {
    return { updated: false };
  }

  const localState = getState();

  // Cloud has newer data - fetch full state
  if (cloudTimestamp > localState.lastUpdated) {
    const cloudState = await syncFromCloud();
    if (cloudState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
      return { updated: true, state: cloudState };
    }
  }

  return { updated: false };
}

// Join an existing household by code
export async function joinHousehold(code: string): Promise<{ success: boolean; state?: HouseholdState; error?: string }> {
  try {
    const response = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);

    if (response.status === 404) {
      return { success: false, error: 'Household not found' };
    }

    if (!response.ok) {
      return { success: false, error: 'Failed to join household' };
    }

    const data = await response.json();
    const state = data.state as HouseholdState;

    // Save the code and state locally
    setHouseholdCode(code);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    return { success: true, state };
  } catch (error) {
    console.error('Join household error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Create a new household with optional name
export async function createHousehold(name?: string): Promise<{ success: boolean; code?: string; error?: string }> {
  const code = generateHouseholdCode();

  try {
    const state = getState();
    state.householdCode = code;
    if (name) {
      state.householdName = name;
    }

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to create household' };
    }

    setHouseholdCode(code);
    saveState(state);

    return { success: true, code };
  } catch (error) {
    console.error('Create household error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Get household name from state
export function getHouseholdName(): string | null {
  const state = getState();
  return state.householdName || null;
}

// Update household name
export async function updateHouseholdName(name: string): Promise<boolean> {
  const state = getState();
  state.householdName = name;
  saveState(state);
  return true;
}

// Merge cloud state with local state (cloud wins for conflicts based on lastUpdated)
export async function pullAndMerge(): Promise<HouseholdState> {
  const localState = getState();
  const cloudState = await syncFromCloud();

  if (!cloudState) {
    // No cloud state, use local
    return localState;
  }

  // If cloud is newer, use cloud state
  if (cloudState.lastUpdated > localState.lastUpdated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
    return cloudState;
  }

  // Local is newer, push to cloud
  await syncToCloud();
  return localState;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Inventory Operations
// =============================================================================

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

// =============================================================================
// Grocery List Operations
// =============================================================================

export function addGroceryItem(item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>): GroceryItem | null {
  const state = getState();

  // Check if item with same name already exists (case-insensitive)
  const existingItem = state.groceryList.find(
    i => i.name.toLowerCase() === item.name.toLowerCase()
  );
  if (existingItem) {
    return null; // Item already exists, don't add duplicate
  }

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

// =============================================================================
// Meal Log Operations
// =============================================================================

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

// =============================================================================
// Recent Items Tracking
// =============================================================================

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

// =============================================================================
// Data Export/Import
// =============================================================================

export function exportData(): string {
  const state = getState();
  return JSON.stringify(state, null, 2);
}

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

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECENT_ITEMS_KEY);
  // Note: Not clearing household code - that's a separate action
}

// =============================================================================
// Meal Pattern Operations
// =============================================================================

export function getMealPatterns(): MealPattern[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(MEAL_PATTERNS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function arePatternsInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PATTERNS_INITIALIZED_KEY) === 'true';
}

export function markPatternsInitialized(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PATTERNS_INITIALIZED_KEY, 'true');
}

export function saveMealPatterns(patterns: MealPattern[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEAL_PATTERNS_KEY, JSON.stringify(patterns));
}

export function addMealPattern(pattern: Omit<MealPattern, 'id'>): MealPattern {
  const patterns = getMealPatterns();

  const newPattern: MealPattern = {
    ...pattern,
    id: generateId(),
  };

  patterns.push(newPattern);
  saveMealPatterns(patterns);
  return newPattern;
}

export function updateMealPattern(id: string, updates: Partial<MealPattern>): MealPattern | null {
  const patterns = getMealPatterns();
  const index = patterns.findIndex(p => p.id === id);

  if (index === -1) return null;

  patterns[index] = {
    ...patterns[index],
    ...updates,
  };

  saveMealPatterns(patterns);
  return patterns[index];
}

export function removeMealPattern(id: string): boolean {
  const patterns = getMealPatterns();
  const index = patterns.findIndex(p => p.id === id);

  if (index === -1) return false;

  patterns.splice(index, 1);
  saveMealPatterns(patterns);
  return true;
}
