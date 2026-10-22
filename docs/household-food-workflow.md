# Household food workflow

Status: Calvin approved this direction on 2026-10-22. This document records requirements and acceptance criteria; shared ChatGPT write access, photo processing, automatic deductions, and weekly planning are not implemented yet. Ingredient audit is the current step.

## One household across the app and both ChatGPT accounts

- Keep recipes and Meals V2 in the GitHub food catalog. Keep live inventory, raw photos, meal activity, credentials, and account membership in a private shared backend, outside this public repository.
- Give Calvin and Zoe individual authenticated identities linked to the same household. Both can read and update the household from the app and from their own supported, connected ChatGPT sessions. Do not rely on shared chat memory or require Zoe to use Calvin's ChatGPT account.
- Implement an authenticated integration (for example, an OAuth-protected MCP app) with household-scoped read/write tools. Check the actual connection and distribution capabilities of both accounts before claiming access works in every session. Each person must connect/sign in independently; no account is connected by this document.
- Enforce membership server-side. Record who made each update, support revocation, and keep credentials out of chat and public source. The existing short household code and last-write-wins whole-state sync are not the final authorization or concurrency design.

## Automatic consumption when a meal is cooked

- Deduct ingredients only when a meal is logged as prepared, not when it is planned or viewed. Use the audited recipe version, batch size/servings, and selected variants.
- Example requirement: if inventory contains 4 lemons and the actual prepared batch uses 1 lemon, record an estimated consumption of 1 and show an estimated balance of 3. This is an example, not a confirmed household count or recipe amount.
- Distinguish observed counts from estimated balances. A direct statement such as "we have 5 lemons now" is an observation; cooking-based deductions are estimates until checked.
- Record ingredient units and recipe yields before estimating consumption. Lemon juice must not silently become one whole lemon; bottled juice, whole fruit, and partial fruit need explicit conversion rules.
- Do not deduct optional bacon or other optional additions unless that variant was used. Do not consume both a purchased sauce and the ingredients of a homemade alternative.
- Use an inventory event ledger with atomic updates, operation IDs, duplicate detection, actor, source, recipe version, confidence, and undo/corrections. Two accounts reporting the same cooked meal must not deduct twice. A correction must not reapply an entire meal.
- If quantity is unknown, mark it as needing a check instead of inventing an exact remaining count or creating negative stock.

## Chat and fridge-photo updates

- Support explicit chat changes such as adding purchases, setting an observed count, recording consumption, and correcting estimates. Successful writes return a concise before/after receipt and appear in the app for both household members.
- A fridge image is a partial observation, not a complete household reset. Detect visible food, readable labels, location, visible counts, and uncertainty. Do not erase items outside the frame, hidden behind containers, or stored in the pantry/freezer.
- Clear quantities from explicit statements or readable evidence can be applied within the user's requested update. Estimated photo matches and uncertain counts should be grouped into one short review, with high-confidence identity kept separate from uncertain amount.
- Keep photos private with an intentional retention policy. The photo flow must write through the same household backend and event ledger as manual/app changes.

## Weekly plan and grocery list

- After recipe audit and inventory integration, allow a weekly meal shortlist with servings and optional day assignments.
- Aggregate shared ingredients across every selected meal before subtracting stock. The same chicken cannot satisfy two meals independently. Consider usable stock, leftovers, variants, quantities, and uncertain items separately.
- Produce a deduplicated grocery list with missing amounts and meal reasons. Unreviewed ingredient drafts are not approved purchase requirements.
- Begin DoorDash handoff with a portable list and reviewable cart. Assess direct integration separately; no order is placed by planning, inventory updates, photo uploads, or this document.

## Rollout and evidence

1. Finish Calvin's ingredient audit, including servings, quantities, optional variants, sauce bases, and the unclear arugula-to-Caprese association.
2. Build private household membership and inventory events, then authenticated app/chat writes for both people. Prove one account's update appears in the other account and app, with an unauthorized third account denied.
3. Add observed-versus-estimated counts, cooked-meal deductions, duplicate protection, and undo. Verify concurrent updates and optional-ingredient handling.
4. Add photo-assisted updates without deleting unseen inventory, then weekly planning and grocery export.

Official integration reference (reviewed 2026-10-22): https://developers.openai.com/plugins/build/auth
