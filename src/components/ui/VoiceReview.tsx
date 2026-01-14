'use client';

import { useState, useCallback } from 'react';
import {
  LLMParseResult,
  LLMParsedItem,
  LLMParsedPattern,
  ReviewableItem,
  ReviewablePattern,
  DuplicateAction,
  StorageLocation,
  QuantityLevel,
  EffortLevel,
  MealType,
  VoiceIntent,
} from '@/lib/types';
import { Button } from './Button';

// =============================================================================
// Types
// =============================================================================

interface VoiceReviewProps {
  result: LLMParseResult;
  onConfirm: (items: ReviewableItem[]) => void;
  onConfirmPattern?: (pattern: ReviewablePattern) => void;
  onCancel: () => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function VoiceReview({
  result,
  onConfirm,
  onConfirmPattern,
  onCancel,
}: VoiceReviewProps) {
  const isPatternIntent = result.intent === 'create_pattern' || result.intent === 'edit_pattern';

  // For pattern intents, render PatternReview
  if (isPatternIntent && result.pattern) {
    return (
      <PatternReview
        result={result}
        pattern={result.pattern}
        onConfirm={onConfirmPattern}
        onCancel={onCancel}
      />
    );
  }

  // For inventory intents, render ItemsReview
  return (
    <ItemsReview
      result={result}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// =============================================================================
// Items Review Component (for add_items/remove_items)
// =============================================================================

interface ItemsReviewProps {
  result: LLMParseResult;
  onConfirm: (items: ReviewableItem[]) => void;
  onCancel: () => void;
}

function ItemsReview({ result, onConfirm, onCancel }: ItemsReviewProps) {
  // Convert LLM items to reviewable items with temporary IDs
  const [reviewableItems, setReviewableItems] = useState<ReviewableItem[]>(() =>
    result.items.map((item, index) => ({
      ...item,
      id: `temp-${index}-${Date.now()}`,
      selected: true,
      duplicateAction: item.possibleDuplicate ? 'add' : undefined,
    }))
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const selectedItems = reviewableItems.filter(item => item.selected);
  const itemsToAdd = selectedItems.filter(item =>
    !item.possibleDuplicate || item.duplicateAction !== 'skip'
  );

  const handleToggleItem = useCallback((id: string) => {
    setReviewableItems(items =>
      items.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  const handleDuplicateAction = useCallback((id: string, action: DuplicateAction) => {
    setReviewableItems(items =>
      items.map(item =>
        item.id === id ? { ...item, duplicateAction: action } : item
      )
    );
  }, []);

  const handleUpdateItem = useCallback((id: string, updates: Partial<ReviewableItem>) => {
    setReviewableItems(items =>
      items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
    setEditingItemId(null);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(itemsToAdd);
  }, [onConfirm, itemsToAdd]);

  const intentLabel = getIntentLabel(result.intent);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-lg bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <IntentBadge intent={result.intent} />
            <span className="text-zinc-400 text-sm">
              {itemsToAdd.length} item{itemsToAdd.length !== 1 ? 's' : ''}
            </span>
          </div>
          {result.warnings.length > 0 && (
            <span className="text-yellow-500 text-xs">
              {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Raw transcription */}
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-zinc-500 text-sm italic">
            &quot;{result.raw}&quot;
          </p>
        </div>

        {/* Items list - scrollable */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-3 space-y-2 min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {reviewableItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              isEditing={editingItemId === item.id}
              onToggle={() => handleToggleItem(item.id)}
              onEdit={() => setEditingItemId(item.id)}
              onCancelEdit={() => setEditingItemId(null)}
              onSave={(updates) => handleUpdateItem(item.id, updates)}
              onDuplicateAction={(action) => handleDuplicateAction(item.id, action)}
              intent={result.intent}
            />
          ))}

          {reviewableItems.length === 0 && (
            <div className="text-center py-6 text-zinc-500">
              No items recognized. Try speaking again.
            </div>
          )}
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="bg-yellow-900/30 rounded-lg p-2 text-yellow-400 text-xs">
              {result.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-2 flex-shrink-0 border-t border-zinc-700 pt-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="flex-1"
            disabled={itemsToAdd.length === 0}
          >
            {intentLabel} {itemsToAdd.length > 0 ? `(${itemsToAdd.length})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Pattern Review Component (for create_pattern/edit_pattern)
// =============================================================================

interface PatternReviewProps {
  result: LLMParseResult;
  pattern: LLMParsedPattern;
  onConfirm?: (pattern: ReviewablePattern) => void;
  onCancel: () => void;
}

function PatternReview({ result, pattern, onConfirm, onCancel }: PatternReviewProps) {
  const [editedPattern, setEditedPattern] = useState<ReviewablePattern>(() => ({
    ...pattern,
    id: `pattern-${Date.now()}`,
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  const handleUpdatePattern = (updates: Partial<ReviewablePattern>) => {
    setEditedPattern(prev => ({ ...prev, ...updates }));
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setEditedPattern(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()],
      }));
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setEditedPattern(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleToggleMealType = (mealType: MealType) => {
    setEditedPattern(prev => {
      const has = prev.mealTypes.includes(mealType);
      const newTypes = has
        ? prev.mealTypes.filter(t => t !== mealType)
        : [...prev.mealTypes, mealType];
      // Ensure at least one meal type
      return { ...prev, mealTypes: newTypes.length > 0 ? newTypes : [mealType] };
    });
  };

  const handleConfirm = () => {
    onConfirm?.(editedPattern);
  };

  const isNewPattern = result.intent === 'create_pattern';
  const actionLabel = isNewPattern ? 'Create Meal' : 'Update Meal';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-lg bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <IntentBadge intent={result.intent} />
            {pattern.matchedExistingPattern && (
              <span className="text-yellow-400 text-xs">
                Editing: {pattern.matchedExistingPattern}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-zinc-400 hover:text-white text-sm"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Raw transcription */}
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-zinc-500 text-sm italic">
            &quot;{result.raw}&quot;
          </p>
        </div>

        {/* Pattern Details - scrollable */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-3 space-y-4 min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Meal Name */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide mb-1 block">
              Meal Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedPattern.name}
                onChange={(e) => handleUpdatePattern({ name: e.target.value })}
                className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2 text-lg font-medium"
              />
            ) : (
              <p className="text-white text-lg font-medium">{editedPattern.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide mb-1 block">
              Description
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedPattern.description}
                onChange={(e) => handleUpdatePattern({ description: e.target.value })}
                className="w-full bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                placeholder="Brief description of the meal"
              />
            ) : (
              <p className="text-zinc-300 text-sm">
                {editedPattern.description || 'No description'}
              </p>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide mb-2 block">
              Ingredients ({editedPattern.ingredients.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {editedPattern.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="bg-zinc-700 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                >
                  {ingredient}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {editedPattern.ingredients.length === 0 && (
                <span className="text-zinc-500 text-sm">No ingredients specified</span>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                  className="flex-1 bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm"
                  placeholder="Add ingredient..."
                />
                <Button variant="ghost" size="sm" onClick={handleAddIngredient}>
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Effort Level */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide mb-2 block">
              Effort Level
            </label>
            <div className="flex gap-2">
              {(['minimal', 'moderate', 'involved'] as EffortLevel[]).map(effort => (
                <button
                  key={effort}
                  onClick={() => isEditing && handleUpdatePattern({ effort })}
                  disabled={!isEditing}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editedPattern.effort === effort
                      ? 'bg-blue-600 text-white'
                      : isEditing
                        ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {effort.charAt(0).toUpperCase() + effort.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Types */}
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide mb-2 block">
              Meal Types
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => (
                <button
                  key={mealType}
                  onClick={() => isEditing && handleToggleMealType(mealType)}
                  disabled={!isEditing}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    editedPattern.mealTypes.includes(mealType)
                      ? 'bg-green-600 text-white'
                      : isEditing
                        ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="bg-yellow-900/30 rounded-lg p-2 text-yellow-400 text-xs">
              {result.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-2 flex-shrink-0 border-t border-zinc-700 pt-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="flex-1"
            disabled={!editedPattern.name.trim()}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Item Card Component
// =============================================================================

interface ItemCardProps {
  item: ReviewableItem;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<ReviewableItem>) => void;
  onDuplicateAction: (action: DuplicateAction) => void;
  intent: VoiceIntent;
}

function ItemCard({
  item,
  isEditing,
  onToggle,
  onEdit,
  onCancelEdit,
  onSave,
  onDuplicateAction,
  intent,
}: ItemCardProps) {
  const [editName, setEditName] = useState(item.name);
  const [editLocation, setEditLocation] = useState(item.location);
  const [editQuantity, setEditQuantity] = useState(item.quantity);

  const handleSave = () => {
    onSave({
      name: editName,
      location: editLocation,
      quantity: editQuantity,
    });
  };

  const isSkipped = item.possibleDuplicate && item.duplicateAction === 'skip';

  if (isEditing) {
    return (
      <div className="bg-zinc-700 rounded-xl p-3 space-y-3">
        {/* Name input */}
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full bg-zinc-600 text-white rounded-lg px-3 py-2 text-base"
          autoFocus
        />

        {/* Location selector */}
        <div className="flex gap-2">
          {(['fridge', 'freezer', 'pantry'] as StorageLocation[]).map(loc => (
            <button
              key={loc}
              onClick={() => setEditLocation(loc)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                editLocation === loc
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-600 text-zinc-300'
              }`}
            >
              {loc.charAt(0).toUpperCase() + loc.slice(1)}
            </button>
          ))}
        </div>

        {/* Quantity selector */}
        <div className="flex gap-2">
          {(['plenty', 'some', 'low'] as QuantityLevel[]).map(qty => (
            <button
              key={qty}
              onClick={() => setEditQuantity(qty)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                editQuantity === qty
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-600 text-zinc-300'
              }`}
            >
              {qty.charAt(0).toUpperCase() + qty.slice(1)}
            </button>
          ))}
        </div>

        {/* Save/Cancel buttons */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancelEdit} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-3 transition-all ${
        isSkipped
          ? 'bg-zinc-900 opacity-50'
          : item.selected
          ? 'bg-zinc-700'
          : 'bg-zinc-800 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            item.selected
              ? 'bg-green-600 border-green-600'
              : 'border-zinc-500 hover:border-zinc-400'
          }`}
        >
          {item.selected && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{item.name}</span>
            {item.possibleDuplicate && (
              <span className="bg-yellow-600 text-yellow-100 text-xs px-1.5 py-0.5 rounded">
                Exists
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
            <span className="capitalize">{item.location}</span>
            <span className="text-zinc-600">|</span>
            <span className="capitalize">{item.quantity}</span>
          </div>

          {/* Location override notice */}
          {item.locationOverridden && item.originalLocation && (
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Changed from {item.originalLocation} (typical storage)</span>
            </div>
          )}

          {/* Duplicate actions */}
          {item.possibleDuplicate && item.selected && (
            <div className="mt-2 flex gap-1">
              <DuplicateActionButton
                label="Add new"
                isActive={item.duplicateAction === 'add'}
                onClick={() => onDuplicateAction('add')}
              />
              <DuplicateActionButton
                label="Update qty"
                isActive={item.duplicateAction === 'update_quantity'}
                onClick={() => onDuplicateAction('update_quantity')}
              />
              <DuplicateActionButton
                label="Skip"
                isActive={item.duplicateAction === 'skip'}
                onClick={() => onDuplicateAction('skip')}
              />
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function IntentBadge({ intent }: { intent: VoiceIntent }) {
  const config = {
    add_items: { label: 'Adding', color: 'bg-green-600' },
    remove_items: { label: 'Removing', color: 'bg-red-600' },
    create_pattern: { label: 'New Recipe', color: 'bg-blue-600' },
    edit_pattern: { label: 'Edit Recipe', color: 'bg-yellow-600' },
    unknown: { label: 'Unknown', color: 'bg-zinc-600' },
  };

  const { label, color } = config[intent];

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium text-white ${color}`}>
      {label}
    </span>
  );
}

function DuplicateActionButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        isActive
          ? 'bg-yellow-600 text-white'
          : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
      }`}
    >
      {label}
    </button>
  );
}

function getIntentLabel(intent: VoiceIntent): string {
  switch (intent) {
    case 'add_items':
      return 'Add';
    case 'remove_items':
      return 'Remove';
    default:
      return 'Confirm';
  }
}

// =============================================================================
// Processing Overlay - shown while LLM is parsing
// =============================================================================

export function ProcessingOverlay() {
  return (
    <div className="fixed inset-x-0 bottom-20 mx-4 z-50">
      <div className="bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 p-6">
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-600" />
            <div className="absolute inset-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          </div>

          <div>
            <p className="text-white font-medium">Understanding your request...</p>
            <p className="text-zinc-500 text-sm">Analyzing items and locations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
