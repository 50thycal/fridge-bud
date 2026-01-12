'use client';

import { useInventory } from '@/hooks/useInventory';
import { useMeals } from '@/hooks/useMeals';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { MealOpportunity } from '@/lib/types';

export default function MealsPage() {
  const { items } = useInventory();
  const { ready, almostReady, opportunities } = useMeals(items);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 p-4">
        <h1 className="text-2xl font-bold">What Can I Make?</h1>
        <p className="text-zinc-500 mt-1">
          {ready.length} ready now • {almostReady.length} almost ready
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg mb-2">No inventory yet</p>
            <p className="text-zinc-600">Add items to see meal suggestions</p>
          </div>
        ) : (
          <>
            {/* Ready Now */}
            {ready.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-green-500 mb-3">
                  Ready Now
                </h2>
                <div className="space-y-3">
                  {ready.map((opportunity) => (
                    <MealCard key={opportunity.pattern.id} opportunity={opportunity} />
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
                    <MealCard key={opportunity.pattern.id} opportunity={opportunity} />
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
                      <MealCard key={opportunity.pattern.id} opportunity={opportunity} />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function MealCard({ opportunity }: { opportunity: MealOpportunity }) {
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
