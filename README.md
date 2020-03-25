![](https://github.com/rdlf0/minesweeper/workflows/CI/CD/badge.svg)

# Minesweeper
## Requirements
- typescript v3 or later
- a non-ancient browser

## Compilation and running

Clone, get to the root directory and run:

```
$ tsc
```
Or simply download the asset from the [latest release](https://github.com/rdlf0/minesweeper/releases/latest) and just unzip.  
After that just open `index.html`.

## Settings _(not yet available to the user - [issue #2](https://github.com/rdlf0/minesweeper/issues/2))_
| Setting | Options |
| ------- | ------- |
| mode | beginner \| intermediate \| expert
| first click * | guaranteed non-mine \| guaraneed cascade |
| debug ** | true \| false |

_* considered only when game is started from URL or reset_  
_** will probably not become available to the user_

## Game start options
| Option | Mode | State |
| ------ | ---- | ----- |
| from URL | from config | random |
| from URL with hash | from hash | from hash |
| reset | from config | random |
| replay | from config | from current board |
