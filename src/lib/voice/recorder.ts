// Audio Recorder - MediaRecorder API wrapper for voice input

import { VoiceRecordingResult } from '@/lib/types';

// =============================================================================
// Constants
// =============================================================================

const MAX_RECORDING_DURATION_MS = 30000; // 30 seconds
const WARNING_BEFORE_END_MS = 5000; // Ding 5 seconds before end
const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus';
const FALLBACK_MIME_TYPE = 'audio/webm';

// =============================================================================
// Types
// =============================================================================

export interface RecorderCallbacks {
  onStart?: () => void;
  onStop?: (result: VoiceRecordingResult) => void;
  onError?: (error: Error) => void;
  onWarning?: () => void; // Called 5 seconds before max duration
  onTimeUpdate?: (elapsedMs: number) => void;
}

export interface RecorderState {
  isRecording: boolean;
  elapsedMs: number;
  error: string | null;
}

// =============================================================================
// Audio Context for Warning Sound
// =============================================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a short ding sound to warn user recording is ending
 */
export function playWarningDing(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently fail if audio context isn't available
    console.warn('Could not play warning ding');
  }
}

// =============================================================================
// Recorder Class
// =============================================================================

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private maxDurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private warningTimeout: ReturnType<typeof setTimeout> | null = null;
  private callbacks: RecorderCallbacks = {};

  /**
   * Check if browser supports audio recording
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof navigator === 'undefined') return false;
    if (!navigator.mediaDevices) return false;
    if (typeof navigator.mediaDevices.getUserMedia !== 'function') return false;
    if (typeof window.MediaRecorder === 'undefined') return false;
    return true;
  }

  /**
   * Get the best supported MIME type
   */
  private static getSupportedMimeType(): string {
    if (MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)) {
      return AUDIO_MIME_TYPE;
    }
    if (MediaRecorder.isTypeSupported(FALLBACK_MIME_TYPE)) {
      return FALLBACK_MIME_TYPE;
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4';
    }
    return ''; // Let browser choose
  }

  /**
   * Start recording audio
   */
  async start(callbacks: RecorderCallbacks = {}): Promise<void> {
    if (this.mediaRecorder?.state === 'recording') {
      throw new Error('Already recording');
    }

    this.callbacks = callbacks;
    this.audioChunks = [];

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Whisper prefers 16kHz
        },
      });

      // Create MediaRecorder
      const mimeType = VoiceRecorder.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType || undefined,
      });

      // Handle data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.handleStop();
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`Recording error: ${(event as unknown as { error: Error }).error?.message || 'Unknown error'}`);
        this.callbacks.onError?.(error);
        this.cleanup();
      };

      // Start recording
      this.startTime = Date.now();
      this.mediaRecorder.start(100); // Collect data every 100ms

      // Set up time update interval
      this.timeUpdateInterval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        this.callbacks.onTimeUpdate?.(elapsed);
      }, 100);

      // Set up warning ding (5 seconds before max)
      this.warningTimeout = setTimeout(() => {
        playWarningDing();
        this.callbacks.onWarning?.();
      }, MAX_RECORDING_DURATION_MS - WARNING_BEFORE_END_MS);

      // Set up max duration auto-stop
      this.maxDurationTimeout = setTimeout(() => {
        this.stop();
      }, MAX_RECORDING_DURATION_MS);

      this.callbacks.onStart?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');

      // Provide helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.callbacks.onError?.(new Error('Microphone access denied. Please allow microphone access to use voice input.'));
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.callbacks.onError?.(new Error('No microphone found. Please connect a microphone.'));
      } else {
        this.callbacks.onError?.(err);
      }

      this.cleanup();
      throw err;
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  stop(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Cancel recording without processing
   */
  cancel(): void {
    this.cleanup();
  }

  /**
   * Get current recording state
   */
  getState(): RecorderState {
    return {
      isRecording: this.mediaRecorder?.state === 'recording',
      elapsedMs: this.mediaRecorder?.state === 'recording' ? Date.now() - this.startTime : 0,
      error: null,
    };
  }

  /**
   * Handle recording stop - process audio and call callback
   */
  private handleStop(): void {
    const durationMs = Date.now() - this.startTime;

    // Create blob from chunks
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });

    // Call callback with result
    this.callbacks.onStop?.({
      audioBlob,
      durationMs,
    });

    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Clear timers
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout);
      this.maxDurationTimeout = null;
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Clear recorder
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let recorderInstance: VoiceRecorder | null = null;

export function getRecorder(): VoiceRecorder {
  if (!recorderInstance) {
    recorderInstance = new VoiceRecorder();
  }
  return recorderInstance;
}

/**
 * Check if voice recording is supported in the current browser
 */
export function isVoiceRecordingSupported(): boolean {
  return VoiceRecorder.isSupported();
}
