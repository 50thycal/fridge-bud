# Our food catalog

**Canonical data:** [`catalog.json`](catalog.json) on `main` in `50thycal/fridge-bud`.

This is the shared food reference for Calvin and ChatGPT: complete recipes, flexible meal patterns, and ideas to try. A session with GitHub access can read it fresh, discuss it, then save requested additions through a validated PR. The app displays it at `/food`.

## Active list: Meals V2

`activeCollectionId: "meals-v2"` identifies the household list to use by default in conversation and on `/food`. Its eight `entryIds` are ordered: four Calvin-prepared meals, then four Zoe-prepared meals. When Calvin says "edit a meal", use this active list. The original 17-entry collection remains available as **Original Meals (reference)**; only Mediterranean Chicken Salad is included in both lists. No defaults were deleted.

Calvin supplied the V2 list on 2026-10-22. A named meal can be a known household meal without a full written recipe. `preparedBy` records Calvin or Zoe, and `meal.components` stores only what he supplied. Do not infer recipes, effort, timing, ratings, or a meal calendar from this list.

## What has been recovered

17 built-in meal patterns were copied without losing ingredient alternatives, tags, effort, meal types, or subcomponents from `src/data/meal-patterns.ts` at commit `bb0fbdaa27dd4bf647f7c4401869b3a3688ba58d`.

The most detailed is **Mediterranean Chicken Salad**, with **Lemon-Dijon Dressing** and **Herb Marinade**. These are ingredient templates, not full recipes: quantities and cooking steps were not saved in the repository. The original import alone did not establish whether Calvin personally saved or cooked any of them. On 2026-10-22 he explicitly confirmed Mediterranean Chicken Salad as his prepared meal and selected it for Meals V2; that confirmation is recorded in its notes.

**Device-specific custom meals are not yet recovered.** The existing app stores them under `fridgebud_meal_patterns` in localStorage, separately from cloud household sync. On the original device, open `/food` → **Export meals from this device**, then share that JSON in chat. It includes only meal templates. The Home backup export now includes these templates too, but also contains household data and should not be committed or used as the public import file.

## Entry format

Every entry has `id`, `kind`, `status`, `title`, `description`, `tags`, `source`, and `notes`.

- `kind`: `recipe`, `meal`, `pattern`, or `idea`.
- `status`: `saved`, `idea`, `cooked`, `favorite`, or `archived`. `saved` alone does not mean tried or liked.
- `source`: `type` (`app-default`, `app-export`, `user-chat`, or `url`), `reference` (a real path, source URL, or short user-provided context), and `notes` describing evidence and missing details.
- `recipe`: required for recipes; contains nonempty `ingredients` and `steps` string arrays and optional `servings` text. Keep quantities in ingredient text.
- `pattern`: required for patterns; preserves the existing app `MealPattern` structure. Its ID and name must match the entry ID and title.
- `meal`: required for known household meals that do not yet have a complete recipe; contains `components`, a nonempty string array of user-supplied details. These meals also require `preparedBy` (`Calvin` or `Zoe`). Existing patterns/recipes may have `preparedBy` too.
- `collections`: named ordered lists referencing stable entry IDs. `activeCollectionId` selects the default list. Entries may belong to more than one list without duplication.
- Ideas use `description` and `notes` until there is enough information for a full recipe. Do not invent ingredients or steps to satisfy validation.

Keep stable kebab-case IDs. Modify an existing entry instead of duplicating it. Preserve sources and important prior notes when improving a recipe. Archive old entries rather than deleting them.

## PR flow

1. Read the latest `main` and make a branch.
2. Edit `data/food/catalog.json` only for ordinary food updates.
3. Run `npm run validate:food` and `npm run test:food`, inspect the diff, and open a PR.
4. Same-repository PRs authored by `50thycal` that modify only this JSON file are automatically validated and squash-merged by `.github/workflows/food-catalog.yml`. Other authors and code changes are left for normal handling. Required GitHub branch rules are not bypassed. If Actions permissions prevent merging, the active session can merge the exact checked head under Calvin's standing food-update authorization and report the limitation.
5. Verify main contains the saved entry before reporting success. App publication depends on the existing deployment pipeline; GitHub is immediately authoritative after merge.

Local edits in the old Meals editor remain drafts. They do not automatically create GitHub PRs. The meals-only export bridges those drafts into a chat-assisted catalog update without putting a GitHub write token into the public app.
