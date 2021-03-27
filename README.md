![](https://github.com/rdlf0/minesweeper/workflows/CI/CD/badge.svg)

# Minesweeper

## Table of contents
- [Requirements](#requirements)
- [Getting it up and running](#getting-it-up-and-running)
  - [Compile](#compile)
  - [Download precompiled](#download-precompiled)
  - [Play online](#play-online)
- [Settings](#settings-)
- [Game modes](#game-modes)
- [First click options](#first-click-options)
- [Game start options](#game-start-options)

## Requirements
- typescript v3 or later (if you choose the compile option below)
- a non-ancient browser

## Getting it up and running
There are 3 options from which you can choose:
- ### Compile
    Clone, go to the root directory and run:  
    ```
    $ tsc
    ```
    After that open the `index.html`.
- ### Download precompiled
    Simply download the asset from the [latest release](https://github.com/rdlf0/minesweeper/releases/latest), unzip and just open `index.html`.
- ### Play online  
    Enjoy the published version of the game at [theminesweeper.com](https://theminesweeper.com)

## Settings *
| Setting | Options |
| ------- | ------- |
| mode | `beginner`, `intermediate`, `expert` |
| first click ** | `guaranteed non-mine`, `guaranteed cascade` |
| debug *** | `true`, `false` |

_* not available to the user yet - see #2_  
_** considered only when game is started from URL or by reset (see game start options below)_  
_*** will probably not become available to the user_

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
| `guaranteed cascade` | the first clicked cell always has a value of 0 and its neighboring cells have values between 0 and 8 |

## Game start options
| Option | Mode | State **** |
| ------ | ---- | ----- |
| from URL | from settings | random |
| from URL with hash | from hash | from hash |
| reset | from current board | random |
| replay | from current board | from current board |

_**** Represents the positioning of the mines_

## Contributing
Please check [CONTRIBUTING.md](CONTRIBUTING.md).  
<hr>
Happy wasting of your time! :) 💣
