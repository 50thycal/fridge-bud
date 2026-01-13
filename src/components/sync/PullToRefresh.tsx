'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { pullAndMerge, getHouseholdCode } from '@/lib/storage';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

const PULL_THRESHOLD = 80; // pixels to pull before triggering refresh
const MAX_PULL = 120; // max pull distance

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    // Only refresh if connected to a household
    const code = getHouseholdCode();
    if (!code) {
      setPullDistance(0);
      return;
    }

    setIsRefreshing(true);
    try {
      await pullAndMerge();
      onRefresh?.();
    } catch (error) {
      console.error('Pull to refresh error:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (!container || container.scrollTop > 0 || isRefreshing) return;

    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    // Only pull down, not up
    if (diff > 0) {
      // Apply resistance to the pull
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);

      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, handleRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorOpacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const indicatorScale = 0.5 + (indicatorOpacity * 0.5);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div ref={containerRef} className="h-dvh overflow-auto">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          height: isRefreshing ? 50 : pullDistance,
          opacity: indicatorOpacity,
        }}
      >
        <div
          className={`flex items-center gap-2 text-sm ${shouldTrigger ? 'text-green-400' : 'text-zinc-400'}`}
          style={{
            transform: `scale(${indicatorScale})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <svg
                className={`h-5 w-5 transition-transform duration-200 ${shouldTrigger ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>{shouldTrigger ? 'Release to sync' : 'Pull to sync'}</span>
            </>
          )}
        </div>
      </div>

      {/* Main content - only apply transform when actively pulling to preserve fixed positioning */}
      <div
        style={pullDistance > 0 || isRefreshing ? {
          transform: `translateY(${-pullDistance * 0.1}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
        } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
