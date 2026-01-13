// Whisper API Route - Speech-to-text transcription via OpenAI Whisper

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Configuration
// =============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-1';
const MAX_FILE_SIZE_MB = 25; // Whisper limit is 25MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// =============================================================================
// Types
// =============================================================================

interface TranscriptionResponse {
  text: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<TranscriptionResponse | ErrorResponse>> {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Voice transcription not configured', details: 'Missing API key' },
        { status: 503 }
      );
    }

    // Get form data with audio file
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Check file type (Whisper accepts various formats)
    const validTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/mpga',
      'audio/m4a',
      'audio/wav',
      'audio/ogg',
    ];

    const isValidType = validTypes.some(type => audioFile.type.startsWith(type.split('/')[0]));
    if (!isValidType && audioFile.type) {
      console.warn(`Unexpected audio type: ${audioFile.type}, attempting anyway`);
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'audio.webm');
    whisperFormData.append('model', WHISPER_MODEL);
    whisperFormData.append('language', 'en'); // Optimize for English
    whisperFormData.append('response_format', 'json');

    // Call Whisper API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 503 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again in a moment.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Transcription failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json() as { text: string };

    // Return transcription
    return NextResponse.json({
      text: result.text.trim(),
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

