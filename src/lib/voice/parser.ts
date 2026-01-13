// Voice Input Parser - Keyword-based intent detection and entity extraction

import { commonItems } from '@/data/common-items';
import { IngredientCategory, StorageLocation, QuantityLevel } from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

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
  targetPattern?: string; // for edit - which pattern to modify
  addIngredients?: string[];
  removeIngredients?: string[];
}

export interface ParsedVoiceInput {
  intent: VoiceIntent;
  confidence: number;
  items?: ParsedItem[];
  pattern?: ParsedPattern;
  extractedLocation?: StorageLocation; // location mentioned in the phrase
  raw: string;
}

// =============================================================================
// Intent Trigger Keywords
// =============================================================================

const INTENT_TRIGGERS: Record<VoiceIntent, string[]> = {
  add_items: [
    // Simple starts (will check if sentence starts with these)
    'add', 'adding',
    // General add
    'bought', 'picked up', 'got', 'added', 'have', 'restocked',
    'brought home', 'just got', 'grabbed', 'stocked up on',
    'put', 'putting', 'store', 'storing',
    // Location-specific add
    'add to fridge', 'add to freezer', 'add to pantry',
    'put in fridge', 'put in freezer', 'put in pantry',
    'putting in fridge', 'putting in freezer', 'putting in pantry',
    'store in fridge', 'store in freezer', 'store in pantry',
    'fridge has', 'freezer has', 'pantry has',
    'add to the fridge', 'add to the freezer', 'add to the pantry',
    'put in the fridge', 'put in the freezer', 'put in the pantry',
    'to the fridge', 'to the freezer', 'to the pantry',
    'to our fridge', 'to our freezer', 'to our pantry',
    'to my fridge', 'to my freezer', 'to my pantry',
    'in the fridge', 'in the freezer', 'in the pantry',
    'in our fridge', 'in our freezer', 'in our pantry',
  ],

  remove_items: [
    // General remove
    'used', 'used up', 'finished', 'threw out', 'tossed',
    'gone', 'out of', 'ran out', 'expired', 'bad', 'eaten',
    'remove', 'removing', 'take out', 'took out',
    // Location-specific remove
    'remove from fridge', 'remove from freezer', 'remove from pantry',
    'take out of fridge', 'take out of freezer', 'take out of pantry',
    'took from fridge', 'took from freezer', 'took from pantry',
    'grab from fridge', 'grab from freezer', 'grab from pantry',
    'remove from the fridge', 'remove from the freezer', 'remove from the pantry',
    'no more', 'all out of', 'none left', 'ran out of',
  ],

  create_pattern: [
    'new recipe', 'new meal', 'add recipe', 'add meal',
    'create recipe', 'save recipe', 'save meal', 'create meal',
    'make a recipe', 'make a new recipe', 'new meal pattern',
  ],

  edit_pattern: [
    'change recipe', 'edit recipe', 'update recipe', 'modify recipe',
    'add to recipe', 'remove from recipe', 'change meal', 'edit meal',
    'update meal', 'modify meal', 'change the recipe', 'edit the recipe',
  ],

  unknown: [],
};

// =============================================================================
// Quantity Patterns
// =============================================================================

const QUANTITY_PATTERNS: Record<QuantityLevel, string[]> = {
  plenty: [
    'a lot', 'lots', 'tons', 'bunch', 'big bag', 'large', 'full',
    'dozen', 'gallon', 'pack', 'case', 'box', 'bag',
  ],
  some: [
    'some', 'a few', 'couple', 'a bit', 'small', 'half',
  ],
  low: [
    'last', 'almost out', 'running low', 'little bit', 'nearly out',
    'just a little', 'not much',
  ],
};

// =============================================================================
// Location Patterns
// =============================================================================

const LOCATION_PATTERNS: Record<StorageLocation, string[]> = {
  fridge: [
    'fridge', 'refrigerator', 'in the fridge', 'to the fridge',
    'in fridge', 'to fridge', 'from fridge', 'from the fridge',
  ],
  freezer: [
    'freezer', 'frozen', 'in the freezer', 'to the freezer',
    'in freezer', 'to freezer', 'from freezer', 'from the freezer',
  ],
  pantry: [
    'pantry', 'cabinet', 'cupboard', 'shelf', 'in the pantry',
    'to the pantry', 'in pantry', 'to pantry', 'from pantry', 'from the pantry',
  ],
};

