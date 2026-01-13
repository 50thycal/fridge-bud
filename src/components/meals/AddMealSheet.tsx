'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MealPattern, EffortLevel, MealType, IngredientCategory, IngredientSlot } from '@/lib/types';

interface AddMealSheetProps {
  onAdd: (pattern: Omit<MealPattern, 'id'>) => void;
  onClose: () => void;
}

const effortOptions: { value: EffortLevel; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'involved', label: 'Involved' },
];

const mealTypeOptions: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

const categoryOptions: { value: IngredientCategory; label: string }[] = [
  { value: 'protein', label: 'Protein' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'grain', label: 'Grain' },
  { value: 'condiment', label: 'Condiment' },
  { value: 'other', label: 'Other' },
];

const commonTags = ['quick', 'healthy', 'comfort', 'easy', 'filling', 'light', 'classic', 'versatile'];

export function AddMealSheet({ onAdd, onClose }: AddMealSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState<EffortLevel>('moderate');
  const [mealTypes, setMealTypes] = useState<MealType[]>(['dinner']);
  const [tags, setTags] = useState<string[]>([]);
  const [requiredSlots, setRequiredSlots] = useState<IngredientSlot[]>([]);
  const [flexibleSlots, setFlexibleSlots] = useState<IngredientSlot[]>([]);

  // For adding new slot
  const [newSlotRole, setNewSlotRole] = useState('');
  const [newSlotCategory, setNewSlotCategory] = useState<IngredientCategory>('protein');
  const [newSlotType, setNewSlotType] = useState<'required' | 'flexible'>('required');

  const toggleMealType = (type: MealType) => {
    setMealTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addSlot = () => {
    if (!newSlotRole.trim()) return;

    const slot: IngredientSlot = {
      role: newSlotRole.trim(),
      acceptedCategories: [newSlotCategory],
      optional: false,
    };

    if (newSlotType === 'required') {
      setRequiredSlots(prev => [...prev, slot]);
    } else {
      setFlexibleSlots(prev => [...prev, slot]);
    }

    setNewSlotRole('');
  };

  const removeRequiredSlot = (index: number) => {
    setRequiredSlots(prev => prev.filter((_, i) => i !== index));
  };

  const removeFlexibleSlot = (index: number) => {
    setFlexibleSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!name.trim() || mealTypes.length === 0) return;

    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      requiredSlots,
      flexibleSlots,
      optionalUpgrades: [],
      effort,
      mealTypes,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Add Meal</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Meal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stir Fry"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Protein and veggies over rice"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Effort */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Effort Level
            </label>
            <div className="flex gap-2">
              {effortOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setEffort(value)}
                  className={`flex-1 p-3 rounded-xl font-medium transition-colors ${
                    effort === value
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Types */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Meal Types
            </label>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleMealType(value)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    mealTypes.includes(value)
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient Slots */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Ingredient Slots
            </label>

            {/* Existing slots */}
            {requiredSlots.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-green-500 uppercase tracking-wide mb-2">Required</p>
                <div className="flex flex-wrap gap-2">
                  {requiredSlots.map((slot, i) => (
                    <span
                      key={i}
                      className="bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                    >
                      {slot.role} ({slot.acceptedCategories?.[0]})
                      <button
                        onClick={() => removeRequiredSlot(i)}
                        className="text-green-300 hover:text-white"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {flexibleSlots.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-yellow-500 uppercase tracking-wide mb-2">Flexible</p>
                <div className="flex flex-wrap gap-2">
                  {flexibleSlots.map((slot, i) => (
                    <span
                      key={i}
                      className="bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                    >
                      {slot.role} ({slot.acceptedCategories?.[0]})
                      <button
                        onClick={() => removeFlexibleSlot(i)}
                        className="text-yellow-300 hover:text-white"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add new slot */}
            <div className="bg-zinc-800 rounded-xl p-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSlotRole}
                  onChange={(e) => setNewSlotRole(e.target.value)}
                  placeholder="Role (e.g., protein)"
                  className="flex-1 bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <select
                  value={newSlotCategory}
                  onChange={(e) => setNewSlotCategory(e.target.value as IngredientCategory)}
                  className="bg-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {categoryOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewSlotType('required')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newSlotType === 'required'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  Required
                </button>
                <button
                  onClick={() => setNewSlotType('flexible')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newSlotType === 'flexible'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  Flexible
                </button>
                <Button onClick={addSlot} size="sm" disabled={!newSlotRole.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800">
          <Button
            onClick={handleAdd}
            disabled={!name.trim() || mealTypes.length === 0}
            className="w-full"
            size="lg"
          >
            Add Meal
          </Button>
        </div>
      </div>
    </div>
  );
}
