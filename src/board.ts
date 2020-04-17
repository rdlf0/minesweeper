import { Cell } from "./cell";
import { Mode } from "./config";
import { Game } from "./game";
import { State } from "./state";
import {
    EVENT_CELL_REVEALED,
    EVENT_GAME_OVER,
    PubSub
} from "./util/pub-sub";

interface subscriptionPair {
    event: string;
    function: {
        (data?: any): any
    }
}

export class Board {

    private grid: Cell[][];

    private revealedCounter: number = 0;

    private eventSubscribers: subscriptionPair[] = [
        { event: EVENT_CELL_REVEALED, function: this.incrementRevealed.bind(this) }
    ];

    constructor(
        private game: Game,
        private mode: Mode,
        private state: State
    ) {
        this.initGrid();
        this.plantMines();
        this.subscribe();
    }

    private subscribe(): void {
        this.eventSubscribers.slice(0).forEach((p: subscriptionPair) => PubSub.subscribe(p.event, p.function))
    }

    public unsubscribe(): void {
        this.eventSubscribers.slice(0).forEach((p: subscriptionPair) => PubSub.unsubscribe(p.event, p.function))
    }

    public getGame(): Game {
        return this.game;
    }

    public getState(): State {
        return this.state;
    }

    public getMines(): number {
        return this.mode.mines;
    }

    private initGrid(): void {
        this.grid = [];
        for (let i = 0; i < this.mode.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.mode.cols; j++) {
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
        for (let i = 0; i < this.mode.rows * this.mode.cols; i++) {
            if (this.state.isHighBit(i)) {
                const row = Math.floor(i / this.mode.cols);
                const col = i % this.mode.cols;
                this.grid[row][col].setMine();
            }
        }
    }

    private plantMinesRandomly(): void {
        this.state = new State(this.mode.rows * this.mode.cols);

        let count = 0;
        while (count < this.mode.mines) {
            const row = this.random(0, this.mode.rows);
            const col = this.random(0, this.mode.cols);
            const planted = this.grid[row][col].setMine();
            if (planted === 1) {
                count++;
                this.state.setBit(row * this.mode.cols + col);
            }
        }
    }

    public removeFromState(row: number, col: number): void {
        this.state.unsetBit(row * this.mode.cols + col);
    }

    /**
     * Replants a mine to a new randomly-generated row and column.
     * The new position should not be lying in the safe area
     * defuned by a center cell and a radius (distance).
     * The distance is defined by the configuration for first click.
     * 
     * @param centerRow Center row of the safe area
     * @param centerCol Center column of the safe area
     */
    public replantMine(centerRow: number, centerCol: number): void {
        const randomRow = this.random(0, this.mode.rows);
        const randomCol = this.random(0, this.mode.cols);
        const distance = this.getGame().getConfig().firstClick;

        const outOfSafeArea = (randomRow > centerRow + distance || randomRow < centerRow - distance)
            && (randomCol > centerCol + distance || randomCol < centerCol - distance);

        if (!outOfSafeArea || this.grid[randomRow][randomCol].setMine() === 0) {
            this.replantMine(centerRow, centerCol);
        } else {
            this.state.setBit(randomRow * this.mode.cols + randomCol);
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

        for (let i = 0; i < this.mode.rows; i++) {
            const row = document.createElement("li");
            row.classList.add("row");
            rowsContainer.append(row);

            const colsContainer = document.createElement("ul");
            colsContainer.classList.add("cols-container");
            row.append(colsContainer);

            for (let j = 0; j < this.mode.cols; j++) {
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

                if (i >= 0 && i < this.mode.rows && j >= 0 && j < this.mode.cols) {
                    adj.push(this.grid[i][j]);
                }
            }
        }

        return adj;
    }

    public revealMines(win: boolean): void {
        for (let i = 0; i < this.mode.rows; i++) {
            for (let j = 0; j < this.mode.cols; j++) {
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

    private incrementRevealed(): void {
        this.revealedCounter++;
        this.checkForWin();
    }

    private checkForWin(): void {
        if (this.revealedCounter === this.mode.rows * this.mode.cols - this.mode.mines) {
            PubSub.publish(EVENT_GAME_OVER, true);
        }
    }
}
