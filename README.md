![](https://github.com/rdlf0/minesweeper/workflows/CI/CD/badge.svg)

# Minesweeper
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
- ### Download already compiled
    Simply download the asset from the [latest release](https://github.com/rdlf0/minesweeper/releases/latest), unzip and just open `index.html`.
- ### Play online  
    Enjoy the published version of the game at [http://rdlf0-minesweeper.s3-website.us-east-2.amazonaws.com/](http://rdlf0-minesweeper.s3-website.us-east-2.amazonaws.com/)

## Settings *
| Setting | Options |
| ------- | ------- |
| mode | `beginner`, `intermediate`, `expert` |
| first click ** | `guaranteed non-mine`, `guaranteed cascade` |
| debug *** | `true`, `false` |

_* not available to the user yet - see [issue #2](https://github.com/rdlf0/minesweeper/issues/2)_  
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
| `guaranteed cascade` | the first clicked cell always has a value of 0 and its neighbouring cells have values between 0 and 8 |

## Game start options
| Option | Mode | State **** |
| ------ | ---- | ----- |
| from URL | from settings | random |
| from URL with hash | from hash | from hash |
| reset | from settings | random |
| replay | from settings | from current board |

_**** Represents the positioning of the mines_

Happy wasting of your time! :) 💣
