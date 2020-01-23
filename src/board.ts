import { Cell } from "./cell";
import { Game } from "./game";
import { BOARD_CONFIG } from "./config";
import { State } from "./state";

export class Board {

    private rows: number;
    private cols: number;
    private mines: number;

    private grid: Cell[][];

    private revealedCounter: number = 0;

    constructor(
        private game: Game,
        private state: State
    ) {
        const mode = this.getGame().getConfig().mode;
        this.rows = BOARD_CONFIG[mode].rows;
        this.cols = BOARD_CONFIG[mode].cols;
        this.mines = BOARD_CONFIG[mode].mines;

        this.initGrid();
        this.plantMines();
        // this.encodeState();
    }

    public getGame(): Game {
        return this.game;
    }

    public getState(): State {
        return this.state;
    }

    public getMines(): number {
        return this.mines;
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
        if (this.state == undefined) {
            this.plantMinesRandomly();
        } else {
            this.plantMinesFromState();
        }
    }
    
    private plantMinesFromState(): void {
        for (let i = 0; i < this.rows * this.cols; i++) {
            if (this.state.isHighBit(i)) {
                const row = Math.floor(i / this.cols);
                const col = i % this.cols;
                this.grid[row][col].setMine();
            }
        }
    }
    
    private plantMinesRandomly(): void {
        this.state = new State(this.rows * this.cols);
        
        let count = 0;
        while (count < this.mines) {
            const row = this.random(0, this.rows);
            const col = this.random(0, this.cols);
            const planted = this.grid[row][col].setMine();
            if (planted === 1) {
                count++;
                this.state.setBit(row * this.cols + col);
            }
        }
    }

    public replantMine(centerRow: number, centerCol: number, unsetMineRow?: number, unsetMineCol?: number): void {
        // Remove mine from state on first attempt
        if (unsetMineRow !== undefined && unsetMineCol !== undefined) {
            this.state.unsetBit(unsetMineRow * this.cols + unsetMineCol);
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
            this.state.setBit(randomRow * this.cols + randomCol);
        }
    }

    private random(from: number, to: number): number {
        return Math.floor(Math.random() * to) + from;
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

    // private encodeState(): void {
    //     const p: Pair = {
    //         a: 92215,
    //         b: 9223
    //     };

    //     console.log("Cantor");
    //     const cantorEncoded = CantorEncoder.encode(p);
    //     const cantorDecoded = CantorEncoder.decode(cantorEncoded);
    //     console.log(cantorEncoded);
    //     console.log(cantorDecoded);

    //     console.log("Szudzik");
    //     const szudzikEncoded = SzudzikEncoder.encode(p);
    //     const szudzikDecoded = SzudzikEncoder.decode(szudzikEncoded);        
    //     console.log(szudzikEncoded);
    //     console.log(szudzikDecoded);

    //     console.log("Peter");
    //     const peterEncoded = PeterEncoder.encode(p);
    //     const peterDecoded = PeterEncoder.decode(peterEncoded);
    //     console.log(peterEncoded);
    //     console.log(peterDecoded);

    //     console.log("Morton");
    //     const mortonEncoded = MortonEncoder.encode(p);
    //     const mortonDecoded = MortonEncoder.decode(mortonEncoded);
    //     console.log(mortonEncoded);
    //     console.log(mortonDecoded);

    //     const encoded = BinaryEncoder.encode(this.state);
    //     const decoded = BinaryEncoder.decode(encoded);
    // }
}
