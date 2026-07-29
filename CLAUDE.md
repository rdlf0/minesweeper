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

- **`main.ts`** — entry point. `fetch`es the tunable settings (mode, first-click rule,
  hint mode/cost, dark mode, debug flag) from `config.json` at the project root, merges
  in the code-only fields (`encoder`, `modePairer`, `github`) to build the `Config`
  object, and instantiates `Game`. This is the one place to swap which `Encoder` /
  `Pairer` implementation is used, and where the `github` repo is set. `config.json` is
  served over HTTP alongside the app (which is why local play needs a server, not
  `file://`); the release workflow uploads it to S3 with a dedicated no-cache rule.
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
the fallback. A hash may legitimately stop after the 24-bit mode and carry no layout —
that asks for a fresh board of that size, and the PWA shortcuts in `manifest.webmanifest`
are exactly this. `extractState` distinguishes the two: no layout bits at all is a `warn`,
while layout bits that don't fill the board are an `error`. `Game.generateBoard` only
reads a layout once `extractMode` has succeeded, so a hash with no valid mode can't
produce a misleading "missing layout" message. Those shortcut hashes are hand-maintained
and go stale when a preset changes — regenerate them with the current `Pairer`/`Encoder`
rather than editing by hand. `Pairer` and `Encoder` are interfaces with interchangeable
implementations selected in `main.ts`; the encoder/pairer chosen must stay consistent
between encode and decode, so changing the default in `main.ts` invalidates
previously shared URLs.

### Mobile / touch (`util/device.ts`)

Touch devices take a different path throughout. The single detector is
`isTouchDevice()` — `matchMedia("(pointer: coarse)")`, so phones and tablets qualify but
desktops and touchscreen laptops don't. It's deliberately the only place that decision
is made; change it there and everything follows.

- **Board size.** Instead of a `BOARD_CONFIG` preset, `Game.generateBoard` derives a
  `Mode` from the screen via `computeDeviceMode(width, height, density)` — rows and cols
  chosen so each cell lands near `TARGET_CELL_SIDE` (40px), and mines from
  `mobileMineDensity` clamped to `[MIN_MINES_TO_CELLS_RATIO, MAX_MINES_TO_CELLS_RATIO]`
  (in `config.ts`, shared with `urlTool`'s decode validation). That density seeds from
  `config.json` and is then player-adjustable via the `Mine density` slider (see below).
  `getDeviceBoardArea()` is orientation-independent (short
  viewport side = board width), so rotation doesn't change the derived mode.
  `computeDeviceMode` is pure and unit-tested in `test/deviceMode.test.mjs`.
- **Layout.** One `@media (pointer: coarse)` block at the end of `styles.css` drops the
  desktop `calc()` sizing and fixed margins/borders; `#board` becomes a `1fr` grid inside
  a full-viewport flex column, so it fills the screen exactly. `#controls`' `56rem`
  height must stay in step with `MOBILE_CONTROLS_HEIGHT`.
- **Input.** `Cell` registers `contextmenu` only on non-touch; on touch it registers the
  `TOUCH_EVENTS` set instead. One gesture scheme, not configurable: **a tap reveals, a
  press-and-hold of `LONG_PRESS_MS` marks** (flag → question → default). The hold sets
  `suppressClick` so the release can't reveal a cell the hold just cycled back to default
  — that guard is load-bearing, not defensive. A drag past `LONG_PRESS_MOVE_TOLERANCE`
  cancels the hold so swiping doesn't scatter flags. Reveal no-ops on a marked cell,
  matching a desktop left click. `.cell` needs `touch-action: manipulation` (kills the tap
  delay) and `-webkit-touch-callout: none` (stops iOS's callout on a hold).
- **Haptics.** `vibrate()` in `util/device.ts` is called from exactly one place: a mine
  going off. There is deliberately **no** buzz when flagging — Android fires its own
  haptic on a press-and-hold, and adding ours produced a double buzz on real hardware
  (verified on a Pixel 7 Pro and a OnePlus 13). Don't "fix" that omission. There is no
  in-game haptics setting either; the phone's own silent mode and system touch-feedback
  toggle already gate it, and `navigator.vibrate()` returns `true` even when the device
  silently drops the buzz, so its return value can't be used to detect that.
- **URL hash is ignored on touch.** A shared board carries fixed dimensions that wouldn't
  fit, so `generateBoard` skips the hash branch and plays a device board — whose own hash
  is then written, keeping mobile boards shareable outward. Replay is unaffected (it
  reads `board.getState()` from memory).
- **Portrait only.** A `(pointer: coarse) and (orientation: landscape)` rule hides `main`
  and shows `#rotate-message`. `Game.lockPortraitOrientation()` additionally attempts
  `screen.orientation.lock("portrait")`, which only succeeds in an installed mobile PWA
  and rejects harmlessly elsewhere. The manifest stays `"orientation": "any"` so the
  desktop PWA can still run in a landscape window.
- **Settings differ by device.** The `Mode` fieldset is hidden on touch — dimensions come
  from the screen, so the presets can't change anything. In its place touch gets
  `Mine density`, a slider over `[MIN_MINES_TO_CELLS_RATIO, MAX_MINES_TO_CELLS_RATIO]`
  that is hidden on desktop (density only shapes device-derived boards). The slider works
  in whole percent so dragging can't accumulate float drift, and only commits on `change`,
  not `input` — committing per input event would rebuild the board dozens of times in one
  drag. Its readout shows the resulting mine count for this screen, computed with the same
  `computeDeviceMode` the board uses, so the two can't disagree.

## Conventions

- Keep it dependency-free and simple (the explicit contributing rule).
- `// nosonar` comments suppress SonarQube findings — leave them in place.
- Work happens on feature branches off `master` via PRs (see `CONTRIBUTING.md`);
  `master` is protected and CI-gated.
