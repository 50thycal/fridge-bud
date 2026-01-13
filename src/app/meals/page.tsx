'use client';

import { useState, useRef } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useMeals } from '@/hooks/useMeals';
import { useMealPatterns } from '@/hooks/useMealPatterns';
import { useGrocery } from '@/hooks/useGrocery';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { AddMealSheet } from '@/components/meals/AddMealSheet';
import { EditMealSheet } from '@/components/meals/EditMealSheet';
import { MealPatternCard } from '@/components/meals/MealPatternCard';
import { MealOpportunity, MealPattern, IngredientSlot } from '@/lib/types';

type ViewMode = 'suggestions' | 'library';

export default function MealsPage() {
  const { items } = useInventory();
  const { ready, almostReady, opportunities } = useMeals(items);
  const { patterns, add, update, remove, isCustomPattern } = useMealPatterns();
  const { add: addToGrocery } = useGrocery(items);

  const [viewMode, setViewMode] = useState<ViewMode>('suggestions');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingPattern, setEditingPattern] = useState<MealPattern | null>(null);

  const handleAddMissingToGrocery = (missing: IngredientSlot[], mealName: string) => {
    missing.forEach((slot) => {
      const itemName = slot.specificItems?.[0] || slot.role;
      addToGrocery(
        itemName,
        slot.acceptedCategories?.[0] || 'other',
        `For ${mealName}`,
        'opportunity'
      );
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Meals</h1>
              <p className="text-zinc-500 mt-1">
                {viewMode === 'suggestions'
                  ? `${ready.length} ready now`
                  : `${patterns.length} meals`}
              </p>
            </div>
            <Button onClick={() => setShowAddSheet(true)} size="md">
              + Add
            </Button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('suggestions')}
              className={`flex-1 py-2 px-4 rounded-full font-medium transition-colors ${
                viewMode === 'suggestions'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Suggestions
            </button>
            <button
              onClick={() => setViewMode('library')}
              className={`flex-1 py-2 px-4 rounded-full font-medium transition-colors ${
                viewMode === 'library'
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              Library
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {viewMode === 'suggestions' ? (
          <SuggestionsView
            items={items}
            ready={ready}
            almostReady={almostReady}
            opportunities={opportunities}
            onAddMissingToGrocery={handleAddMissingToGrocery}
          />
        ) : (
          <LibraryView
            patterns={patterns}
            isCustomPattern={isCustomPattern}
            onEdit={setEditingPattern}
            onDelete={remove}
          />
        )}
      </div>

      {/* Sheets */}
      {showAddSheet && (
        <AddMealSheet
          onAdd={add}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {editingPattern && (
        <EditMealSheet
          pattern={editingPattern}
          isCustom={isCustomPattern(editingPattern.id)}
          onUpdate={(updates) => update(editingPattern.id, updates)}
          onDelete={() => remove(editingPattern.id)}
          onClose={() => setEditingPattern(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

// Suggestions View Component
function SuggestionsView({
  items,
  ready,
  almostReady,
  opportunities,
  onAddMissingToGrocery,
}: {
  items: unknown[];
  ready: MealOpportunity[];
  almostReady: MealOpportunity[];
  opportunities: MealOpportunity[];
  onAddMissingToGrocery: (missing: IngredientSlot[], mealName: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 text-lg mb-2">No inventory yet</p>
        <p className="text-zinc-600">Add items to see meal suggestions</p>
      </div>
    );
  }

  return (
    <>
      {/* Swipe hint */}
      <p className="text-xs text-zinc-600 text-center mb-4">
        Swipe right to add missing ingredients to grocery list
      </p>

      {/* Ready Now */}
      {ready.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-green-500 mb-3">
            Ready Now
          </h2>
          <div className="space-y-3">
            {ready.map((opportunity) => (
              <MealOpportunityCard
                key={opportunity.pattern.id}
                opportunity={opportunity}
                onAddToGrocery={() => onAddMissingToGrocery(opportunity.missing, opportunity.pattern.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Almost Ready */}
      {almostReady.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-yellow-500 mb-3">
            One Ingredient Away
          </h2>
          <div className="space-y-3">
            {almostReady.map((opportunity) => (
              <MealOpportunityCard
                key={opportunity.pattern.id}
                opportunity={opportunity}
                onAddToGrocery={() => onAddMissingToGrocery(opportunity.missing, opportunity.pattern.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Need Shopping */}
      {opportunities.filter(o => o.frictionLevel === 'needsShopping').length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-500 mb-3">
            Need Shopping
          </h2>
          <div className="space-y-3">
            {opportunities
              .filter(o => o.frictionLevel === 'needsShopping')
              .slice(0, 5)
              .map((opportunity) => (
                <MealOpportunityCard
                  key={opportunity.pattern.id}
                  opportunity={opportunity}
                  onAddToGrocery={() => onAddMissingToGrocery(opportunity.missing, opportunity.pattern.name)}
                />
              ))}
          </div>
        </section>
      )}

      {ready.length === 0 && almostReady.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-lg mb-2">No meals available</p>
          <p className="text-zinc-600">Add more items to your inventory</p>
        </div>
      )}
    </>
  );
}

// Library View Component
function LibraryView({
  patterns,
  isCustomPattern,
  onEdit,
  onDelete,
}: {
  patterns: MealPattern[];
  isCustomPattern: (id: string) => boolean;
  onEdit: (pattern: MealPattern) => void;
  onDelete: (id: string) => void;
}) {
  const customPatterns = patterns.filter(p => isCustomPattern(p.id));
  const defaultPatterns = patterns.filter(p => !isCustomPattern(p.id));

  return (
    <>
      {/* Swipe hint */}
      <p className="text-xs text-zinc-600 text-center mb-4">
        Swipe right to view details{customPatterns.length > 0 ? ', swipe left on custom meals to delete' : ''}
      </p>

      {/* Custom Meals */}
      {customPatterns.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-green-500 mb-3">
            My Meals ({customPatterns.length})
          </h2>
          <div className="space-y-3">
            {customPatterns.map((pattern) => (
              <MealPatternCard
                key={pattern.id}
                pattern={pattern}
                isCustom={true}
                onEdit={() => onEdit(pattern)}
                onDelete={() => onDelete(pattern.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Default Meals */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-400 mb-3">
          Default Meals ({defaultPatterns.length})
        </h2>
        <div className="space-y-3">
          {defaultPatterns.map((pattern) => (
            <MealPatternCard
              key={pattern.id}
              pattern={pattern}
              isCustom={false}
              onEdit={() => onEdit(pattern)}
              onDelete={() => {}}
            />
          ))}
        </div>
      </section>
    </>
  );
}

// Meal Opportunity Card (for suggestions view)
function MealOpportunityCard({
  opportunity,
  onAddToGrocery,
}: {
  opportunity: MealOpportunity;
  onAddToGrocery: () => void;
}) {
  const { pattern, score, satisfied, missing, usesAgingItems, frictionLevel } = opportunity;
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Only allow right swipe (positive values)
    const clampedDiff = Math.max(0, Math.min(100, diff));
    setSwipeX(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Calculate diff directly from refs to avoid stale state
    const diff = currentX.current - startX.current;

    // Swipe right threshold for adding to grocery
    if (diff > 60 && missing.length > 0) {
      onAddToGrocery();
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }

    setSwipeX(0);
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    const clampedDiff = Math.max(0, Math.min(100, diff));
    setSwipeX(clampedDiff);
  };

  const handleMouseUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    // Calculate diff directly from refs to avoid stale state
    const diff = currentX.current - startX.current;

    if (diff > 60 && missing.length > 0) {
      onAddToGrocery();
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    }

    setSwipeX(0);
  };

  const handleMouseLeave = () => {
    if (isSwiping) {
      setIsSwiping(false);
      setSwipeX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action revealed on swipe right */}
      <div className="absolute inset-0 flex">
        <div
          className="flex-1 bg-green-600 flex items-center justify-start pl-4"
          style={{ opacity: swipeX > 0 ? Math.min(swipeX / 60, 1) : 0 }}
        >
          <span className="text-white font-medium">
            {missing.length > 0 ? 'Add to List' : 'Ready!'}
          </span>
        </div>
      </div>

      {/* Swipeable card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        className="relative w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-white">{pattern.name}</h3>
          <div className="flex items-center gap-2">
            {showAdded && (
              <span className="text-xs text-green-400 animate-pulse">Added!</span>
            )}
            <Badge
              variant={
                frictionLevel === 'ready'
                  ? 'success'
                  : frictionLevel === 'oneAway'
                  ? 'warning'
                  : 'default'
              }
            >
              {score}%
            </Badge>
          </div>
        </div>

        {pattern.description && (
          <p className="text-zinc-400 text-sm mb-3">{pattern.description}</p>
        )}

        {/* What you have */}
        {satisfied.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Have: </span>
            <span className="text-sm text-zinc-300">
              {satisfied.map(s => s.item.name).join(', ')}
            </span>
          </div>
        )}

        {/* What's missing */}
        {missing.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Need: </span>
            <span className="text-sm text-yellow-400">
              {missing.map(m => m.specificItems?.[0] || m.role).join(', ')}
            </span>
          </div>
        )}

        {/* Uses aging items callout */}
        {usesAgingItems.length > 0 && (
          <div className="mt-2 text-xs text-green-400">
            Uses items that should be eaten soon: {usesAgingItems.map(i => i.name).join(', ')}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {pattern.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
          <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded capitalize">
            {pattern.effort}
          </span>
        </div>
      </div>
    </div>
  );
}

