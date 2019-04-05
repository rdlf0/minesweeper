import { Cell } from "./cell";
import { Game } from "./game";

export class Board {
    private grid: Cell[][];
    private revealed: number = 0;

    constructor(
        private game: Game,
        private rows: number,
        private cols: number,
        private mines: number
    ) {
        this.initGrid();
        this.plantMines();
    }

    private initGrid(): void {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = new Cell(this, i, j);
            }
        }
    }

    private plantMines(): void {
        let count = 0;

        while (count < this.mines) {
            count += this.grid[this.random(0, this.rows)][this.random(0, this.cols)].setMine();
        }
    }

    public replantMine(centerRow: number, centerCol: number): void {
        const randomRow = this.random(0, this.rows);
        const randomCol = this.random(0, this.cols);

        const distance = this.getGame().config.firstClick;

        const outOfSafeArea = (randomRow > centerRow + distance || randomRow < centerRow - distance)
            && (randomCol > centerCol + distance || randomCol < centerCol - distance);

        if (!outOfSafeArea || this.grid[randomRow][randomCol].setMine() === 0) {
            this.replantMine(centerRow, centerCol);
        }
    }

    private random(from: number, to: number): number {
        return Math.floor(Math.random() * to) + from;
    }

    public getGame(): Game {
        return this.game;
    }

    public draw(board: HTMLElement): void {
        board.innerHTML = "";

        let rowsContainer = document.createElement("ul");
        rowsContainer.id = "rows-container";
        board.append(rowsContainer);

        for (let i = 0; i < this.rows; i++) {
            let row = document.createElement("li");
            row.classList.add("row");
            rowsContainer.append(row);

            let colsContainer = document.createElement("ul");
            colsContainer.classList.add("cols-container");
            row.append(colsContainer);

            for (let j = 0; j < this.cols; j++) {
                colsContainer.append(this.grid[i][j].getElement());
            }
        }
    }

    public getAdjacentCells(row: number, col: number): Cell[] {
        let adj: Cell[] = [];

        for (let i = row - 1; i <= row + 1; i++) {
            for (let j = col - 1; j <= col + 1; j++) {
                // Don't check current cell
                if (i == row && j == col) continue;

                if (i >= 0 && i < this.rows && j >= 0 && j < this.cols) {
                    adj.push(this.grid[i][j]);
                }
            }
        }

        return adj;
    }

    public revealMines(win: boolean): void {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let cell = this.grid[i][j];

                if (cell.isMine()) {
                    if (win) {
                        cell.revealFlag();
                    } else {
                        cell.revealMine();
                    }
                } else {
                    if (cell.isFlagged()) {
                        cell.setWronglyFlagged();
                    }
                }
            }
        }
    }

    public incrementRevealed(): void {
        this.revealed++;
        this.checkForWin();
    }

    private checkForWin(): void {
        if (this.revealed === this.rows * this.cols - this.mines) {
            this.game.gameOver(true);
        }
    }
}