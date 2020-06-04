import { Cell } from "./cell";
import { Mode, FIRST_CLICK } from "./config";
import { State } from "./state";
import {
    EVENT_CELL_CLICKED,
    EVENT_CELL_REVEALED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    PubSub,
} from "./util/pub-sub";
import { Session } from "./util/session";

interface EventSubscriber {
    event: string;
    subscriber: {
        (data?: any): any
    }
}

export class Board {

    private grid: Cell[][];

    private revealedCounter: number = 0;

    private eventSubscribers: EventSubscriber[] = [
        { event: EVENT_CELL_CLICKED, subscriber: this.secureSafeArea.bind(this) },
        { event: EVENT_CELL_REVEALED, subscriber: this.calculateCellValue.bind(this) },
        { event: EVENT_CELL_REVEALED, subscriber: this.incrementRevealed.bind(this) },
    ];

    constructor(
        private mode: Mode,
        private state: State,
    ) {
        this.initGrid();
        this.plantMines();
        this.subscribe();
    }

    private subscribe(): void {
        this.eventSubscribers.forEach((es: EventSubscriber) => PubSub.subscribe(es.event, es.subscriber))
    }

    public unsubscribe(): void {
        this.eventSubscribers.forEach((es: EventSubscriber) => PubSub.unsubscribe(es.event, es.subscriber))
    }

    public getMode(): Mode {
        return this.mode;
    }

    public getState(): State {
        if (this.state) {
            return this.state;
        }

        const state = new State(this.mode.rows * this.mode.cols);

        for (let row = 0; row < this.mode.rows; row++) {
            for (let col = 0; col < this.mode.cols; col++) {
                if (this.grid[row][col].isMine()) {
                    state.setBit(row * this.mode.cols + col);
                }
            }
        }

        return state;
    }

    public getMines(): number {
        return this.mode.mines;
    }

    private initGrid(): void {
        this.grid = [];
        for (let i = 0; i < this.mode.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.mode.cols; j++) {
                this.grid[i][j] = new Cell(i, j);
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
        let count = 0;
        while (count < this.mode.mines) {
            const row = this.random(0, this.mode.rows);
            const col = this.random(0, this.mode.cols);

            if (!this.grid[row][col].isMine()) {
                this.grid[row][col].setMine()
                count++;
            }
        }
    }

    /**
     * Replants a mine to a new randomly-generated row and column.
     * The new position should not be lying in the safe area
     * defined by a center cell and a radius (distance).
     * The distance is defined by the configuration for first click.
     * 
     * @param centerRow Center row of the safe area
     * @param centerCol Center column of the safe area
     */
    private replantMine(centerRow: number, centerCol: number): void {
        const randomRow = this.random(0, this.mode.rows);
        const randomCol = this.random(0, this.mode.cols);
        const distance = Session.get("firstClick") as number;

        const outOfSafeArea =
            (randomRow > centerRow + distance || randomRow < centerRow - distance) &&
            (randomCol > centerCol + distance || randomCol < centerCol - distance);

        if (outOfSafeArea && !this.grid[randomRow][randomCol].isMine()) {
            this.grid[randomRow][randomCol].setMine();
            return;
        }

        this.replantMine(centerRow, centerCol);
    }

    private random(from: number, to: number): number {
        return Math.floor(Math.random() * to) + from;
    }

    public draw(boardEl: HTMLElement): void {
        // Remove existing cells (on reset/replay)
        boardEl.textContent = "";

        this.grid.forEach(row => {
            row.forEach(cell => boardEl.append(cell.getElement()))
        });
    }

    private secureSafeArea(cell: Cell): void {
        if (!Session.get("gameStarted", false) && Session.get("applyFirstClickRule")) {
            this.makeSafeArea(cell);
        }
    }

    private makeSafeArea(centerCell: Cell): void {
        if (centerCell.isMine()) {
            centerCell.unsetMine();
            this.replantMine(centerCell.getRow(), centerCell.getCol());
        }

        if (Session.get("firstClick") === FIRST_CLICK.GuaranteedCascade) {
            const adjacentCells = this.getAdjacentCells(centerCell.getRow(), centerCell.getCol());
            for (const adj of adjacentCells) {
                if (adj.isMine()) {
                    adj.unsetMine();
                    this.replantMine(centerCell.getRow(), centerCell.getCol());
                }
            }
        }

        PubSub.publish(EVENT_SAFE_AREA_CREATED);
    }

    private calculateCellValue(cell: Cell): void {
        const adjacentCells = this.getAdjacentCells(cell.getRow(), cell.getCol());
        let value = 0;
        for (let adj of adjacentCells) {
            if (adj.isMine()) {
                value++;
            }
        }

        cell.setValue(value);

        if (value == 0) {
            this.revealCellAdjacentCells(adjacentCells);
        }
    }

    private revealCellAdjacentCells(adjacentCells: Cell[]): void {
        adjacentCells.forEach(adj => adj.reveal());
    }

    private getAdjacentCells(row: number, col: number): Cell[] {
        const adj: Cell[] = [];

        for (let i = Math.max(row - 1, 0); i <= Math.min(row + 1, this.mode.rows - 1); i++) {
            for (let j = Math.max(col - 1, 0); j <= Math.min(col + 1, this.mode.cols - 1); j++) {
                // Skip current cell
                if (i == row && j == col) continue;

                adj.push(this.grid[i][j]);
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

    public deactivateCells(): void {
        for (let i = 0; i < this.mode.rows; i++) {
            for (let j = 0; j < this.mode.cols; j++) {
                const cell = this.grid[i][j];
                cell.getElement().removeEventListener("click", cell);
                cell.getElement().removeEventListener("contextmenu", cell);
                cell.getElement().addEventListener("contextmenu", e => e.preventDefault());
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
