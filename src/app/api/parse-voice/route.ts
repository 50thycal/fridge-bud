// Parse Voice API Route - LLM-based voice transcription parsing via OpenAI GPT

import { NextRequest, NextResponse } from 'next/server';
import {
  LLM_SYSTEM_PROMPT,
  buildUserPrompt,
  parseLLMResponse,
  getFallbackParseResult,
} from '@/lib/voice/llm-parser';
import { InventoryItem, LLMParseResult } from '@/lib/types';

// =============================================================================
// Configuration
// =============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o'; // Using gpt-4o as requested
const REQUEST_TIMEOUT_MS = 15000; // 15 second timeout

// =============================================================================
// Types
// =============================================================================

interface ParseVoiceRequest {
  transcription: string;
  currentInventory: InventoryItem[];
  recentItems?: string[];
}

interface ErrorResponse {
  error: string;
  details?: string;
  fallbackUsed?: boolean;
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<LLMParseResult | ErrorResponse>> {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Voice parsing not configured', details: 'Missing API key' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json() as ParseVoiceRequest;
    const { transcription, currentInventory = [], recentItems = [] } = body;

    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    // Build the prompt
    const userPrompt = buildUserPrompt(transcription, currentInventory);

    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: LLM_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1, // Low temperature for consistent structured output
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);

        // Fall back to keyword parser on API errors
        console.log('Falling back to keyword parser due to API error');
        const fallbackResult = getFallbackParseResult(transcription, currentInventory, recentItems);
        fallbackResult.warnings.push('Used fallback parser due to API error');
        return NextResponse.json(fallbackResult);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        console.error('Empty response from OpenAI');
        const fallbackResult = getFallbackParseResult(transcription, currentInventory, recentItems);
        fallbackResult.warnings.push('Used fallback parser - empty API response');
        return NextResponse.json(fallbackResult);
      }

      // Parse and validate the LLM response
      const parsedResult = parseLLMResponse(content, transcription);

      if (!parsedResult) {
        console.error('Failed to parse LLM response:', content);
        const fallbackResult = getFallbackParseResult(transcription, currentInventory, recentItems);
        fallbackResult.warnings.push('Used fallback parser - invalid API response format');
        return NextResponse.json(fallbackResult);
      }

      // Check for low confidence and potentially supplement with keyword parser
      if (parsedResult.confidence < 0.3 && parsedResult.items.length === 0) {
        console.log('Low confidence LLM result, supplementing with keyword parser');
        const fallbackResult = getFallbackParseResult(transcription, currentInventory, recentItems);

        // If fallback found items, use it
        if (fallbackResult.items.length > 0) {
          fallbackResult.warnings.push('Supplemented with fallback parser due to low confidence');
          return NextResponse.json(fallbackResult);
        }
      }

      return NextResponse.json(parsedResult);

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('OpenAI API request timed out');
        const fallbackResult = getFallbackParseResult(transcription, currentInventory, recentItems);
        fallbackResult.warnings.push('Used fallback parser - API request timed out');
        return NextResponse.json(fallbackResult);
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('Parse voice error:', error);

    // Try to return a fallback result if possible
    try {
      const body = await request.clone().json() as ParseVoiceRequest;
      if (body.transcription) {
        const fallbackResult = getFallbackParseResult(
          body.transcription,
          body.currentInventory || [],
          body.recentItems || []
        );
        fallbackResult.warnings.push('Used fallback parser due to unexpected error');
        return NextResponse.json(fallbackResult);
      }
    } catch {
      // If we can't even get the transcription, return an error
    }

    return NextResponse.json(
      {
        error: 'Failed to parse voice input',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
