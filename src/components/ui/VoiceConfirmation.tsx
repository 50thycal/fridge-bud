'use client';

import { useEffect, useState, useCallback } from 'react';
import { ParsedVoiceInput, ParsedItem } from '@/lib/types';
import { getParseResultSummary } from '@/lib/voice/parser';
import { Button } from './Button';

interface VoiceConfirmationProps {
  result: ParsedVoiceInput;
  onConfirm: (result: ParsedVoiceInput) => void;
  onEdit: () => void;
  onCancel: () => void;
  autoConfirmSeconds?: number;
}

export function VoiceConfirmation({
  result,
  onConfirm,
  onEdit,
  onCancel,
  autoConfirmSeconds = 3,
}: VoiceConfirmationProps) {
  const [countdown, setCountdown] = useState(autoConfirmSeconds);
  const [isPaused, setIsPaused] = useState(false);

  const handleConfirm = useCallback(() => {
    onConfirm(result);
  }, [onConfirm, result]);

  // Auto-confirm countdown
  useEffect(() => {
    if (isPaused || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, countdown, handleConfirm]);

  // Pause countdown on any interaction
  const pauseCountdown = () => {
    setIsPaused(true);
  };

  const summary = getParseResultSummary(result);
  const isLowConfidence = result.confidence < 0.6;
  const hasAmbiguousItems = result.items?.some(item => item.ambiguous) ?? false;

  return (
    <div
      className="fixed inset-x-0 bottom-20 mx-4 z-50"
      onMouseEnter={pauseCountdown}
      onTouchStart={pauseCountdown}
    >
      <div className="bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
        {/* Header with intent badge */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <IntentBadge intent={result.intent} />
          {!isPaused && countdown > 0 && (
            <span className="text-xs text-zinc-500">
              Auto-confirm in {countdown}s
            </span>
          )}
        </div>

        {/* Main content */}
        <div className="px-4 pb-3">
          <p className="text-white text-lg font-medium">{summary}</p>

          {/* Show raw transcription */}
          <p className="text-zinc-500 text-sm mt-1 italic">
            &quot;{result.raw}&quot;
          </p>

          {/* Show items if available */}
          {result.items && result.items.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.items.map((item, index) => (
                <ItemChip key={index} item={item} />
              ))}
            </div>
          )}

          {/* Low confidence warning */}
          {(isLowConfidence || hasAmbiguousItems) && (
            <div className="mt-3 flex items-start gap-2 text-yellow-500 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                {isLowConfidence
                  ? "I'm not sure I understood correctly. Please review."
                  : 'Some items may have multiple matches. Tap Edit to choose.'}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              pauseCountdown();
              onEdit();
            }}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>

        {/* Progress bar for auto-confirm */}
        {!isPaused && countdown > 0 && (
          <div className="h-1 bg-zinc-700">
            <div
              className="h-full bg-green-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / autoConfirmSeconds) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function IntentBadge({ intent }: { intent: ParsedVoiceInput['intent'] }) {
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

function ItemChip({ item }: { item: ParsedItem }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm
        ${item.ambiguous
          ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700'
          : 'bg-zinc-700 text-zinc-200'
        }
      `}
    >
      {item.name}
      {item.ambiguous && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );
}

// =============================================================================
// Recording Overlay - shown while recording
// =============================================================================

interface RecordingOverlayProps {
  elapsedMs: number;
  onStop: () => void;
  onCancel: () => void;
}

export function RecordingOverlay({
  elapsedMs,
  onStop,
  onCancel,
}: RecordingOverlayProps) {
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const maxSeconds = 30;
  const progress = (elapsedMs / 30000) * 100;
  const isNearEnd = elapsedSeconds >= 25; // Warning zone

  return (
    <div className="fixed inset-x-0 bottom-20 mx-4 z-50">
      <div className="bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 p-4">
        <div className="flex items-center gap-4">
          {/* Pulsing indicator */}
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
            <span className="relative block w-4 h-4 rounded-full bg-red-500" />
          </div>

          <div className="flex-1">
            <p className="text-white font-medium">Listening...</p>
            <p className="text-zinc-400 text-sm">
              Tap the mic button or speak to stop
            </p>
          </div>

          <div className="text-right">
            <p className={`font-mono text-lg ${isNearEnd ? 'text-yellow-400' : 'text-white'}`}>
              {elapsedSeconds}s
            </p>
            <p className="text-zinc-500 text-xs">/ {maxSeconds}s</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isNearEnd ? 'bg-yellow-400' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onStop}
            className="flex-1 bg-red-600 hover:bg-red-500"
          >
            Done Speaking
          </Button>
        </div>
      </div>
    </div>
  );
}
