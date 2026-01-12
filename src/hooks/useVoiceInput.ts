'use client';

import { useState, useCallback, useRef } from 'react';
import { VoiceState, ParsedVoiceInput, TranscriptionResult } from '@/lib/types';
import { VoiceRecorder, isVoiceRecordingSupported } from '@/lib/voice/recorder';
import { parseVoiceInput } from '@/lib/voice/parser';

// =============================================================================
// Types
// =============================================================================

export interface UseVoiceInputOptions {
  onResult?: (result: ParsedVoiceInput) => void;
  onError?: (error: string) => void;
  recentItems?: string[];
}

export interface UseVoiceInputReturn {
  // State
  state: VoiceState;
  elapsedMs: number;
  error: string | null;
  parsedResult: ParsedVoiceInput | null;
  transcription: string | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  confirmResult: () => void;
  clearResult: () => void;

  // Checks
  isSupported: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onResult, onError, recentItems = [] } = options;

  // State
  const [state, setState] = useState<VoiceState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceInput | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  // Refs
  const recorderRef = useRef<VoiceRecorder | null>(null);

  // =============================================================================
  // Transcription API Call
  // =============================================================================

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<TranscriptionResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Transcription failed: ${response.status}`);
    }

    return response.json();
  }, []);

  // =============================================================================
  // Recording Actions
  // =============================================================================

  const startRecording = useCallback(async () => {
    if (!isVoiceRecordingSupported()) {
      const errorMsg = 'Voice recording is not supported in this browser';
      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
      return;
    }

    // Reset state
    setError(null);
    setParsedResult(null);
    setTranscription(null);
    setElapsedMs(0);

    // Create recorder
    recorderRef.current = new VoiceRecorder();

    try {
      await recorderRef.current.start({
        onStart: () => {
          setState('recording');
        },
        onStop: async (result) => {
          setState('transcribing');

          try {
            // Transcribe audio
            const transcriptionResult = await transcribeAudio(result.audioBlob);
            setTranscription(transcriptionResult.text);

            // Parse the transcription
            const parsed = parseVoiceInput(transcriptionResult.text, recentItems);
            setParsedResult(parsed);
            setState('confirming');
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to process audio';
            setError(errorMsg);
            setState('error');
            onError?.(errorMsg);
          }
        },
        onError: (err) => {
          setError(err.message);
          setState('error');
          onError?.(err.message);
        },
        onWarning: () => {
          // The recorder handles the ding sound
        },
        onTimeUpdate: (elapsed) => {
          setElapsedMs(elapsed);
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
      setState('error');
      onError?.(errorMsg);
    }
  }, [transcribeAudio, recentItems, onError]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    setState('idle');
    setElapsedMs(0);
    setParsedResult(null);
    setTranscription(null);
  }, []);

  // =============================================================================
  // Result Actions
  // =============================================================================

  const confirmResult = useCallback(() => {
    if (parsedResult) {
      onResult?.(parsedResult);
    }
    setState('idle');
    setParsedResult(null);
    setTranscription(null);
  }, [parsedResult, onResult]);

  const clearResult = useCallback(() => {
    setState('idle');
    setParsedResult(null);
    setTranscription(null);
    setError(null);
  }, []);

  // =============================================================================
  // Return
  // =============================================================================

  return {
    // State
    state,
    elapsedMs,
    error,
    parsedResult,
    transcription,

    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    confirmResult,
    clearResult,

    // Checks
    isSupported: typeof window !== 'undefined' && isVoiceRecordingSupported(),
  };
}
