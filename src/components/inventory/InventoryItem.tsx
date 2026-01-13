'use client';

import { useState, useRef } from 'react';
import { InventoryItem as InventoryItemType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit: () => void;
  onDelete: () => void;
}

export function InventoryItemCard({ item, onEdit, onDelete }: InventoryItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

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

  // Format date added
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Limit swipe distance
    const clampedDiff = Math.max(-100, Math.min(100, diff));
    setSwipeX(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Swipe left threshold for delete
    if (swipeX < -60) {
      onDelete();
    }
    // Swipe right threshold for edit
    else if (swipeX > 60) {
      onEdit();
    }

    // Reset position
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
    const clampedDiff = Math.max(-100, Math.min(100, diff));
    setSwipeX(clampedDiff);
  };

  const handleMouseUp = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (swipeX < -60) {
      onDelete();
    } else if (swipeX > 60) {
      onEdit();
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
      {/* Background actions revealed on swipe */}
      <div className="absolute inset-0 flex">
        {/* Edit action (swipe right reveals this on left) */}
        <div
          className="flex-1 bg-blue-600 flex items-center justify-start pl-4"
          style={{ opacity: swipeX > 0 ? Math.min(swipeX / 60, 1) : 0 }}
        >
          <span className="text-white font-medium">Edit</span>
        </div>
        {/* Delete action (swipe left reveals this on right) */}
        <div
          className="flex-1 bg-red-600 flex items-center justify-end pr-4"
          style={{ opacity: swipeX < 0 ? Math.min(Math.abs(swipeX) / 60, 1) : 0 }}
        >
          <span className="text-white font-medium">Delete</span>
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
        className={`relative w-full text-left bg-zinc-900 border-2 ${freshnessColors[item.freshness]} rounded-xl p-4 select-none cursor-grab active:cursor-grabbing`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-white text-lg">{item.name}</span>
          <span className="text-zinc-500 text-sm font-mono">{quantityIcons[item.quantity]}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={item.freshness === 'fresh' ? 'success' : item.freshness === 'useSoon' ? 'warning' : item.freshness === 'bad' ? 'danger' : 'default'}>
              {freshnessLabels[item.freshness]}
            </Badge>
            <span className="text-xs text-zinc-500 capitalize">{item.location}</span>
          </div>
          {/* Date added tag */}
          <span className="text-xs text-zinc-600">
            {formatDate(item.addedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
