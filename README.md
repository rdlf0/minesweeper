[![Release](https://github.com/rdlf0/minesweeper/actions/workflows/release.yml/badge.svg)](https://github.com/rdlf0/minesweeper/actions/workflows/release.yml)

# Minesweeper

## Requirements
- a non-ancient browser
- _to play locally:_ a static file server — the game loads as ES modules, which browsers refuse to load over `file://`, so opening `index.html` straight from the filesystem won't work. Any server will do, e.g. `npx serve` (requires [Node.js](https://nodejs.org)).
- _to compile from source:_ typescript v4 or later

## Options to play
### Online  
Enjoy the published version of the game at [theminesweeper.com](https://theminesweeper.com). You can also install it as a progressive web app!
### Locally - download precompiled
Download the asset from the [latest release](https://github.com/rdlf0/minesweeper/releases/latest), unzip, then serve the folder over HTTP and open the printed URL in your browser:
```
$ npx serve
```
(Opening `index.html` directly from the filesystem won't work — the game loads as ES modules, which browsers block over `file://`.)
### Locally - compile from source
Clone, go to the root project directory, compile, then serve:  
```
$ tsc
$ npx serve
```
After that open the printed URL (e.g. http://localhost:3000) in your browser.

## Settings
The tunable settings are seeded from `config.json` at the project root, which is
fetched when the game loads. Editing it and reloading changes the defaults with no
recompile (the game must be served over HTTP — see [Requirements](#requirements)).
`first click`, `hint mode`, and `dark mode` are also adjustable at runtime through the
in-game settings panel; `hint cost` and `debug` are configuration-only. The remaining
two are device-specific: `mode` is in the panel on desktop only, and `mine density` on
touch devices only — see [Mobile / touch devices](#mobile--touch-devices).


| Setting | Config key | Option | Config value | Default | Notes |
| ------- | ---------- | ------ | ------------ | :-----: | ----- |
| mode | `mode` | `beginner`<br>`intermediate`<br>`expert` | `"beginner"`<br>`"intermediate"`<br>`"expert"` | <br><br>✓ | ignored on touch devices, where the board is derived from the screen |
| first click | `firstClick` | `guaranteed non-mine`<br>`guaranteed cascade` | `0`<br>`1` | <br>✓ | considered only for a new game (e.g. ignored on replay or load from URL hash) |
| hint mode | `hintMode` | `mines`<br>`safe cells` | `"mines"`<br>`"safe"` | ✓<br>&nbsp; | |
| hint cost | `hintCost` | any whole number of seconds added to the timer per hint | `10` | `10` | in the configuration only, not available in the settings panel |
| dark mode | `darkModeOn` | `enabled`<br>`disabled` | `true`<br>`false` | ✓<br>&nbsp; | |
| mine density | `mobileMineDensity` | share of cells that are mines, between `0.05` and `0.25` | `0.18` | `0.18` | touch devices only; values outside the range are clamped to it |
| debug | `debug` | `false`<br>`true` | `false`<br>`true` | ✓<br>&nbsp; | in the configuration only, not available in the settings panel |

## Game modes
| Mode | Rows | Columns | Mines |
| ------ | ---- | ----- | ----- |
| `beginner` | 9 | 14 | 10 |
| `intermediate` | 16 | 16 | 40 |
| `expert` | 16 | 30 | 99 |

These presets apply on desktop. Touch devices size the board from the screen instead —
see [Mobile / touch devices](#mobile--touch-devices).

## First click options
| Option | Meaning |
| ------ | ------- |
| `guaranteed non-mine` | the first clicked cell has a value between 0 and 8 |
| `guaranteed cascade` | the first clicked cell has a value of 0 |

## Hint options
The hint button (💡) runs a built-in logic solver over the current board and highlights every cell it can prove, each with an explanation shown on hover (on touch devices the explanation is delivered differently — see [Mobile / touch devices](#mobile--touch-devices)). It never guesses — only cells that logic guarantees are highlighted — and it reasons purely from what's on the board, so every explanation is checkable at a glance. Each hint costs the player some time (added to the timer); the cost is shown in the button's tooltip.

| Option | Meaning |
| ------ | ------- |
| `mines` | highlight the cells that are provably mines (pulsing red) |
| `safe cells` | highlight the cells that are provably safe to reveal (pulsing green) |

## Game start options
| Option | Mode | State (the positioning of the mines) | Notes |
| ------ | ---- | ----- | ----- |
| from a URL | from settings | random | |
| from a URL with a hash | from hash | from hash | on touch devices the hash is ignored — see [Mobile / touch devices](#mobile--touch-devices) |
| new game (reset) | from current board | random | |
| replay | from current board | from current board | |

## Mobile / touch devices
The game plays differently on phones and tablets. A device counts as touch when its
primary pointer is coarse (`(pointer: coarse)`), so touchscreen laptops still get the
desktop experience.

### The board is derived from the screen
There are no presets on touch. The board is sized to fill the screen with cells around
40px a side — big enough to hit with a finger — so rows and columns come from the
viewport rather than from `mode`. The number of mines is then that cell count times the
mine density (`mobileMineDensity`, clamped to 5–25%).

The sizing uses the short side of the viewport as the board width regardless of how the
device is held, so rotating it doesn't change the board. Resizing the window (or
installing the PWA, which changes the available height) recomputes the board and starts
a new game — but only before the first move, and only if the resulting rows, columns or
mines actually differ, so a game in progress is never thrown away.

Because a board is sized for the screen it was created on, **a shared URL hash is
ignored on touch** — the fixed dimensions it carries wouldn't fit. You get a board for
your screen instead, and its own hash is written to the URL, so boards played on a
phone can still be shared outwards. Replay is unaffected.

The game is **portrait only**: in landscape the board is replaced by a prompt to rotate
back. Installed as a PWA it also asks the system to lock the orientation.

### Touch controls
| Gesture | Action |
| ------- | ------ |
| tap | reveal a cell (no-op on a flagged or questioned cell, same as a desktop left click) |
| press and hold (0.4s) | cycle the mark: flag → question mark → unmarked |

Sliding your finger away during a hold cancels it, so scrolling or dragging across the
board won't scatter flags. A hold that marks a cell won't also reveal it on release.
The only haptic feedback is a buzz when a mine goes off; flagging is left to the
device's own press-and-hold haptic. Both follow the phone's silent mode and system
touch-feedback settings.

### Hints
The hint explanation can't be delivered by a hover tooltip on touch, so hints appear as
a message at the top or bottom of the screen — whichever half the hinted cell isn't in
— with the cell itself ringed. The message is numbered (e.g. `(2/5)`) when the solver
found more than one hint; pressing 💡 again steps to the next one, which is free, since
it's the same solve. It stays up until you dismiss it (tap it or its ×), step to
another hint, or the board changes.

### Settings
The `Mode` fieldset is hidden — dimensions come from the screen, so the presets have
nothing to change. In its place there's a `Mine density` slider covering 5–25%, hidden
on desktop for the same reason in reverse. The slider reads out the resulting mine
count for your screen rather than the percentage, and only rebuilds the board when you
let go.

## Contributing
Please check [CONTRIBUTING.md](CONTRIBUTING.md).  
<br />
**_Happy wasting of your time! :) 💣_**
