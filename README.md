# FridgeBud

A household food app and shared reference for recipes, meal ideas, and flexible meal patterns.

## Shared food source

**[Read the food catalog](data/food/catalog.json)** · **[Format, recovery, and PR workflow](data/food/README.md)**

**Meals V2** is the active household list: four meals prepared by Calvin and four by Zoe. The original defaults remain available as a separate reference list.

The catalog on `main` is the source of truth for food conversations across ChatGPT sessions with GitHub access. It records recipe ingredients/instructions, food ideas, and meal patterns with provenance and notes. Read it fresh before discussing saved food. Requested food updates go through validated PRs; eligible catalog-only PRs from `50thycal` merge automatically. See [AGENTS.md](AGENTS.md) for session instructions.

The app's **Our food catalog** page (`/food`, linked from Home and Meals) displays this same data. Existing device-specific meals can be exported there and shared in chat for recovery. Custom local meals are drafts until committed; household cloud sync does not include them.

## Development

Next.js 16, React 19, TypeScript, Tailwind, and Vercel KV. Existing inventory, grocery, voice, and household-sync features remain available.

```bash
npm ci
npm run dev
```

```bash
npm run validate:food
npm run test:food
npx tsc --noEmit
npm run build
npm run lint
```

Vercel KV and voice features use their existing server environment configuration; browsing the food catalog needs no credentials or additional database.
