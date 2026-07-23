# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A browser-based Minesweeper game written in vanilla TypeScript with **no third-party
dependencies, frameworks, or build tooling beyond `tsc`** (see `CONTRIBUTING.md` —
"keep it as simple as possible" is the project's first rule). There is no
`package.json` and no `node_modules`; TypeScript is expected to be installed globally.
The live game is at theminesweeper.com.

## Commands

```sh
tsc                      # compile src/**/*.ts -> dist/ (native ES modules, ES2020)
tsc --noEmit             # type-check only, no build
tsc --sourceMap -w       # watch mode with source maps, for local development
npx serve                # serve the project root over HTTP for local play (needs Node)
tsc && node --test       # build, then run the unit tests (Node's built-in runner)
```

After compiling, serve the project root over HTTP and open the printed URL in a
browser — e.g. `npx serve`. Opening `index.html` from the filesystem will **not** work:
the app loads as native ES modules (`<script type="module" src="dist/main.js">`), which
browsers refuse to load over `file://`. Production (S3) and the release zip serve over
HTTP, so they're unaffected.

Tests live in `test/*.test.mjs` and run on Node's built-in runner (`node:test` +
`node:assert`, **no test framework or third-party deps**). They import the compiled
`dist/*.js`, so build first: `tsc && node --test`. Coverage is the pure-logic modules
only — pairers, encoders, `State` (the URL round-trip pipeline); the DOM-heavy parts
(`Board`, `Cell`, `Game`) are not unit-tested. No linter is configured. CI runs
`tsc && node --test` on every non-`master` branch (type-check + unit tests); releases
compile and deploy the static files to S3. Both
workflows pin `typescript@6.0.3` (installed via `npm i -g`) so the runner can't drift
— bump both `.github/workflows/*.yml` together if you upgrade. The compiler is the
quality gate: `tsconfig.json` runs full `strict` mode (only `strictPropertyInitialization`
is disabled, because fields are assigned in `initialize()` lifecycle methods, not the
constructor).

## Architecture

The app is event-driven. Components never call each other directly across domains —
they communicate through a global static `PubSub` (`src/util/pub-sub.ts`) using the
`EVENT_*` string constants defined there. When adding behavior, prefer publishing /
subscribing over wiring direct method calls.

Core flow:

- **`main.ts`** — entry point. Builds the `Config` object (mode, encoder, pairer,
  first-click rule, dark mode, debug flag) and instantiates `Game`. This is the one
  place to swap which `Encoder` / `Pairer` implementation is used.
- **`Game`** (`game.ts`) — orchestrator. Owns the UI controls (counter, timer, reset
  / replay / settings buttons), subscribes to game events, and drives `initialize()`
  which decides how a board is created: reset, replay, from a URL hash, or fresh from
  config. Reacts to `hashchange` and settings changes by re-initializing.
- **`Board`** (`board.ts`) — the grid of `Cell`s. Plants mines (randomly, or decoded
  from a `State`), computes adjacent-cell values, handles cascade reveals, enforces
  the first-click safe-area rule (`makeSafeArea` / `replantMine`), and detects win.
- **`Cell`** (`cell.ts`) — a single square plus its DOM element. Implements
  `handleEvent` (it registers *itself* as the click/contextmenu listener). Reveal /
  flag / question transitions publish the relevant events. Cell `value` doubles as
  state: `-2` = default, `-1` = mine, `0..8` = adjacent mine count.
- **`Session`** (`util/session.ts`) — a static in-memory key/value store for
  cross-cutting per-game flags (`debug`, `firstClick`, `gameStarted`,
  `applyFirstClickRule`). Cleared on every `initialize()`.

### Board sharing via URL hash (`urlTool.ts` + encoder + pairer)

A board is fully reproducible from the URL hash, which is how "replay" and
share-a-board work. The encoding pipeline:

1. The mode `{rows, cols, mines}` is folded into a single integer using a **pairing
   function** (`src/pairer/`, e.g. `CantorPairer`) — nested pairing of (rows,cols)
   then with mines.
2. That integer (as a fixed 24-bit binary string, `MODE_SIZE`) is concatenated with
   the mine layout — the `State` bitstring (`state.ts`, one bit per cell).
3. The combined binary string is run through an **`Encoder`** (`src/encoder/`, e.g.
   `BinaryToBase64UrlEncoderV2`) to produce the URL-safe hash, set via
   `history.replaceState`.

Decoding reverses this. `extractMode` validates the result (min rows/cols,
mines-to-cells ratio) and returns `null` on anything malformed, so callers must handle
the fallback. `Pairer` and `Encoder` are interfaces with interchangeable
implementations selected in `main.ts`; the encoder/pairer chosen must stay consistent
between encode and decode, so changing the default in `main.ts` invalidates
previously shared URLs.

## Conventions

- Keep it dependency-free and simple (the explicit contributing rule).
- `// nosonar` comments suppress SonarQube findings — leave them in place.
- Work happens on feature branches off `master` via PRs (see `CONTRIBUTING.md`);
  `master` is protected and CI-gated.
