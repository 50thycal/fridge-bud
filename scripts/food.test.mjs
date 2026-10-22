import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { validateCatalog } from './validate-food.mjs';
import { runFoodPr } from './food-pr.mjs';

const catalog = JSON.parse(fs.readFileSync('data/food/catalog.json', 'utf8'));
const clone = value => structuredClone(value);

test('catalog validates recipes, ideas, and pattern components without claiming cooking history', () => {
  validateCatalog(catalog);
  const entry = catalog.entries.find(entry => entry.id === 'mediterranean-chicken-salad');
  assert.equal(entry.source.type, 'app-default');
  assert.equal(entry.status, 'saved');
  assert.deepEqual(entry.pattern.components.map(component => component.name), ['Lemon-Dijon Dressing', 'Herb Marinade']);
  validateCatalog({schemaVersion:1,entries:[
    {id:'test-idea',kind:'idea',status:'idea',title:'Food idea',description:'Discuss later',tags:[],notes:[],source:{type:'user-chat',reference:'Test conversation',notes:''}},
    {id:'test-recipe',kind:'recipe',status:'saved',title:'Recipe',description:'',tags:[],notes:[],source:{type:'user-chat',reference:'Test conversation',notes:''},recipe:{ingredients:['1 cup oats'],steps:['Combine ingredients.']}},
  ]});
});

test('reject duplicate IDs, incomplete recipes, invalid slots, and field typos', () => {
  const duplicate = clone(catalog); duplicate.entries.push(duplicate.entries[0]);
  assert.throws(() => validateCatalog(duplicate), /Duplicate ID/);
  const recipe = clone(catalog); recipe.entries[0].kind = 'recipe'; delete recipe.entries[0].pattern;
  assert.throws(() => validateCatalog(recipe));
  const slots = clone(catalog); slots.entries[0].pattern.requiredSlots[0].acceptedCategories = ['invalid'];
  assert.throws(() => validateCatalog(slots));
  const typo = clone(catalog); typo.entries[0].recpie = {};
  assert.throws(() => validateCatalog(typo));
});

function storageHarness() {
  const values = new Map();
  const localStorage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key) };
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync('src/lib/storage.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(js, {exports, window:{}, localStorage, setTimeout: () => 0, fetch: async () => ({ok:true}), console});
  return {storage:exports, localStorage};
}

test('backup round-trip restores custom meals, older backups preserve them, meals-only export omits household data', () => {
  const {storage, localStorage} = storageHarness();
  const custom = {...clone(catalog.entries[0].pattern),id:'my-custom-meal',name:'My modified eggs'};
  storage.saveMealPatterns([custom]); storage.markPatternsInitialized();
  storage.setHouseholdCode('SECRET');
  const state = {inventory:[{name:'Private inventory'}],groceryList:[],mealLog:[],householdCode:'SECRET',lastUpdated:1};
  localStorage.setItem('fridgebud_state',JSON.stringify(state));
  const meals = JSON.parse(storage.exportMealPatterns());
  assert.deepEqual(Object.keys(meals).sort(),['mealPatterns','schemaVersion']);
  assert.equal(meals.mealPatterns[0].name, 'My modified eggs');
  assert(!storage.exportMealPatterns().includes('SECRET'));
  assert(!storage.exportMealPatterns().includes('Private inventory'));
  const backup = storage.exportData(); storage.saveMealPatterns([]);
  assert.equal(storage.importData(backup),true);
  assert.equal(storage.getMealPatterns()[0].id,'my-custom-meal');
  assert.equal(storage.importData(JSON.stringify(state)),true);
  assert.equal(storage.getMealPatterns()[0].id,'my-custom-meal');
  assert.equal(storage.importData(JSON.stringify({...state,mealPatterns:[null]})),false);
  assert.equal(storage.getMealPatterns()[0].id,'my-custom-meal');
});

const repo = '50thycal/fridge-bud';
function prEvent() {
  return {pull_request:{number:99,draft:false,changed_files:1,state:'open',user:{login:'50thycal'},base:{ref:'main'},head:{repo:{full_name:repo},sha:'checked-head'}}};
}
function mockApi(event, candidate = catalog, files = [{filename:'data/food/catalog.json',status:'modified'}]) {
  const calls = [];
  const api = async (path, options) => {
    calls.push({path,options});
    if (path.includes('/files?')) return files;
    if (path.includes('/contents/')) return {encoding:'base64',content:Buffer.from(JSON.stringify(candidate)).toString('base64')};
    if (path.endsWith('/merge')) return {merged:true,sha:'merge-sha'};
    return event.pull_request;
  };
  return {api,calls};
}

test('catalog auto-merge validates data and binds merge to exact head SHA', async () => {
  const event = prEvent(); const {api,calls} = mockApi(event);
  assert.deepEqual(await runFoodPr({event,repo,api,previous:catalog}),{merged:true,sha:'merge-sha'});
  assert.equal(JSON.parse(calls.at(-1).options.body).sha,'checked-head');
  assert(calls.some(call => call.path.endsWith('?ref=checked-head')));
});

test('auto-merge refuses other authors, forks, drafts, code changes, deletion, corrupt data, and moved heads', async () => {
  for (const mutate of [event=>event.pull_request.user.login='someone-else',event=>event.pull_request.head.repo.full_name='fork/repo',event=>event.pull_request.draft=true,event=>event.pull_request.base.ref='other']) {
    const event=prEvent(); mutate(event); const {api,calls}=mockApi(event);
    assert.equal((await runFoodPr({event,repo,api,previous:catalog})).merged,false);
    assert.equal(calls.length,0);
  }
  for (const files of [[{filename:'src/app/page.tsx',status:'modified'}],[{filename:'data/food/catalog.json',status:'removed'}]]) {
    const event=prEvent(); const {api,calls}=mockApi(event,catalog,files);
    assert.equal((await runFoodPr({event,repo,api,previous:catalog})).merged,false);
    assert(!calls.some(call=>call.path.endsWith('/merge')));
  }
  for (const candidate of [{schemaVersion:2,entries:[]},{schemaVersion:1,entries:[]}]) {
    const event=prEvent(); const {api,calls}=mockApi(event,candidate);
    await assert.rejects(runFoodPr({event,repo,api,previous:catalog}));
    assert(!calls.some(call=>call.path.endsWith('/merge')));
  }
  const event=prEvent(); const mocked=mockApi(event);
  const api=async (path,options) => path === '/pulls/99' ? {...event.pull_request,head:{sha:'moved-head'}} : mocked.api(path,options);
  await assert.rejects(runFoodPr({event,repo,api,previous:catalog}),/changed during validation/);
  assert(!mocked.calls.some(call=>call.path.endsWith('/merge')));
});
