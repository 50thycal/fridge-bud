// LLM-based Voice Input Parser
// Uses OpenAI GPT to intelligently parse voice transcriptions

import { commonItems } from '@/data/common-items';
import {
  IngredientCategory,
  StorageLocation,
  QuantityLevel,
  InventoryItem,
  MealPattern,
  LLMParsedItem,
  LLMParsedPattern,
  LLMParseResult,
  VoiceIntent,
  EffortLevel,
  MealType,
} from '@/lib/types';

// =============================================================================
// System Prompt
// =============================================================================

export const LLM_SYSTEM_PROMPT = `You are a kitchen assistant for a fridge-mounted household terminal. Parse voice commands about EITHER inventory items OR meal patterns.

CRITICAL: DETERMINE THE INTENT FIRST - This app handles TWO different things:

1. **INVENTORY** (add_items/remove_items): User is adding/removing physical food items to storage locations
   - Signals: "put X in the fridge", "add X to pantry", "we got X", "used the X", "finished the X"
   - Example: "add salmon and rice to the fridge" → add_items (putting physical items in storage)
   - Example: "we used the chicken" → remove_items

2. **MEAL PATTERNS** (create_pattern/edit_pattern): User is creating/editing a meal recipe with its ingredients
   - Signals: "add/create/make a [meal name] meal/dish/recipe", "new meal called X", "X meal needs/has/with [ingredients]"
   - Example: "add salmon pasta with salmon, orzo, and garlic" → create_pattern (creating a meal called "salmon pasta")
   - Example: "let's add the chicken stir fry it needs chicken rice and vegetables" → create_pattern
   - Example: "update the pasta night to include shrimp" → edit_pattern

KEY DISTINCTION:
- "add salmon to the fridge" = add_items (putting salmon IN storage)
- "add salmon pasta meal with salmon and orzo" = create_pattern (creating a meal CALLED "salmon pasta" that USES salmon/orzo)
- When ingredients are listed FOR a meal name, it's a pattern. When items are being PUT somewhere, it's inventory.

RULES FOR INVENTORY (add_items/remove_items):
1. Extract ALL food items mentioned
2. For each item determine: name, category, location, quantity, confidence
3. Use typical storage locations (spices→pantry, dairy→fridge, frozen→freezer)
4. Check for duplicates in current inventory
5. Default quantity is "plenty" for adds

RULES FOR MEAL PATTERNS (create_pattern/edit_pattern):
1. Extract the meal/recipe name (e.g., "salmon pasta", "chicken stir fry")
2. Extract the ingredient list - these are what the meal NEEDS, not items to add to storage
3. Check if the meal name matches an existing pattern (for editing)
4. Infer effort level: minimal (5-10 min), moderate (15-30 min), involved (30+ min)
5. Infer meal types: breakfast, lunch, dinner, snack based on the dish

OUTPUT FORMAT: Valid JSON only, no markdown, no explanation outside JSON.`;

// =============================================================================
// User Prompt Builder
// =============================================================================

export function buildUserPrompt(
  transcription: string,
  currentInventory: InventoryItem[],
  existingPatterns: MealPattern[] = []
): string {
  // Build known items list with their default locations
  const knownItemsList = commonItems
    .map(item => `- ${item.name} (${item.category}, typically ${item.defaultLocation})`)
    .join('\n');

  // Build current inventory list
  const inventoryList = currentInventory.length > 0
    ? currentInventory
        .map(item => `- ${item.name} (id: ${item.id}, ${item.location}, ${item.quantity})`)
        .join('\n')
    : '(empty)';

  // Build existing meal patterns list
  const patternsList = existingPatterns.length > 0
    ? existingPatterns
        .map(p => `- "${p.name}" (id: ${p.id})`)
        .join('\n')
    : '(none)';

  return `KNOWN FOOD ITEMS (for inventory matching):
${knownItemsList}

CURRENT INVENTORY (check for duplicates):
${inventoryList}

EXISTING MEAL PATTERNS (check for editing):
${patternsList}

VOICE INPUT: "${transcription}"

STEP 1: Determine if this is about INVENTORY or a MEAL PATTERN
- If listing items to PUT in storage → add_items/remove_items, populate "items" array
- If creating/editing a meal/dish/recipe → create_pattern/edit_pattern, populate "pattern" object

STEP 2: Return JSON matching this schema:
{
  "intent": "add_items" | "remove_items" | "create_pattern" | "edit_pattern" | "unknown",
  "confidence": number between 0 and 1,
  "items": [
    // ONLY populate for add_items/remove_items intent
    {
      "name": "string - canonical item name",
      "matchedKnownItem": "string or null - exact name from known items if matched",
      "category": "protein|vegetable|fruit|dairy|grain|condiment|spice|beverage|frozen|other",
      "location": "fridge|freezer|pantry",
      "quantity": "plenty|some|low",
      "confidence": number between 0 and 1,
      "possibleDuplicate": boolean,
      "duplicateItemId": "string or null",
      "reasoning": "string explaining your decisions",
      "locationOverridden": boolean,
      "originalLocation": "fridge|freezer|pantry or null if not overridden"
    }
  ],
  "pattern": {
    // ONLY populate for create_pattern/edit_pattern intent
    "name": "string - meal name like 'Salmon Pasta' or 'Chicken Stir Fry'",
    "matchedExistingPattern": "string or null - name of existing pattern if editing",
    "matchedExistingId": "string or null - id of existing pattern if editing",
    "description": "string - brief description of the meal",
    "ingredients": ["array of ingredient names this meal needs"],
    "effort": "minimal|moderate|involved",
    "mealTypes": ["breakfast", "lunch", "dinner", "snack"],
    "confidence": number between 0 and 1,
    "reasoning": "string explaining why this is a meal pattern and your decisions"
  },
  "extractedLocation": "fridge|freezer|pantry or null if not specified",
  "warnings": ["array of strings for any issues or notes"]
}

IMPORTANT:
- For add_items/remove_items: populate "items", leave "pattern" as null
- For create_pattern/edit_pattern: populate "pattern", leave "items" as empty array []`;
}

