'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FoodCatalog } from '@/lib/food-catalog';
import type { IngredientSlot } from '@/lib/types';
import { exportMealPatterns } from '@/lib/storage';

const catalogUrl = 'https://github.com/50thycal/fridge-bud/blob/main/data/food/catalog.json';

function SlotGroup({ title, slots }: { title: string; slots: IngredientSlot[] }) {
  return <div><h3 className="font-semibold">{title}</h3><p className="text-zinc-300">{slots.map(slot => `${slot.role}: ${(slot.specificItems ?? slot.acceptedCategories ?? []).join(' / ')}`).join('; ') || 'None recorded'}</p></div>;
}

export function FoodLibrary({ catalog }: { catalog: FoodCatalog }) {
  const { entries } = catalog;
  const [collectionId, setCollectionId] = useState(catalog.activeCollectionId ?? 'all');
  const collection = catalog.collections?.find(item => item.id === collectionId);
  const listEntries = collection ? collection.entryIds.flatMap(id => entries.find(entry => entry.id === id) ?? []) : entries;
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [message, setMessage] = useState('');
  const visible = listEntries.filter(entry =>
    (kind === 'all' || entry.kind === kind) &&
    JSON.stringify([entry.title, entry.description, entry.tags, entry.notes, entry.preparedBy, entry.meal, entry.recipe, entry.pattern]).toLowerCase().includes(query.toLowerCase())
  );

  function exportLocalMeals() {
    try {
      const data = exportMealPatterns();
      const count = JSON.parse(data).mealPatterns.length;
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'fridgebud-meals-for-catalog.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Exported ${count} meals from this device. Share this file in chat to add your custom meals to the catalog.`);
    } catch {
      setMessage('Could not export meals. Your saved meals have not been changed.');
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12 space-y-6">
      <Link href="/meals" className="inline-flex min-h-11 items-center text-green-400">← Back to meals</Link>
      <header>
        <p className="text-green-400 text-sm">FridgeBud</p>
        <h1 className="text-3xl font-bold">{collection?.title ?? 'Our food catalog'}</h1>
        <p className="mt-2 text-zinc-400">Recipes, meal patterns, and ideas we can build on together.</p>
        <a href={catalogUrl} className="inline-flex min-h-11 items-center text-green-400 underline">View the shared source on GitHub</a>
      </header>

      <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 space-y-3" aria-label="Recover saved meals">
        <h2 className="text-xl font-semibold">Bring in your saved meals</h2>
        <p className="text-zinc-400">Open this page on the device where you saved your meals. Export them and share the file in chat so we can add them here. This export contains meal templates only.</p>
        <button onClick={exportLocalMeals} className="min-h-11 rounded-xl bg-green-700 px-4 py-3 font-medium">Export meals from this device</button>
        <p className="text-sm text-zinc-400">Changes made in the Meals editor stay on that device until added to the shared catalog through a PR.</p>
        {message && <p role="status" className="text-green-300">{message}</p>}
      </section>

      <div className="space-y-3">
        {catalog.collections && <>
          <label htmlFor="meal-list" className="block font-medium">Meal list</label>
          <select id="meal-list" value={collectionId} onChange={event => setCollectionId(event.target.value)} className="min-h-11 w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3">
            {catalog.collections.map(list => <option key={list.id} value={list.id}>{list.title}</option>)}
            <option value="all">All saved food</option>
          </select>
        </>}
        <label htmlFor="food-search" className="block font-medium">Find food</label>
        <input id="food-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search names, ingredients, or tags" className="min-h-11 w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3" />
        <label htmlFor="food-kind" className="block font-medium">Show</label>
        <select id="food-kind" value={kind} onChange={event => setKind(event.target.value)} className="min-h-11 w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3">
          <option value="all">Everything</option>
          <option value="meal">Household meals</option>
          <option value="recipe">Recipes</option>
          <option value="idea">Ideas</option>
          <option value="pattern">Meal patterns</option>
        </select>
        <p role="status" className="text-zinc-400">{visible.length} of {listEntries.length} entries</p>
      </div>

      {visible.length === 0 && <p className="rounded-xl bg-zinc-900 p-4">No entries yet for this selection. Tell me what you want to add in chat.</p>}
      {visible.map(entry => (
        <article key={entry.id} id={entry.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
          <p className="text-sm capitalize text-green-400">{entry.kind} · {entry.status}</p>
          <h2 className="text-2xl font-semibold">{entry.title}</h2>
          {entry.preparedBy && <p className="text-green-300">Prepared by {entry.preparedBy}</p>}
          <p className="text-zinc-300">{entry.description}</p>
          {entry.meal && <p className="text-sm text-zinc-400">Known household meal. Full recipe details have not yet been recorded.</p>}
          <p className="text-sm text-zinc-400">{entry.tags.join(' · ')}</p>
          {entry.recipe && <>
            {entry.recipe.servings && <p>Servings: {entry.recipe.servings}</p>}
            <h3 className="font-semibold">Ingredients</h3>
            <ul className="list-disc pl-6 space-y-1">{entry.recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul>
            <h3 className="font-semibold">Method</h3>
            <ol className="list-decimal pl-6 space-y-2">{entry.recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
          </>}
          {entry.pattern && <>
            <h3 className="font-semibold">Required ingredients</h3>
            <ul className="list-disc pl-6 space-y-1">{entry.pattern.requiredSlots.map(slot => <li key={slot.role}>{slot.role}: {(slot.specificItems ?? slot.acceptedCategories ?? []).join(' / ')}</li>)}</ul>
            <SlotGroup title="Flexible ingredients" slots={entry.pattern.flexibleSlots} />
            <SlotGroup title="Optional upgrades" slots={entry.pattern.optionalUpgrades} />
            {entry.pattern.components?.map(component => <div key={component.name}><h3 className="font-semibold">{component.name}</h3><ul className="list-disc pl-6">{component.slots.map(slot => <li key={slot.role}>{(slot.specificItems ?? slot.acceptedCategories ?? []).join(' / ')}{slot.optional ? ' (optional)' : ''}</li>)}</ul></div>)}
            <p className="text-sm text-zinc-400">Meal template; quantities and cooking instructions have not been recorded.</p>
          </>}
          {entry.notes.map((note, index) => <p key={index} className="text-zinc-300">{note}</p>)}
          <details className="text-sm text-zinc-400 break-words"><summary className="min-h-11 cursor-pointer py-3">Source</summary><p>{entry.source.type}: {entry.source.reference}</p><p>{entry.source.notes}</p></details>
        </article>
      ))}
    </main>
  );
}
