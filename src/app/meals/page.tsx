'use client';

import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useMeals } from '@/hooks/useMeals';
import { useMealPatterns } from '@/hooks/useMealPatterns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { AddMealSheet } from '@/components/meals/AddMealSheet';
import { EditMealSheet } from '@/components/meals/EditMealSheet';
import { MealOpportunity, MealPattern } from '@/lib/types';

type ViewMode = 'suggestions' | 'library';

export default function MealsPage() {
  const { items } = useInventory();
  const { ready, almostReady, opportunities } = useMeals(items);
  const { patterns, add, update, remove, isCustomPattern } = useMealPatterns();

  const [viewMode, setViewMode] = useState<ViewMode>('suggestions');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingPattern, setEditingPattern] = useState<MealPattern | null>(null);

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
          />
        ) : (
          <LibraryView
            patterns={patterns}
            isCustomPattern={isCustomPattern}
            onEdit={setEditingPattern}
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
}: {
  items: unknown[];
  ready: MealOpportunity[];
  almostReady: MealOpportunity[];
  opportunities: MealOpportunity[];
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
      {/* Ready Now */}
      {ready.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-green-500 mb-3">
            Ready Now
          </h2>
          <div className="space-y-3">
            {ready.map((opportunity) => (
              <MealOpportunityCard key={opportunity.pattern.id} opportunity={opportunity} />
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
              <MealOpportunityCard key={opportunity.pattern.id} opportunity={opportunity} />
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
                <MealOpportunityCard key={opportunity.pattern.id} opportunity={opportunity} />
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
}: {
  patterns: MealPattern[];
  isCustomPattern: (id: string) => boolean;
  onEdit: (pattern: MealPattern) => void;
}) {
  const customPatterns = patterns.filter(p => isCustomPattern(p.id));
  const defaultPatterns = patterns.filter(p => !isCustomPattern(p.id));

  return (
    <>
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
            />
          ))}
        </div>
      </section>
    </>
  );
}

// Meal Opportunity Card (for suggestions view)
function MealOpportunityCard({ opportunity }: { opportunity: MealOpportunity }) {
  const { pattern, score, satisfied, missing, usesAgingItems, frictionLevel } = opportunity;

  return (
    <Card className="active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-white">{pattern.name}</h3>
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
    </Card>
  );
}

// Meal Pattern Card (for library view)
function MealPatternCard({
  pattern,
  isCustom,
  onEdit,
}: {
  pattern: MealPattern;
  isCustom: boolean;
  onEdit: () => void;
}) {
  return (
    <Card
      className="active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-white">{pattern.name}</h3>
        <Badge variant={isCustom ? 'success' : 'default'}>
          {isCustom ? 'Custom' : 'Default'}
        </Badge>
      </div>

      {pattern.description && (
        <p className="text-zinc-400 text-sm mb-3">{pattern.description}</p>
      )}

      {/* Required slots */}
      {pattern.requiredSlots.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-green-500 uppercase tracking-wide">Required: </span>
          <span className="text-sm text-zinc-300">
            {pattern.requiredSlots.map(s => s.role).join(', ')}
          </span>
        </div>
      )}

      {/* Flexible slots */}
      {pattern.flexibleSlots.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-yellow-500 uppercase tracking-wide">Flexible: </span>
          <span className="text-sm text-zinc-300">
            {pattern.flexibleSlots.map(s => s.role).join(', ')}
          </span>
        </div>
      )}

      {/* Tags & Info */}
      <div className="flex flex-wrap gap-1 mt-3">
        {pattern.mealTypes.map((type) => (
          <span key={type} className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded capitalize">
            {type}
          </span>
        ))}
        <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded capitalize">
          {pattern.effort}
        </span>
      </div>
    </Card>
  );
}
