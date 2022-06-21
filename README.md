![](https://github.com/rdlf0/minesweeper/workflows/CI/CD/badge.svg)

# Minesweeper

## Requirements
- typescript v3 or later (if you choose the compile option below)
- a non-ancient browser

## Options to play
### Online  
Enjoy the published version of the game at [theminesweeper.com](https://theminesweeper.com)
### Locally - download precompiled
Simply download the asset from the [latest release](https://github.com/rdlf0/minesweeper/releases/latest), unzip, and then open `index.html`.
### Locally - compile from source
Clone, go to the root project directory and run:  
```
$ tsc
```
After that open the `index.html`.

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
| `beginner` | 9 | 9 | 10 |
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
