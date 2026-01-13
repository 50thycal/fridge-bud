'use client';

import { VoiceState } from '@/lib/types';

interface VoiceButtonProps {
  state: VoiceState;
  elapsedMs?: number;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceButton({
  state,
  elapsedMs = 0,
  onClick,
  disabled = false,
  size = 'md',
}: VoiceButtonProps) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';
  const isError = state === 'error';

  // Format elapsed time as seconds
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const maxSeconds = 30;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isTranscribing}
      className={`
        ${sizes[size]}
        relative rounded-full
        flex items-center justify-center
        transition-all duration-200
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isRecording
          ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30'
          : isTranscribing
            ? 'bg-yellow-500 cursor-wait'
            : isError
              ? 'bg-red-800 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-500'
        }
      `}
      aria-label={
        isRecording
          ? 'Stop recording'
          : isTranscribing
            ? 'Transcribing...'
            : 'Start voice input'
      }
    >
      {/* Recording ring animation */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
      )}

      {/* Transcribing spinner */}
      {isTranscribing && (
        <span className="absolute inset-0 rounded-full border-2 border-yellow-300 border-t-transparent animate-spin" />
      )}

      {/* Icon */}
      {isRecording ? (
        // Stop icon (square)
        <svg
          className={`${iconSizes[size]} text-white`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : isTranscribing ? (
        // Processing dots
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      ) : (
        // Microphone icon
        <svg
          className={`${iconSizes[size]} text-white`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"
          />
        </svg>
      )}

      {/* Recording timer */}
      {isRecording && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-400 whitespace-nowrap">
          {elapsedSeconds}s / {maxSeconds}s
        </span>
      )}
    </button>
  );
}

// =============================================================================
// Mini version for BottomNav
// =============================================================================

interface VoiceMiniButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceMiniButton({
  state,
  onClick,
  disabled = false,
}: VoiceMiniButtonProps) {
  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isTranscribing}
      className={`
        w-12 h-12
        -mt-4
        relative rounded-full
        flex items-center justify-center
        transition-all duration-200
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg
        ${isRecording
          ? 'bg-red-500 shadow-red-500/30'
          : isTranscribing
            ? 'bg-yellow-500'
            : 'bg-green-600 hover:bg-green-500 shadow-green-600/30'
        }
      `}
      aria-label={
        isRecording
          ? 'Stop recording'
          : isTranscribing
            ? 'Transcribing...'
            : 'Voice input'
      }
    >
      {/* Recording pulse */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
      )}

      {/* Transcribing spinner */}
      {isTranscribing && (
        <span className="absolute inset-0 rounded-full border-2 border-yellow-300 border-t-transparent animate-spin" />
      )}

      {/* Icon */}
      {isRecording ? (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : isTranscribing ? (
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      ) : (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
        </svg>
      )}
    </button>
  );
}
