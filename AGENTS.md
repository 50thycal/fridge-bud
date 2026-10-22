# FridgeBud: shared food source

Calvin wants this repository to be the shared source for food conversations across sessions.

## Read before discussing saved food

- Fetch the latest default branch of `50thycal/fridge-bud`, then read `data/food/catalog.json` and `data/food/README.md`. Cite the catalog link when useful.
- **Meals V2 is the active household list.** Resolve `activeCollectionId` and that collection's `entryIds` in the catalog when Calvin asks about "my meals", "our meals", or to edit a meal. Do not include the original defaults unless he asks for them. Preserve other collections as reference. Record the named preparer; do not assume both people cook every meal.
- Read current files instead of relying on chat memory. A previous conversation or unmerged PR is not the committed source of truth.
- Catalog entries distinguish complete recipes, known household meals, flexible meal patterns, and food ideas. Built-in app templates are not evidence that Calvin saved, cooked, or liked them.
- Ingredient drafts have per-item `certainty` (`confirmed` or `draft`) and `ingredientReview.status`. Calvin requested a later audit: surface the pending review and never treat draft suggestions as his approved recipe or silently use them to order groceries. Review optional ingredients, sauce bases, quantities, and ambiguous speech before approval. Use root `mealTypes` for household categories.
- Audit meals in small chunks: Calvin prefers one or two meals per exchange. Save supplied amounts faithfully, preserve approximate wording, and leave unspecified quantities/product identities unresolved.
- Keep unknown quantities, instructions, sources, ratings, and preferences unknown. Do not turn an idea into a tested recipe by inference.

## Requested food updates

- When Calvin asks to save or change food information, update the canonical catalog on a branch, validate it, create a PR, and merge the exact validated head after applicable checks. Calvin authorized this food-content PR-and-merge flow; a separate routine confirmation is unnecessary.
- Preserve stable IDs, provenance, existing notes, recipe components, and history. Prefer archiving to deleting. Mark user-reported cooking results explicitly in notes.
- The workflow automatically validates and squash-merges same-repository PRs authored by `50thycal` that modify only `data/food/catalog.json`. It executes base-branch code only, validates the exact proposed SHA, and refuses missing existing IDs. GitHub branch rules still apply.
- If a connector-created PR has a different author, the workflow leaves it for the session to validate and merge within this authorization. Do not broaden the workflow's author scope silently.
- App code, workflows, credentials, repository settings, and infrastructure are outside food-content auto-merge. Follow the explicit request for those changes.
- This repository is public. Save food content only; keep household access codes, credentials, raw household backups, inventory, and unrelated personal details out of commits.

## Approved household workflow direction

- Read `docs/household-food-workflow.md` for Calvin's approved direction: shared private inventory, separate authenticated access for Calvin and Zoe, photo-assisted observations, and automatic deductions when audited meals are logged as cooked.
- These are requirements, not implemented features. Do not claim either ChatGPT account is connected or inventory was updated without a successful backend write. Ingredient review remains the current prerequisite.

## App and recovery

- `/food` renders the committed catalog; app deployments update after merges. Chat should always read main directly, because a deployed app may lag.
- `src/data/meal-patterns.ts` derives built-in defaults from the catalog. Existing locally edited meal patterns remain device drafts and must not be overwritten.
- User-created meal patterns currently live in browser localStorage, not household KV. They cannot be recovered through GitHub or cloud inventory sync. Ask for the **meals-only export** from `/food` on the original device if needed.
- Review meals-only exports before importing. Deduplicate by stable ID and matching content; preserve distinct customized variants. Record `app-export` provenance and do not commit the original raw file.

## Checks

- Food content: `npm run validate:food` and `npm run test:food`.
- App changes: also run TypeScript and the production build. Report any pre-existing lint failures separately.
- Do not claim a PR merged or app deployed until that state is verified.
