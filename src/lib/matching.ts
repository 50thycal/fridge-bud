import { InventoryItem, MealPattern, MealOpportunity, IngredientSlot, MealComponent, ComponentStatus } from './types';
import { defaultMealPatterns } from '@/data/meal-patterns';

// Check if an inventory item satisfies a slot
function itemSatisfiesSlot(item: InventoryItem, slot: IngredientSlot): boolean {
  // Check specific items first
  if (slot.specificItems && slot.specificItems.length > 0) {
    return slot.specificItems.some(name =>
      item.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(item.name.toLowerCase())
    );
  }

  // Check categories
  if (slot.acceptedCategories && slot.acceptedCategories.length > 0) {
    return slot.acceptedCategories.includes(item.category);
  }

  return false;
}

// Find inventory items that satisfy a slot
function findItemsForSlot(slot: IngredientSlot, inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(item => itemSatisfiesSlot(item, slot));
}

// Calculate opportunity score
function calculateScore(
  satisfiedRequired: number,
  totalRequired: number,
  satisfiedFlexible: number,
  totalFlexible: number,
  usesAgingItems: boolean
): number {
  // Base score from required slots (0-60 points)
  const requiredScore = totalRequired > 0
    ? (satisfiedRequired / totalRequired) * 60
    : 60;

  // Bonus from flexible slots (0-20 points)
  const flexibleScore = totalFlexible > 0
    ? (satisfiedFlexible / totalFlexible) * 20
    : 10;

  // Bonus for using aging items (0-20 points)
  const agingBonus = usesAgingItems ? 20 : 0;

  return Math.round(requiredScore + flexibleScore + agingBonus);
}

// Determine friction level
function getFrictionLevel(satisfiedRequired: number, totalRequired: number): MealOpportunity['frictionLevel'] {
  if (satisfiedRequired === totalRequired) return 'ready';
  if (totalRequired - satisfiedRequired === 1) return 'oneAway';
  return 'needsShopping';
}

// Get items that should be used soon
function getAgingItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(item =>
    item.freshness === 'useSoon' || item.freshness === 'bad'
  );
}

// Calculate status for a single meal component (dressing, marinade, etc.)
function calculateComponentStatus(
  component: MealComponent,
  inventory: InventoryItem[]
): ComponentStatus {
  const satisfied: ComponentStatus['satisfied'] = [];
  const missing: IngredientSlot[] = [];

  for (const slot of component.slots) {
    const matchingItems = findItemsForSlot(slot, inventory);

    if (matchingItems.length > 0) {
      satisfied.push({ slot, item: matchingItems[0] });
    } else if (!slot.optional) {
      missing.push(slot);
    }
  }

  return {
    component,
    satisfied,
    missing,
    ready: missing.length === 0,
  };
}

