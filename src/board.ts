import { Cell } from "./cell";
import { Game } from "./game";
import { BOARD_CONFIG } from "./config";
import { Encoder, Pair } from "./encoder";

export class Board {
    
    private rows: number;
    private cols: number;
    private mines: number;

    private grid: Cell[][];

    private revealedCounter: number = 0;

    constructor(
        private game: Game,
        private minesScheme: boolean[] = []
    ) {
        const mode = this.getGame().getConfig().mode;
        this.rows = BOARD_CONFIG[mode].rows;
        this.cols = BOARD_CONFIG[mode].cols;
        this.mines = BOARD_CONFIG[mode].mines;

        this.initGrid();
        this.plantMines();
        this.encodeState();
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
        if (this.minesScheme.length > 0) {
            this.plantMinesFromScheme();
        } else {
            this.plantMinesRandomly();
        }
    }

    private plantMinesFromScheme() {
        for (let i = 1; i < this.minesScheme.length; i++) {
            if (this.minesScheme[i]) {
                const row = Math.ceil(i / this.cols) - 1;
                const col = (i - 1) % this.cols;
                this.grid[row][col].setMine();
            }
        }
    }

    private plantMinesRandomly() {
        let count = 0;

        while (count < this.mines) {
            const row = this.random(0, this.rows);
            const col = this.random(0, this.cols);
            const planted = this.grid[row][col].setMine();
            if (planted === 1) {
                count++;
                this.minesScheme[(row * this.cols + col + 1)] = true;
            }
        }
    }

    public replantMine(centerRow: number, centerCol: number, unsetMineRow?: number, unsetMineCol?: number): void {
        // Remove mine from scheme on first attempt
        if (unsetMineRow !== undefined && unsetMineCol !== undefined) {
            this.minesScheme[(unsetMineRow * this.cols + unsetMineCol + 1)] = null;
        }

        const randomRow = this.random(0, this.rows);
        const randomCol = this.random(0, this.cols);

        const distance = this.getGame().getConfig().firstClick;

        // Check if generated row/col pair is not in the same cell/area
        const outOfSafeArea = (randomRow > centerRow + distance || randomRow < centerRow - distance)
            && (randomCol > centerCol + distance || randomCol < centerCol - distance);

        if (!outOfSafeArea || this.grid[randomRow][randomCol].setMine() === 0) {
            this.replantMine(centerRow, centerCol);
        } else {
            this.minesScheme[(randomRow * this.cols + randomCol + 1)] = true;
        }
    }

    private random(from: number, to: number): number {
        return Math.floor(Math.random() * to) + from;
    }

    public getMinesScheme(): boolean[] {
        return this.minesScheme;
    }

    public getGame(): Game {
        return this.game;
    }

    public getMines(): number {
        return this.mines;
    }

    public draw(board: HTMLElement): void {
        board.innerHTML = "";

        const rowsContainer = document.createElement("ul");
        rowsContainer.id = "rows-container";
        board.append(rowsContainer);

        for (let i = 0; i < this.rows; i++) {
            const row = document.createElement("li");
            row.classList.add("row");
            rowsContainer.append(row);

            const colsContainer = document.createElement("ul");
            colsContainer.classList.add("cols-container");
            row.append(colsContainer);

            for (let j = 0; j < this.cols; j++) {
                colsContainer.append(this.grid[i][j].getElement());
            }
        }
    }

    public getAdjacentCells(row: number, col: number): Cell[] {
        const adj: Cell[] = [];

        for (let i = row - 1; i <= row + 1; i++) {
            for (let j = col - 1; j <= col + 1; j++) {
                // Skip current cell
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
                const cell = this.grid[i][j];

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
        this.revealedCounter++;
        this.checkForWin();
    }

    private checkForWin(): void {
        if (this.revealedCounter === this.rows * this.cols - this.mines) {
            this.game.gameOver(true);
        }
    }

    private encodeState(): void {
        const p: Pair = {
            a: 15,
            b: 3
        };

        const encoded = Encoder.encode(p);
        const decoded = Encoder.decode(encoded);

        console.log(encoded);
        console.log(decoded);
    }
}