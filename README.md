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
`mode`, `first click`, `hint mode`, and `dark mode` are also adjustable at runtime
through the in-game settings panel; `hint cost` and `debug` are configuration-only.

Each row below maps an option to the `config.json` value it corresponds to
(✓ marks the default):

| Setting | Config key | Option | Config value | Default |
| ------- | ---------- | ------ | ------------ | :-----: |
| mode | `mode` | `beginner`<br>`intermediate`<br>`expert` | `"beginner"`<br>`"intermediate"`<br>`"expert"` | <br><br>✓ |
| first click * | `firstClick` | `guaranteed non-mine`<br>`guaranteed cascade` | `0`<br>`1` | <br>✓ |
| hint mode | `hintMode` | `mines`<br>`safe cells` | `"mines"`<br>`"safe"` | ✓<br>&nbsp; |
| hint cost | `hintCost` | any whole number of seconds added to the timer per hint | `10` | `10` |
| dark mode | `darkModeOn` | `enabled`<br>`disabled` | `true`<br>`false` | ✓<br>&nbsp; |
| debug ** | `debug` | `false`<br>`true` | `false`<br>`true` | ✓<br>&nbsp; |

_* considered only for new game_  
_** will probably not become available to the user_

## Game modes
| Mode | Rows | Columns | Mines |
| ------ | ---- | ----- | ----- |
| `beginner` | 9 | 14 | 10 |
| `intermediate` | 16 | 16 | 40 |
| `expert` | 16 | 30 | 99 |

## First click options
| Option | Meaning |
| ------ | ------- |
| `guaranteed non-mine` | the first clicked cell has a value between 0 and 8 |
| `guaranteed cascade` | the first clicked cell has a value of 0 |

## Hint options
The hint button (💡) runs a built-in logic solver over the current board and highlights every cell it can prove, each with an explanation shown on hover. It never guesses — only cells that logic guarantees are highlighted — and it reasons purely from what's on the board, so every explanation is checkable at a glance. Each hint costs the player some time (added to the timer); the cost is shown in the button's tooltip.

| Option | Meaning |
| ------ | ------- |
| `mines` | highlight the cells that are provably mines (pulsing red) |
| `safe cells` | highlight the cells that are provably safe to reveal (pulsing green) |

## Game start options
| Option | Mode | State *** |
| ------ | ---- | ----- |
| from a URL | from settings | random |
| from a URL with a hash | from hash | from hash |
| new game (reset) | from current board | random |
| replay | from current board | from current board |

_*** The state represents the positioning of the mines_

## Contributing
Please check [CONTRIBUTING.md](CONTRIBUTING.md).  
<br />
**_Happy wasting of your time! :) 💣_**