// =============================================================================
// Response Validation
// =============================================================================

const VALID_CATEGORIES: IngredientCategory[] = [
  'protein', 'vegetable', 'fruit', 'dairy', 'grain',
  'condiment', 'spice', 'beverage', 'frozen', 'other'
];

const VALID_LOCATIONS: StorageLocation[] = ['fridge', 'freezer', 'pantry'];
const VALID_QUANTITIES: QuantityLevel[] = ['plenty', 'some', 'low'];
const VALID_INTENTS: VoiceIntent[] = ['add_items', 'remove_items', 'create_pattern', 'edit_pattern', 'unknown'];
const VALID_EFFORT_LEVELS: EffortLevel[] = ['minimal', 'moderate', 'involved'];
const VALID_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function validateLLMResponse(response: unknown): LLMParseResult | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const data = response as Record<string, unknown>;

  // Validate intent
  if (!VALID_INTENTS.includes(data.intent as VoiceIntent)) {
    return null;
  }

  // Validate confidence
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    return null;
  }

  // Validate items array
  if (!Array.isArray(data.items)) {
    return null;
  }

  const validatedItems: LLMParsedItem[] = [];

  for (const item of data.items) {
    if (!item || typeof item !== 'object') continue;

    const itemData = item as Record<string, unknown>;

    // Validate required fields
    if (typeof itemData.name !== 'string' || !itemData.name.trim()) continue;

    // Validate category with fallback
    const category = VALID_CATEGORIES.includes(itemData.category as IngredientCategory)
      ? (itemData.category as IngredientCategory)
      : 'other';

    // Validate location with fallback
    const location = VALID_LOCATIONS.includes(itemData.location as StorageLocation)
      ? (itemData.location as StorageLocation)
      : 'fridge';

    // Validate quantity with fallback
    const quantity = VALID_QUANTITIES.includes(itemData.quantity as QuantityLevel)
      ? (itemData.quantity as QuantityLevel)
      : 'plenty';

    validatedItems.push({
      name: itemData.name.trim(),
      matchedKnownItem: typeof itemData.matchedKnownItem === 'string' ? itemData.matchedKnownItem : null,
      category,
      location,
      quantity,
      confidence: typeof itemData.confidence === 'number' ? Math.min(1, Math.max(0, itemData.confidence)) : 0.5,
      possibleDuplicate: itemData.possibleDuplicate === true,
      duplicateItemId: typeof itemData.duplicateItemId === 'string' ? itemData.duplicateItemId : null,
      reasoning: typeof itemData.reasoning === 'string' ? itemData.reasoning : '',
      locationOverridden: itemData.locationOverridden === true,
      originalLocation: VALID_LOCATIONS.includes(itemData.originalLocation as StorageLocation)
        ? (itemData.originalLocation as StorageLocation)
        : undefined,
    });
  }

  // Validate extractedLocation
  const extractedLocation = VALID_LOCATIONS.includes(data.extractedLocation as StorageLocation)
    ? (data.extractedLocation as StorageLocation)
    : null;

  // Validate warnings
  const warnings = Array.isArray(data.warnings)
    ? data.warnings.filter((w): w is string => typeof w === 'string')
    : [];

  // Validate pattern (for create_pattern/edit_pattern intents)
  let validatedPattern: LLMParsedPattern | undefined = undefined;
  const intent = data.intent as VoiceIntent;

  if ((intent === 'create_pattern' || intent === 'edit_pattern') && data.pattern && typeof data.pattern === 'object') {
    const patternData = data.pattern as Record<string, unknown>;

    // Pattern name is required
    if (typeof patternData.name === 'string' && patternData.name.trim()) {
      // Validate effort with fallback
      const effort = VALID_EFFORT_LEVELS.includes(patternData.effort as EffortLevel)
        ? (patternData.effort as EffortLevel)
        : 'moderate';

      // Validate meal types with fallback
      let mealTypes: MealType[] = Array.isArray(patternData.mealTypes)
        ? patternData.mealTypes.filter((mt): mt is MealType => VALID_MEAL_TYPES.includes(mt as MealType))
        : ['dinner'];

      // Ensure at least one meal type
      if (mealTypes.length === 0) {
        mealTypes = ['dinner'];
      }

      // Validate ingredients array
      const ingredients = Array.isArray(patternData.ingredients)
        ? patternData.ingredients.filter((ing): ing is string => typeof ing === 'string' && ing.trim().length > 0)
        : [];

      validatedPattern = {
        name: patternData.name.trim(),
        matchedExistingPattern: typeof patternData.matchedExistingPattern === 'string' ? patternData.matchedExistingPattern : null,
        matchedExistingId: typeof patternData.matchedExistingId === 'string' ? patternData.matchedExistingId : null,
        description: typeof patternData.description === 'string' ? patternData.description : '',
        ingredients,
        effort,
        mealTypes,
        confidence: typeof patternData.confidence === 'number' ? Math.min(1, Math.max(0, patternData.confidence)) : 0.7,
        reasoning: typeof patternData.reasoning === 'string' ? patternData.reasoning : '',
      };
    }
  }

  return {
    intent,
    confidence: data.confidence,
    items: validatedItems,
    pattern: validatedPattern,
    extractedLocation,
    warnings,
    raw: '', // Will be set by caller
  };
}