// =============================================================================
// Stop Words (to filter out when extracting items)
// =============================================================================

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'i', 'we', 'you', 'he', 'she', 'it', 'they',
  'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your', 'his', 'its',
  'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who',
  'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'also', 'now', 'here', 'there', 'then', 'once', 'already', 'always',
  'up', 'out', 'into', 'over', 'after', 'before', 'under', 'again',
  'further', 'then', 'once', 'put', 'get', 'got', 'take', 'took',
]);

// Words that are part of item names we should keep
const KEEP_WORDS = new Set([
  'chicken', 'ground', 'greek', 'bell', 'cream', 'ice', 'frozen',
  'almond', 'orange', 'sweet', 'black', 'italian', 'olive', 'soy',
  'heavy', 'feta', 'cheddar',
]);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize text for matching
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')    // normalize whitespace
    .trim();
}

/**
 * Capitalize first letter of each word
 */
function capitalize(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract location from text
 */
function extractLocation(text: string): StorageLocation | undefined {
  const normalized = normalize(text);

  for (const [location, patterns] of Object.entries(LOCATION_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return location as StorageLocation;
      }
    }
  }

  return undefined;
}

/**
 * Extract quantity from text
 */
function extractQuantity(text: string): QuantityLevel {
  const normalized = normalize(text);

  for (const [quantity, patterns] of Object.entries(QUANTITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return quantity as QuantityLevel;
      }
    }
  }

  // Default to plenty for new items
  return 'plenty';
}

/**
 * Detect intent from text
 */
function detectIntent(text: string): { intent: VoiceIntent; confidence: number } {
  const normalized = normalize(text);
  const words = normalized.split(' ');
  const firstWord = words[0] || '';

  // Check each intent's triggers
  const scores: Record<VoiceIntent, number> = {
    add_items: 0,
    remove_items: 0,
    create_pattern: 0,
    edit_pattern: 0,
    unknown: 0,
  };

  for (const [intent, triggers] of Object.entries(INTENT_TRIGGERS)) {
    if (intent === 'unknown') continue;

    for (const trigger of triggers) {
      // Check if sentence starts with trigger (high confidence)
      if (normalized.startsWith(trigger + ' ') || normalized === trigger) {
        scores[intent as VoiceIntent] += 3 + trigger.split(' ').length;
      }
      // Check if trigger appears anywhere
      else if (normalized.includes(trigger)) {
        // Longer triggers get higher scores (more specific)
        scores[intent as VoiceIntent] += trigger.split(' ').length;
      }
    }
  }

  // Boost add_items if we see location words with "to" or "in"
  const hasAddLocation = /\b(to|in)\s+(the\s+|our\s+|my\s+)?(fridge|freezer|pantry)\b/.test(normalized);
  if (hasAddLocation && !normalized.includes('from')) {
    scores.add_items += 2;
  }

  // Boost remove_items if we see "from" with location
  const hasRemoveLocation = /\bfrom\s+(the\s+|our\s+|my\s+)?(fridge|freezer|pantry)\b/.test(normalized);
  if (hasRemoveLocation) {
    scores.remove_items += 2;
  }

  // Check first word for common intents
  if (['add', 'adding', 'put', 'putting', 'store'].includes(firstWord)) {
    scores.add_items += 3;
  }
  if (['remove', 'removing', 'used', 'finished', 'threw'].includes(firstWord)) {
    scores.remove_items += 3;
  }

  // Find the intent with highest score
  let maxIntent: VoiceIntent = 'unknown';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as VoiceIntent;
    }
  }

  // Calculate confidence based on score
  // Higher scores = more confidence (max out at ~0.95)
  const confidence = maxScore > 0 ? Math.min(0.95, 0.5 + (maxScore * 0.1)) : 0.3;

  return { intent: maxIntent, confidence };
}

/**
 * Match a spoken item name against known items
 */
