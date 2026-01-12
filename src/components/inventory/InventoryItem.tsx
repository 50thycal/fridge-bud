'use client';

import { InventoryItem as InventoryItemType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface InventoryItemProps {
  item: InventoryItemType;
  onTap: () => void;
  onLongPress: () => void;
}

export function InventoryItemCard({ item, onTap, onLongPress }: InventoryItemProps) {
  const freshnessColors = {
    fresh: 'border-green-600',
    good: 'border-zinc-700',
    useSoon: 'border-yellow-600',
    bad: 'border-red-600',
  };

  const freshnessLabels = {
    fresh: 'Fresh',
    good: 'Good',
    useSoon: 'Use soon',
    bad: 'Toss',
  };

  const quantityIcons = {
    plenty: '●●●',
    some: '●●○',
    low: '●○○',
  };

  return (
    <button
      onClick={onTap}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
      className={`w-full text-left bg-zinc-900 border-2 ${freshnessColors[item.freshness]} rounded-xl p-4 transition-all active:scale-95 hover:bg-zinc-800`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-white text-lg">{item.name}</span>
        <span className="text-zinc-500 text-sm font-mono">{quantityIcons[item.quantity]}</span>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={item.freshness === 'fresh' ? 'success' : item.freshness === 'useSoon' ? 'warning' : item.freshness === 'bad' ? 'danger' : 'default'}>
          {freshnessLabels[item.freshness]}
        </Badge>
        <span className="text-xs text-zinc-500 capitalize">{item.location}</span>
      </div>
    </button>
  );
}
