# FridgeBud - Project North Star

> A domestic decision-offloading system that lives on your fridge

## What This Is

FridgeBud is **not** a food tracking app. It's a household terminal that reduces cognitive overhead around meals. It answers the question: "What should we eat?" by understanding what you have, what you want, and what needs attention.

The fridge is the right locus because:
- It's where decisions happen
- It's where friction shows up
- It's already part of daily habit loops

**Core philosophy: Reduce thinking, not increase tracking.**

## What This Is NOT

- Not a calorie tracker
- Not a macro optimizer
- Not a recipe marketplace
- Not a smart fridge replacement
- Not a personal device (it's a shared household terminal)

## The Three Layers

### 1. Inventory Reality Layer
"What physically exists right now?"

- Fridge, pantry, freezer contents
- **Rough quantities** (low / some / plenty) - not precise counts
- **Confidence-based freshness** (Fresh → Good → Use soon → Bad)

Key insight: Doesn't need to be perfect to be useful. "We probably have chicken" is enough.

### 2. Meal Possibility Layer
"What can we make without thinking?"

This is a **constraint solver**, not a recipe database.

Meals are **patterns**, not instructions:
- "Mediterranean chicken bowl"
- "Stir fry"
- "Eggs + greens"

Each pattern has:
- **Required slots** (must have one of these)
- **Flexible slots** (nice to have, substitutable)
- **Optional upgrades** (makes it better)

The system answers:
- What's frictionless now?
- What's one ingredient away?
- What uses aging items?

### 3. Regiment & Rhythm Layer
"How do we want the week to feel?"

**Weekly constraints, not schedules:**
- "3 chicken meals this week"
- "At least 2 fish meals"
- "Don't repeat same dinner twice in a row"
- "Use leafy greens before they die"

This lets the app **suggest**, not dictate.

## Core Data Models

### InventoryItem
```
- id: unique identifier
- name: "Chicken breast"
- category: protein | vegetable | fruit | dairy | grain | condiment | spice | frozen | beverage | other
- location: fridge | freezer | pantry
- quantity: low | some | plenty
- freshnessState: fresh | good | useSoon | bad
- addedAt: timestamp
```

### MealPattern
```
- id: unique identifier
- name: "Stir Fry"
- requiredSlots: [{role: "protein", accepts: [chicken, beef, tofu, shrimp]}]
- flexibleSlots: [{role: "grain", accepts: [rice, noodles]}]
- optionalUpgrades: [{role: "heat", accepts: [chili, sriracha]}]
- effortLevel: minimal | moderate | involved
- tags: [quick, comfort, healthy, etc.]
```

### WeeklyConstraint
```
- id: unique identifier
- type: minimum(3) | maximum(2) | noRepeat(2) | mustInclude
- target: category | pattern | tag | specificIngredient
- appliesTo: [dinner] | [all meals]
- isActive: boolean
```

### GroceryItem (Derived - not stored)
```
- name: "Salmon"
- priority: urgent | replenish | opportunity | manual
- reasoning: "Would enable 2 more fish meals this week"
- enablesMeals: [pattern references]
```

## The Opportunity Scoring System

When calculating "what meal makes sense now":

```
Score =
  (0.6 × RequiredSlots) +       // Do we have the required ingredients?
  (0.2 × FlexibleSlots) +       // Do we have the nice-to-haves?
  (0.2 × AgingBonus)            // Does this use items that need attention?
```

This produces a ranked list of meal opportunities with explainable reasoning. Meals are also categorized by friction level: "ready" (all required slots filled), "oneAway" (missing one ingredient), or "needsShopping" (missing multiple).

## UX Principles (Fridge-Mounted iPad)

### Physical Context Matters
- Always-on display (guided access / kiosk mode)
- Glanceable from 3 feet away
- Touch-friendly for hands that might be wet/dirty
- Works in kitchen lighting conditions

### Interaction Design
- **Three-tap maximum** for any action
- Big tiles (44pt+ touch targets minimum)
- Primary text 24pt+
- Swipe/tap gestures, not forms

### Quick Actions (Always Visible)
- "I used [item]" - decrement/remove from inventory
- "Add to list" - manual grocery addition
- "What can I make?" - surface opportunities

### Idle State Shows
- Items that need attention ("use soon")
- Tonight's top 2-3 meal suggestions
- Weekly constraint progress
- Nothing that requires action

## Grocery Lists Are Output, Not Input

The grocery list is **derived**, not manually curated:
- Missing ingredients for preferred meals
- Staples below threshold
- Items that would unlock more meal variety

User reviews suggestions before shopping. Can accept all, dismiss, or add custom items.

## Shared Household State

This is a **shared terminal**, not a personal app:
- No logins required
- One shared truth for the household
- The iPad on the fridge IS the source of truth
- Future: companion phone apps are read-only or send "requests"

## Tech Stack (Decided)

**Web App (PWA) deployed on Vercel:**
- Next.js with TypeScript
- Tailwind CSS for styling (large touch targets, glanceable UI)
- Local storage (IndexedDB) for offline-first data
- Vercel KV for cross-device sync
- PWA manifest for full-screen iPad installation
- Voice input via Web Audio API + server-side transcription

**Architecture:**
- iPad is source of truth, writes to local storage + syncs to Vercel KV
- Phones read from Vercel KV (read-only in MVP)
- No accounts, no auth - single household code
- Manual JSON export for backup

## Freshness Tracking Approach

**Hybrid prompting** - not manual date entry:
1. Add item with just name/category
2. System knows typical shelf life ("chicken lasts ~3-5 days")
3. After estimated time, gentle prompt: "How's the chicken looking?"
4. User taps: "Still fresh" / "Use soon" / "Already used" / "Tossed"

This reduces burden while maintaining useful accuracy.

## Resolved Decisions

1. **Item entry**: Two-lane system
   - Lane A (fast): Predefined common items + recently used, one-tap add
   - Lane B (fallback): Free text for unusual items
   - Voice input for hands-free adding
   - NOT doing: barcode, camera (future maybe)

2. **Pattern curation**: Hybrid - ship with 15-25 defaults, users can customize later

3. **Data granularity**: Medium - quantity (plenty/some/low) + confidence (sure/unsure)

4. **Sync strategy**: Vercel KV with household code, iPad writes, phones read

5. **Backup**: Manual JSON export included in MVP

## MVP Scope

### In Scope
- Inventory tracking (fridge + freezer + pantry as zones)
- Meal pattern matching with custom pattern creation
- Derived grocery list
- Voice input for hands-free item entry
- Phone viewing via shared household code
- Manual data export/backup

### Out of Scope (explicitly)
- Nutrition/calorie/macro tracking
- Recipe instructions
- User accounts or auth
- Push notifications
- AI suggestions
- Multi-household support
- Weekly constraints (Phase 2)

## Implementation Phases

### Phase 1: Core Loop (MVP) ✓ Complete
- Project setup (Next.js, Tailwind, PWA config)
- Data layer (local storage + Vercel KV sync)
- Inventory CRUD with freshness states
- 16 default meal patterns + custom pattern creation
- Meal opportunity matching with friction levels
- Derived grocery list with smart suggestions
- Voice input for hands-free entry
- Manual JSON export/import
- Multi-device sync via household code

### Phase 2: Constraints & Planning (Post-MVP)
- Weekly constraint system
- Constraint-aware scoring
- Week-at-a-glance view

### Phase 3: Polish & Habits (Future)
- Freshness prompting system (automated prompts based on shelf life)
- Kiosk mode optimization

## Guiding Principles for Development

1. **Prefer "good enough" over perfect** - rough quantities beat exact counts
2. **Reduce friction at every step** - if it takes more than 3 taps, redesign it
3. **Make the common case fast** - adding chicken to inventory should be instant
4. **Surface insights, don't require input** - proactive > reactive
5. **Embrace the physical context** - this lives on a fridge, design for that
6. **One household, one truth** - no personalization friction
7. **Patterns over recipes** - flexibility beats precision

---

*This document is the north star. When in doubt about a feature or design decision, return to the core philosophy: reduce thinking, not increase tracking.*