function matchItem(
  spoken: string,
  recentItems: string[] = []
): ParsedItem {
  const normalized = normalize(spoken);

  // Try exact match first
  const exactMatch = commonItems.find(item =>
    normalize(item.name) === normalized
  );

  if (exactMatch) {
    return {
      name: exactMatch.name,
      category: exactMatch.category,
      location: exactMatch.defaultLocation,
      quantity: 'plenty',
      confidence: 1.0,
      ambiguous: false,
    };
  }

  // Try partial matches
  const partialMatches = commonItems.filter(item => {
    const itemNorm = normalize(item.name);
    return itemNorm.includes(normalized) || normalized.includes(itemNorm.split(' ')[0]);
  });

  if (partialMatches.length === 1) {
    return {
      name: partialMatches[0].name,
      category: partialMatches[0].category,
      location: partialMatches[0].defaultLocation,
      quantity: 'plenty',
      confidence: 0.9,
      ambiguous: false,
    };
  }

  if (partialMatches.length > 1) {
    // Check if any match is in recent items (prefer that)
    const recentMatch = partialMatches.find(item => recentItems.includes(item.name));

    if (recentMatch) {
      return {
        name: recentMatch.name,
        category: recentMatch.category,
        location: recentMatch.defaultLocation,
        quantity: 'plenty',
        confidence: 0.85,
        ambiguous: true,
        alternatives: partialMatches.map(m => m.name),
      };
    }

    // Return first match but flag as ambiguous
    return {
      name: partialMatches[0].name,
      category: partialMatches[0].category,
      location: partialMatches[0].defaultLocation,
      quantity: 'plenty',
      confidence: 0.7,
      ambiguous: true,
      alternatives: partialMatches.map(m => m.name),
    };
  }

  // No match found - create custom item
  return {
    name: capitalize(spoken),
    category: 'other',
    location: 'fridge', // default
    quantity: 'plenty',
    confidence: 0.5,
    ambiguous: false,
  };
}

/**
 * Extract item names from text
 */
function extractItemNames(text: string): string[] {
  const normalized = normalize(text);
  const items: string[] = [];

  // First, try to match known item names directly
  for (const item of commonItems) {
    const itemNorm = normalize(item.name);
    if (normalized.includes(itemNorm)) {
      items.push(item.name);
    }
  }

  // If we found items, return them
  if (items.length > 0) {
    return items;
  }

  // Otherwise, try to extract words that might be items
  // Remove trigger words and locations first
  let cleaned = normalized;

  // Remove intent triggers
  for (const triggers of Object.values(INTENT_TRIGGERS)) {
    for (const trigger of triggers) {
      cleaned = cleaned.replace(trigger, ' ');
    }
  }

  // Remove location patterns
  for (const patterns of Object.values(LOCATION_PATTERNS)) {
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, ' ');
    }
  }

  // Remove quantity patterns
  for (const patterns of Object.values(QUANTITY_PATTERNS)) {
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, ' ');
    }
  }

  // Split into words and filter
  const words = cleaned.split(/[\s,]+/).filter(word => {
    if (word.length < 2) return false;
    if (STOP_WORDS.has(word) && !KEEP_WORDS.has(word)) return false;
    return true;
  });

  // Try to match remaining words
  const matched: string[] = [];
  let i = 0;

  while (i < words.length) {
    // Try two-word combinations first (e.g., "ground beef")
    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      const twoWordMatch = commonItems.find(item =>
        normalize(item.name).includes(twoWords)
      );
      if (twoWordMatch) {
        matched.push(twoWords);
        i += 2;
        continue;
      }
    }

    // Try single word
    const singleWordMatch = commonItems.find(item => {
      const itemNorm = normalize(item.name);
      return itemNorm.includes(words[i]) || words[i].includes(itemNorm.split(' ')[0]);
    });

    if (singleWordMatch || KEEP_WORDS.has(words[i])) {
      matched.push(words[i]);
    }
    i++;
  }

  return matched.length > 0 ? matched : words.slice(0, 5); // fallback to first 5 non-stop words
}

/**
 * Extract pattern name from text (for create/edit pattern intents)
 */
function extractPatternName(text: string): string | undefined {
  const normalized = normalize(text);

  // Look for "called X" or "named X" patterns
  const calledMatch = normalized.match(/called\s+([^,]+)/);
  if (calledMatch) {
    return capitalize(calledMatch[1].trim());
  }

  const namedMatch = normalized.match(/named\s+([^,]+)/);
  if (namedMatch) {
    return capitalize(namedMatch[1].trim());
  }

  // Look for pattern after "recipe" or "meal"
  const recipeMatch = normalized.match(/recipe\s+(\w+(?:\s+\w+)?)/);
  if (recipeMatch && !['called', 'named', 'with', 'for'].includes(recipeMatch[1])) {
    return capitalize(recipeMatch[1].trim());
  }

  return undefined;
}

