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
| Setting | Options | Default |
| ------- | ------- | ------- |
| mode | `beginner`, `intermediate`, `expert` | `expert` |
| first click * | `guaranteed non-mine`, `guaranteed cascade` | `guaranteed cascade` |
| dark mode | `enabled`, `disabled` | `enabled` |
| debug ** | `true`, `false` | `false` |

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