// Calculate meal opportunities
export function calculateOpportunities(
  inventory: InventoryItem[],
  patterns: MealPattern[] = defaultMealPatterns
): MealOpportunity[] {
  const agingItems = getAgingItems(inventory);
  const opportunities: MealOpportunity[] = [];

  for (const pattern of patterns) {
    const satisfied: MealOpportunity['satisfied'] = [];
    const missing: IngredientSlot[] = [];
    const usesAgingItemsList: InventoryItem[] = [];

    // Check required slots
    for (const slot of pattern.requiredSlots) {
      const matchingItems = findItemsForSlot(slot, inventory);

      if (matchingItems.length > 0) {
        // Prefer aging items if available
        const agingMatch = matchingItems.find(item =>
          agingItems.some(ai => ai.id === item.id)
        );
        const selectedItem = agingMatch || matchingItems[0];

        satisfied.push({ slot, item: selectedItem });

        if (agingMatch) {
          usesAgingItemsList.push(agingMatch);
        }
      } else if (!slot.optional) {
        missing.push(slot);
      }
    }

    // Check flexible slots
    let flexibleSatisfied = 0;
    for (const slot of pattern.flexibleSlots) {
      const matchingItems = findItemsForSlot(slot, inventory);

      if (matchingItems.length > 0) {
        flexibleSatisfied++;
        const agingMatch = matchingItems.find(item =>
          agingItems.some(ai => ai.id === item.id)
        );
        const selectedItem = agingMatch || matchingItems[0];

        satisfied.push({ slot, item: selectedItem });

        if (agingMatch && !usesAgingItemsList.some(i => i.id === agingMatch.id)) {
          usesAgingItemsList.push(agingMatch);
        }
      }
    }

    // Calculate score
    const satisfiedRequiredCount = pattern.requiredSlots.length - missing.length;
    const score = calculateScore(
      satisfiedRequiredCount,
      pattern.requiredSlots.length,
      flexibleSatisfied,
      pattern.flexibleSlots.length,
      usesAgingItemsList.length > 0
    );

    const frictionLevel = getFrictionLevel(
      satisfiedRequiredCount,
      pattern.requiredSlots.length
    );

    // Calculate component statuses (for dressings, marinades, sauces)
    const componentStatuses = pattern.components?.map(component =>
      calculateComponentStatus(component, inventory)
    );

    opportunities.push({
      pattern,
      score,
      satisfied,
      missing,
      usesAgingItems: usesAgingItemsList,
      frictionLevel,
      componentStatuses,
    });
  }

  // Sort by score (highest first), then by friction level
  return opportunities.sort((a, b) => {
    // Prioritize "ready" meals
    if (a.frictionLevel === 'ready' && b.frictionLevel !== 'ready') return -1;
    if (b.frictionLevel === 'ready' && a.frictionLevel !== 'ready') return 1;

    // Then "one away"
    if (a.frictionLevel === 'oneAway' && b.frictionLevel === 'needsShopping') return -1;
    if (b.frictionLevel === 'oneAway' && a.frictionLevel === 'needsShopping') return 1;

    // Finally by score
    return b.score - a.score;
  });
}

// Get meals that are ready to make now
export function getReadyMeals(
  inventory: InventoryItem[],
  patterns?: MealPattern[]
): MealOpportunity[] {
  return calculateOpportunities(inventory, patterns).filter(o => o.frictionLevel === 'ready');
}

// Get meals that are one ingredient away
export function getAlmostReady(
  inventory: InventoryItem[],
  patterns?: MealPattern[]
): MealOpportunity[] {
  return calculateOpportunities(inventory, patterns).filter(o => o.frictionLevel === 'oneAway');
}

// Get meals that would use aging items
export function getMealsThatUseAgingItems(
  inventory: InventoryItem[],
  patterns?: MealPattern[]
): MealOpportunity[] {
  return calculateOpportunities(inventory, patterns)
    .filter(o => o.usesAgingItems.length > 0 && o.frictionLevel !== 'needsShopping')
    .sort((a, b) => b.usesAgingItems.length - a.usesAgingItems.length);
}

// Derive grocery suggestions based on patterns and inventory
export function deriveGrocerySuggestions(inventory: InventoryItem[]): Array<{
  name: string;
  reason: string;
  enablesMeals: string[];
}> {
  const opportunities = calculateOpportunities(inventory);
  const suggestions: Map<string, { reason: string; enablesMeals: string[] }> = new Map();

  // Look at meals that are one ingredient away
  for (const opportunity of opportunities) {
    if (opportunity.frictionLevel === 'oneAway') {
      for (const slot of opportunity.missing) {
        const itemName = slot.specificItems?.[0] || `${slot.role} item`;

        if (!suggestions.has(itemName)) {
          suggestions.set(itemName, {
            reason: `Would enable ${opportunity.pattern.name}`,
            enablesMeals: [opportunity.pattern.name],
          });
        } else {
          const existing = suggestions.get(itemName)!;
          if (!existing.enablesMeals.includes(opportunity.pattern.name)) {
            existing.enablesMeals.push(opportunity.pattern.name);
            existing.reason = `Would enable ${existing.enablesMeals.length} meals`;
          }
        }
      }
    }
  }

  // Add items that are low in inventory
  for (const item of inventory) {
    if (item.quantity === 'low' && !suggestions.has(item.name)) {
      suggestions.set(item.name, {
        reason: 'Running low',
        enablesMeals: [],
      });
    }
  }

  return Array.from(suggestions.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.enablesMeals.length - a.enablesMeals.length);
}
