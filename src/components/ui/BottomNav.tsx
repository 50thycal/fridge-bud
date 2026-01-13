'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useInventory } from '@/hooks/useInventory';
import { VoiceMiniButton } from './VoiceButton';
import { VoiceConfirmation, RecordingOverlay } from './VoiceConfirmation';
import { getRecentItemNames } from '@/lib/storage';
import { ParsedVoiceInput } from '@/lib/types';

const leftNavItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/inventory', label: 'Inventory', icon: BoxIcon },
];

const rightNavItems = [
  { href: '/meals', label: 'Meals', icon: UtensilsIcon },
  { href: '/grocery', label: 'Grocery', icon: ShoppingCartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { items, add, remove } = useInventory();

  const {
    state,
    elapsedMs,
    error,
    parsedResult,
    startRecording,
    stopRecording,
    cancelRecording,
    confirmResult,
    clearResult,
    isSupported,
  } = useVoiceInput({
    recentItems: getRecentItemNames(),
    onResult: handleVoiceResult,
    onError: (err) => console.error('Voice error:', err),
  });

  function handleVoiceResult(result: ParsedVoiceInput) {
    if (!result.items || result.items.length === 0) return;

    switch (result.intent) {
      case 'add_items':
        result.items.forEach(item => {
          add({
            name: item.name,
            category: item.category,
            location: item.location,
            quantity: item.quantity,
            freshness: 'fresh',
            confidence: item.confidence >= 0.8 ? 'sure' : 'unsure',
          });
        });
        break;

      case 'remove_items':
        result.items.forEach(parsedItem => {
          // Find existing item by name (case-insensitive)
          const existingItem = items.find(
            inv => inv.name.toLowerCase() === parsedItem.name.toLowerCase()
          );
          if (existingItem) {
            remove(existingItem.id);
          }
        });
        break;

      // TODO: Handle create_pattern and edit_pattern
      default:
        console.log('Unhandled intent:', result.intent);
    }
  }

  function handleMicClick() {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle' || state === 'error') {
      startRecording();
    }
  }

  function handleEdit() {
    // TODO: Open an edit sheet with the parsed items
    // For now, just confirm
    confirmResult();
  }

  return (
    <>
      {/* Recording Overlay */}
      {state === 'recording' && (
        <RecordingOverlay
          elapsedMs={elapsedMs}
          onStop={stopRecording}
          onCancel={cancelRecording}
        />
      )}

      {/* Confirmation Overlay */}
      {state === 'confirming' && parsedResult && (
        <VoiceConfirmation
          result={parsedResult}
          onConfirm={confirmResult}
          onEdit={handleEdit}
          onCancel={clearResult}
        />
      )}

      {/* Error Toast */}
      {state === 'error' && error && (
        <div className="fixed inset-x-0 bottom-20 mx-4 z-50">
          <div className="bg-red-900 text-red-100 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <span>{error}</span>
            <button
              onClick={clearResult}
              className="text-red-300 hover:text-white ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          {/* Left nav items */}
          {leftNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Center mic button */}
          <div className="flex flex-col items-center justify-center px-2">
            {isSupported ? (
              <VoiceMiniButton
                state={state}
                onClick={handleMicClick}
                disabled={state === 'transcribing'}
              />
            ) : (
              <div className="w-12 h-12 -mt-4 rounded-full bg-zinc-700 flex items-center justify-center opacity-50">
                <MicOffIcon className="w-5 h-5 text-zinc-400" />
              </div>
            )}
            <span className="text-xs text-zinc-500 mt-1">Voice</span>
          </div>

          {/* Right nav items */}
          {rightNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// =============================================================================
// Icon Components
// =============================================================================

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function UtensilsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 19l-7-7m0 0l-7-7m7 7l7-7m-7 7l-7 7" />
    </svg>
  );
}
