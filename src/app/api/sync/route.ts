import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { HouseholdState } from '@/lib/types';

const KV_PREFIX = 'household:';

// GET - Fetch state from KV by household code
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Household code is required' },
      { status: 400 }
    );
  }

  try {
    const state = await kv.get<HouseholdState>(`${KV_PREFIX}${code}`);

    if (!state) {
      return NextResponse.json(
        { error: 'Household not found', exists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ state, exists: true });
  } catch (error) {
    console.error('KV fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch household data' },
      { status: 500 }
    );
  }
}

// POST - Save state to KV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body as { code: string; state: HouseholdState };

    if (!code) {
      return NextResponse.json(
        { error: 'Household code is required' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      );
    }

    // Add household code to state and update timestamp
    const stateToSave: HouseholdState = {
      ...state,
      householdCode: code,
      lastUpdated: Date.now(),
    };

    // Save to KV (no expiration - persistent storage)
    await kv.set(`${KV_PREFIX}${code}`, stateToSave);

    return NextResponse.json({ success: true, lastUpdated: stateToSave.lastUpdated });
  } catch (error) {
    console.error('KV save error:', error);
    return NextResponse.json(
      { error: 'Failed to save household data' },
      { status: 500 }
    );
  }
}

// DELETE - Remove household from KV (for cleanup/reset)
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Household code is required' },
      { status: 400 }
    );
  }

  try {
    await kv.del(`${KV_PREFIX}${code}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KV delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete household data' },
      { status: 500 }
    );
  }
}
