'use client';

import { useState, useRef } from 'react';
import { MealPattern } from '@/lib/types';

interface MealPatternCardProps {
  pattern: MealPattern;
  onEdit: () => void;
  onDelete: () => void;
}

export function MealPatternCard({ pattern, onEdit, onDelete }: MealPatternCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
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
    // Allow both directions - left for delete, right for edit
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
    // Allow both directions
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
        className={`relative w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 select-none cursor-grab active:cursor-grabbing`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-white">{pattern.name}</h3>
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
      </div>
    </div>
  );
}
