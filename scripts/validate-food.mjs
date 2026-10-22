import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const categories = ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'condiment', 'spice', 'beverage', 'frozen', 'other'];
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const oneOf = (value, values) => values.includes(value);
const keys = (value, allowed) => assert(Object.keys(value).every(key => allowed.includes(key)), 'Unknown field (possible typo)');

export function validatePattern(pattern) {
  assert(object(pattern), 'Pattern must be an object');
  keys(pattern, ['id','name','description','requiredSlots','flexibleSlots','optionalUpgrades','components','effort','mealTypes','tags']);
  assert(text(pattern.id) && text(pattern.name), 'Pattern ID and name required');
  assert(pattern.description === undefined || typeof pattern.description === 'string');
  assert(oneOf(pattern.effort, ['minimal', 'moderate', 'involved']), 'Invalid effort');
  assert(strings(pattern.tags), 'Invalid pattern tags');
  assert(strings(pattern.mealTypes) && pattern.mealTypes.length > 0 && pattern.mealTypes.every(type => oneOf(type, ['breakfast','lunch','dinner','snack'])), 'Invalid meal types');
  const slots = value => {
    assert(Array.isArray(value), 'Slots must be arrays');
    for (const slot of value) {
      assert(object(slot), 'Invalid slot');
      keys(slot, ['role','specificItems','acceptedCategories','optional']);
      assert(text(slot.role) && typeof slot.optional === 'boolean', 'Invalid slot role/optional');
      assert(slot.specificItems === undefined || (strings(slot.specificItems) && slot.specificItems.length > 0), 'Invalid specific items');
      assert(slot.acceptedCategories === undefined || (strings(slot.acceptedCategories) && slot.acceptedCategories.length > 0 && slot.acceptedCategories.every(cat => categories.includes(cat))), 'Invalid categories');
      assert(slot.specificItems?.length || slot.acceptedCategories?.length, 'Slot needs accepted items or categories');
    }
  };
  slots(pattern.requiredSlots); slots(pattern.flexibleSlots); slots(pattern.optionalUpgrades);
  if (pattern.components !== undefined) {
    assert(Array.isArray(pattern.components), 'Invalid components');
    for (const component of pattern.components) {
      assert(object(component) && text(component.name), 'Invalid component');
      keys(component, ['name','slots']); slots(component.slots);
    }
  }
}

export function validateCatalog(catalog) {
  assert(object(catalog), 'Catalog must be an object');
  keys(catalog, ['schemaVersion','entries','activeCollectionId','collections']);
  assert(catalog.schemaVersion === 1 && Array.isArray(catalog.entries), 'Unsupported catalog version');
  const ids = new Set();
  for (const entry of catalog.entries) {
    assert(object(entry), 'Invalid entry');
    keys(entry, ['id','kind','status','title','description','tags','source','notes','recipe','pattern','preparedBy','meal']);
    assert(text(entry.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id), 'Use a stable kebab-case ID');
    assert(!ids.has(entry.id), `Duplicate ID: ${entry.id}`); ids.add(entry.id);
    assert(text(entry.title) && typeof entry.description === 'string', 'Missing title/description');
    assert(oneOf(entry.kind, ['pattern','recipe','idea','meal']), 'Invalid entry kind');
    assert(entry.preparedBy === undefined || oneOf(entry.preparedBy, ['Calvin','Zoe']), 'Invalid meal preparer');
    assert(entry.kind === 'meal' || entry.meal === undefined, 'Meal components belong to meal entries');
    assert(oneOf(entry.status, ['saved','idea','cooked','favorite','archived']), 'Invalid status');
    assert(strings(entry.tags) && strings(entry.notes), 'Tags and notes must be string arrays');
    assert(object(entry.source), 'Missing source');
    keys(entry.source, ['type','reference','notes']);
    assert(oneOf(entry.source.type, ['app-default','app-export','user-chat','url']) && text(entry.source.reference) && typeof entry.source.notes === 'string', 'Invalid source');
    if (entry.source.type === 'url') assert(/^https?:\/\//.test(entry.source.reference), 'Source URL must use http(s)');
    if (entry.kind === 'pattern') {
      validatePattern(entry.pattern);
      assert(entry.pattern.id === entry.id && entry.pattern.name === entry.title, 'Pattern ID/name must match entry');
      assert(entry.recipe === undefined, 'Pattern cannot also contain recipe data');
    } else if (entry.kind === 'recipe') {
      assert(entry.pattern === undefined && object(entry.recipe), 'Recipe must contain recipe data only');
      keys(entry.recipe, ['servings','ingredients','steps']);
      assert(entry.recipe.servings === undefined || text(entry.recipe.servings), 'Invalid servings');
      assert(strings(entry.recipe.ingredients) && entry.recipe.ingredients.length > 0, 'Recipe needs ingredients');
      assert(strings(entry.recipe.steps) && entry.recipe.steps.length > 0, 'Recipe needs instructions; otherwise save it as an idea');
    } else if (entry.kind === 'meal') {
      assert(entry.pattern === undefined && entry.recipe === undefined && object(entry.meal), 'Household meals contain meal data only');
      keys(entry.meal, ['components']);
      assert(text(entry.preparedBy) && strings(entry.meal.components) && entry.meal.components.length > 0, 'Household meal needs a preparer and known components');
    } else {
      assert(entry.pattern === undefined && entry.recipe === undefined, 'Ideas use description/notes until a recipe is known');
    }
  }
  if (catalog.collections !== undefined || catalog.activeCollectionId !== undefined) {
    assert(Array.isArray(catalog.collections) && text(catalog.activeCollectionId), 'Collections need an active collection');
    const collectionIds = new Set();
    for (const collection of catalog.collections) {
      assert(object(collection), 'Invalid collection');
      keys(collection, ['id','title','entryIds']);
      assert(text(collection.id) && text(collection.title) && strings(collection.entryIds), 'Invalid collection fields');
      assert(!collectionIds.has(collection.id), 'Duplicate collection ID');
      collectionIds.add(collection.id);
      assert(new Set(collection.entryIds).size === collection.entryIds.length, 'Duplicate meal in collection');
      assert(collection.entryIds.every(id => ids.has(id)), 'Collection references a missing meal');
    }
    assert(collectionIds.has(catalog.activeCollectionId), 'Active collection does not exist');
  }
  return catalog;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const catalog = validateCatalog(JSON.parse(fs.readFileSync(process.argv[2] || 'data/food/catalog.json', 'utf8')));
  console.log(`Validated ${catalog.entries.length} food entries.`);
}