// =============================================================================
// Parse LLM Response
// =============================================================================

export function parseLLMResponse(responseText: string, rawTranscription: string): LLMParseResult | null {
  try {
    // Try to extract JSON from response (in case there's extra text)
    let jsonStr = responseText.trim();

    // If wrapped in markdown code blocks, extract
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    const validated = validateLLMResponse(parsed);

    if (validated) {
      validated.raw = rawTranscription;
      return validated;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    return null;
  }
}

// =============================================================================
// Fallback Parser Integration
// =============================================================================

import { parseVoiceInput, ParsedVoiceInput } from './parser';

/**
 * Convert keyword-based parse result to LLM format for consistent handling
 */
export function convertKeywordResultToLLMFormat(
  keywordResult: ParsedVoiceInput,
  currentInventory: InventoryItem[]
): LLMParseResult {
  const items: LLMParsedItem[] = (keywordResult.items || []).map(item => {
    // Check for duplicates
    const duplicate = currentInventory.find(
      inv => inv.name.toLowerCase() === item.name.toLowerCase()
    );

    return {
      name: item.name,
      matchedKnownItem: item.confidence >= 0.9 ? item.name : null,
      category: item.category,
      location: item.location,
      quantity: item.quantity,
      confidence: item.confidence,
      possibleDuplicate: !!duplicate,
      duplicateItemId: duplicate?.id || null,
      reasoning: item.ambiguous
        ? `Ambiguous match - alternatives: ${item.alternatives?.join(', ')}`
        : 'Matched via keyword parser',
      locationOverridden: false,
    };
  });

  // Convert pattern if present (for create_pattern/edit_pattern intents)
  let pattern: LLMParsedPattern | undefined = undefined;
  if (keywordResult.pattern && (keywordResult.intent === 'create_pattern' || keywordResult.intent === 'edit_pattern')) {
    pattern = {
      name: keywordResult.pattern.name || keywordResult.pattern.targetPattern || 'New Meal',
      matchedExistingPattern: keywordResult.pattern.targetPattern || null,
      matchedExistingId: null, // Keyword parser doesn't have access to pattern IDs
      description: '',
      ingredients: keywordResult.pattern.addIngredients || [],
      effort: 'moderate',
      mealTypes: ['dinner'],
      confidence: keywordResult.confidence,
      reasoning: 'Parsed via keyword fallback parser',
    };
  }

  return {
    intent: keywordResult.intent,
    confidence: keywordResult.confidence,
    items,
    pattern,
    extractedLocation: keywordResult.extractedLocation || null,
    warnings: keywordResult.confidence < 0.5 ? ['Low confidence - parsed with fallback method'] : [],
    raw: keywordResult.raw,
  };
}

/**
 * Get fallback result using keyword parser
 */
export function getFallbackParseResult(
  transcription: string,
  currentInventory: InventoryItem[],
  recentItems: string[] = []
): LLMParseResult {
  const keywordResult = parseVoiceInput(transcription, recentItems);
  return convertKeywordResultToLLMFormat(keywordResult, currentInventory);
}
