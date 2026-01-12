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
- **Confidence-based freshness** (Fresh → Probably fine → Use soon → Toss soon)

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
- category: protein | vegetable | dairy | grain | condiment | etc.
- location: fridge | freezer | pantry
- quantity: low | some | plenty
- freshnessState: fresh | probablyFine | useSoon | tossSoon
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

### MealLog
```
- id: unique identifier
- date: date
- mealType: breakfast | lunch | dinner | snack
- patternUsed: optional reference to pattern
- freeformDescription: "Leftovers", "Ate out"
- ingredientsUsed: [item references]
```

### GroceryItem (Derived - not stored)
```
- name: "Salmon"
- priority: urgent | replenish | opportunity | wishlist
- reasoning: "Would enable 2 more fish meals this week"
- enablesMeals: [pattern references]
```

## The Opportunity Scoring System

When calculating "what meal makes sense now":

```
Score =
  (0.4 × InventoryMatch) +      // Do we have the ingredients?
  (0.3 × ConstraintFit) +        // Does this help weekly goals?
  (0.2 × FreshnessUrgency) +     // Does this use aging items?
  (0.1 × RecencyPenalty)         // Did we have this recently?
```

This produces a ranked list of meal opportunities with explainable reasoning.

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
- "We had [meal]" - log what you ate
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

## Tech Stack

**Primary (iPad-first):**
- SwiftUI for UI (native iPad experience, 120Hz, widgets)
- SwiftData for local persistence (offline-first)
- CloudKit for sync (zero backend, family sharing built-in)

**Alternative (if cross-platform needed):**
- React Native + Expo
- SQLite for local storage
- PowerSync for sync

## Freshness Tracking Approach

**Hybrid prompting** - not manual date entry:
1. Add item with just name/category
2. System knows typical shelf life ("chicken lasts ~3-5 days")
3. After estimated time, gentle prompt: "How's the chicken looking?"
4. User taps: "Still fresh" / "Use soon" / "Already used" / "Tossed"

This reduces burden while maintaining useful accuracy.

## Open Questions

These need resolution as we build:

1. **Item entry**: Voice? Camera? Predefined list? Barcode scan?
2. **Pattern curation**: Build from scratch vs. customize defaults?
3. **Portion tracking**: "How much chicken" vs just "we have chicken"?
4. **Leftover handling**: Is "leftovers" a meal pattern?
5. **External meals**: How to log "ate out" or "ordered in"?

## Implementation Phases

### Phase 1: Core Loop
- Inventory CRUD with freshness states
- 10-15 default meal patterns
- Basic opportunity calculator
- Simple grocery list derivation

### Phase 2: Constraints & Planning
- Weekly constraint system
- Constraint-aware scoring
- Meal logging
- Week-at-a-glance view

### Phase 3: Polish & Habits
- Freshness prompting system
- Smart grocery suggestions
- iPadOS widgets
- Kiosk mode setup

### Phase 4: Multi-Device
- CloudKit shared database
- iPhone companion app
- Web dashboard (optional)

## Guiding Principles for Development

1. **Prefer "good enough" over perfect** - rough quantities beat exact counts
2. **Reduce friction at every step** - if it takes more than 3 taps, redesign it
3. **Make the common case fast** - logging "we had stir fry" should be instant
4. **Surface insights, don't require input** - proactive > reactive
5. **Embrace the physical context** - this lives on a fridge, design for that
6. **One household, one truth** - no personalization friction
7. **Patterns over recipes** - flexibility beats precision

---

*This document is the north star. When in doubt about a feature or design decision, return to the core philosophy: reduce thinking, not increase tracking.*