/**
 * Extract ingredients list for pattern creation
 */
function extractPatternIngredients(text: string): string[] {
  const normalized = normalize(text);

  // Look for "with X, Y, and Z" pattern
  const withMatch = normalized.match(/with\s+(.+)/);
  if (withMatch) {
    const ingredientsPart = withMatch[1];
    // Split by comma and "and"
    return ingredientsPart
      .split(/,|\sand\s/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => {
        // Try to match to known items
        const match = matchItem(s);
        return match.name;
      });
  }

  return [];
}

// =============================================================================
// Main Parser Function
// =============================================================================

/**
 * Parse voice input text and extract intent, items, and other entities
 */
export function parseVoiceInput(
  text: string,
  recentItems: string[] = []
): ParsedVoiceInput {
  const normalized = normalize(text);

  // Detect intent
  const { intent, confidence } = detectIntent(normalized);

  // Extract location from text
  const extractedLocation = extractLocation(normalized);

  // Build result based on intent
  const result: ParsedVoiceInput = {
    intent,
    confidence,
    extractedLocation,
    raw: text,
  };

  switch (intent) {
    case 'add_items':
    case 'remove_items': {
      // Extract items
      const itemNames = extractItemNames(normalized);
      const quantity = extractQuantity(normalized);

      result.items = itemNames.map(name => {
        const parsed = matchItem(name, recentItems);
        return {
          ...parsed,
          quantity: intent === 'remove_items' ? 'low' : quantity,
          location: extractedLocation || parsed.location,
        };
      });

      // Adjust confidence based on items found
      if (result.items.length === 0) {
        result.confidence = Math.min(result.confidence, 0.4);
      } else {
        const avgItemConfidence = result.items.reduce((sum, item) => sum + item.confidence, 0) / result.items.length;
        result.confidence = (result.confidence + avgItemConfidence) / 2;
      }
      break;
    }

    case 'create_pattern': {
      const patternName = extractPatternName(normalized);
      const ingredients = extractPatternIngredients(normalized);

      result.pattern = {
        name: patternName,
        addIngredients: ingredients,
      };

      // Lower confidence if we couldn't extract a name
      if (!patternName) {
        result.confidence = Math.min(result.confidence, 0.5);
      }
      break;
    }

    case 'edit_pattern': {
      const targetPattern = extractPatternName(normalized);
      const ingredients = extractPatternIngredients(normalized);

      // Check if this is an add or remove operation
      const isRemove = normalized.includes('remove from') || normalized.includes('take out');

      result.pattern = {
        targetPattern,
        addIngredients: isRemove ? undefined : ingredients,
        removeIngredients: isRemove ? ingredients : undefined,
      };
      break;
    }

    case 'unknown':
    default:
      // Try to extract items anyway - might still be useful
      const itemNames = extractItemNames(normalized);
      if (itemNames.length > 0) {
        result.items = itemNames.map(name => matchItem(name, recentItems));
      }
      break;
  }

  return result;
}

/**
 * Get a human-readable summary of the parsed result
 */
export function getParseResultSummary(result: ParsedVoiceInput): string {
  switch (result.intent) {
    case 'add_items':
      if (!result.items || result.items.length === 0) {
        return 'No items recognized';
      }
      return `Adding: ${result.items.map(i => i.name).join(', ')}`;

    case 'remove_items':
      if (!result.items || result.items.length === 0) {
        return 'No items recognized';
      }
      return `Removing: ${result.items.map(i => i.name).join(', ')}`;

    case 'create_pattern':
      if (!result.pattern?.name) {
        return 'Create new recipe (name not recognized)';
      }
      return `New recipe: ${result.pattern.name}`;

    case 'edit_pattern':
      if (!result.pattern?.targetPattern) {
        return 'Edit recipe (which one?)';
      }
      return `Edit: ${result.pattern.targetPattern}`;

    case 'unknown':
    default:
      return 'Could not understand. Try: "Add chicken to fridge" or "Used the milk"';
  }
}
