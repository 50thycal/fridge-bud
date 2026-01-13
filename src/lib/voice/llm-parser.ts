// LLM-based Voice Input Parser
// Uses OpenAI GPT to intelligently parse voice transcriptions

import { commonItems } from '@/data/common-items';
import {
  IngredientCategory,
  StorageLocation,
  QuantityLevel,
  InventoryItem,
  LLMParsedItem,
  LLMParseResult,
  VoiceIntent,
} from '@/lib/types';

// =============================================================================
// System Prompt
// =============================================================================

export const LLM_SYSTEM_PROMPT = `You are a kitchen inventory assistant for a fridge-mounted household terminal. Parse voice commands about food items.

RULES:
1. Extract the primary action: "add_items" (putting items into storage), "remove_items" (using/discarding items), or "unknown"
2. Extract ALL food items mentioned, even if grammar is imperfect or items are listed without commas
3. For each item, determine:
   - name: Canonical name (e.g., "Chicken breast" not "some chicken")
   - matchedKnownItem: If it matches a known item, use that exact name; otherwise null
   - category: protein | vegetable | fruit | dairy | grain | condiment | spice | beverage | frozen | other
   - location: fridge | freezer | pantry (infer from item type using typical storage, NOT what user says if incorrect)
   - quantity: plenty | some | low (default: "plenty" for adds, infer from context)
   - confidence: 0.0-1.0 (how certain you are about this extraction)
   - possibleDuplicate: true if item appears to already exist in the provided inventory
   - duplicateItemId: the ID of the existing inventory item if duplicate, otherwise null
   - reasoning: brief explanation of your decisions (especially for location overrides or duplicates)
   - locationOverridden: true if you changed location from what user said to what's typical
   - originalLocation: only set if locationOverridden is true, the location user requested
4. Use KNOWN ITEMS list for matching - prefer exact matches when possible
5. For items not in known list, infer category and typical location based on food type
6. Handle natural speech patterns like "milk eggs cumin and apples" or "some chicken, rice"
7. Spices ALWAYS go in pantry, dairy ALWAYS in fridge, frozen items ALWAYS in freezer

OUTPUT FORMAT: Valid JSON only, no markdown, no explanation outside JSON.`;

// =============================================================================
// User Prompt Builder
// =============================================================================

export function buildUserPrompt(
  transcription: string,
  currentInventory: InventoryItem[]
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

  return `KNOWN ITEMS (with default locations):
${knownItemsList}

CURRENT INVENTORY:
${inventoryList}

VOICE INPUT: "${transcription}"

Parse this and return JSON matching this exact schema:
{
  "intent": "add_items" | "remove_items" | "unknown",
  "confidence": number between 0 and 1,
  "items": [
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
  "extractedLocation": "fridge|freezer|pantry or null if not specified",
  "warnings": ["array of strings for any issues or notes"]
}`;
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

  return {
    intent: data.intent as VoiceIntent,
    confidence: data.confidence,
    items: validatedItems,
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

  return {
    intent: keywordResult.intent,
    confidence: keywordResult.confidence,
    items,
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
