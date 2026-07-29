import { Cell } from "./cell.js";
import { Mode, FIRST_CLICK, HINT_MODE } from "./config.js";
import { State } from "./state.js";
import { solve, CellView } from "./solver/minesweeperSolver.js";
import {
    EVENT_CELL_CLICKED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_REVEALED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    PubSub,
} from "./util/pub-sub.js";
import { Session } from "./util/session.js";

interface EventSubscriber {
    event: string;
    subscriber: {
        (data?: any): any
    }
}

export class Board {

    private grid: Cell[][];

    private revealedCounter: number = 0;

    private hintedCells: Cell[] = [];

    private hintHovers: { cell: Cell; enter: () => void; leave: () => void; refs: { cell: Cell; kind: string }[] }[] = [];

    /** The hints from the last solve, in the order the hint button steps through them.
     * Carries the explanation so it can be surfaced without a hover. */
    private hints: { cell: Cell; reason: string; refs: { cell: Cell; kind: string }[] }[] = [];

    /** Index into `hints` currently being explained, or -1 when none is. */
    private focusedHint: number = -1;

    // Whether the currently shown hints are mines (cleared on flag) rather than
    // safe cells (cleared on reveal).
    private hintDanger: boolean = false;

    private eventSubscribers: EventSubscriber[] = [
        { event: EVENT_CELL_CLICKED, subscriber: this.secureSafeArea.bind(this) },
        { event: EVENT_CELL_CLICKED, subscriber: this.clearHintsOnReveal.bind(this) },
        { event: EVENT_CELL_FLAGGED, subscriber: this.clearHintsOnFlag.bind(this) },
        { event: EVENT_CELL_REVEALED, subscriber: this.calculateCellValue.bind(this) },
        { event: EVENT_CELL_REVEALED, subscriber: this.incrementRevealed.bind(this) },
        { event: EVENT_GAME_OVER, subscriber: this.clearHints.bind(this) },
    ];

    constructor(
        private mode: Mode,
        private state: State | null,
        private el: HTMLElement,
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
        const state = this.state;
        if (state == null) {
            return;
        }

        for (let i = 0; i < this.mode.rows * this.mode.cols; i++) {
            if (state.isHighBit(i)) {
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

    public draw(): void {
        // Remove existing cells (on reset/replay)
        this.el.textContent = "";

        this.grid.forEach(row => {
            row.forEach(cell => this.el.append(cell.getElement()))
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

    public revealMines(win: boolean): void { // nosonar
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
                this.grid[i][j].deactivate();
            }
        }
    }

    public showHint(mode: HINT_MODE): number {
        this.clearHints();

        const view: CellView[][] = this.grid.map(row =>
            row.map(cell => ({
                revealed: cell.isRevealed(),
                flagged: cell.isFlagged(),
                value: cell.isRevealed() ? cell.getValue() : 0,
            }))
        );

        const result = solve(view);
        const danger = mode === HINT_MODE.Mines;
        this.hintDanger = danger;
        const cells = danger ? result.mines : result.safe;
        for (const { row, col, reason, references } of cells) {
            const cell = this.grid[row][col];
            cell.setHint(reason, danger);
            this.hintedCells.push(cell);

            const refs = references.map(([r, c], i) => ({
                cell: this.grid[r][c],
                kind: i === 0 ? "a" : "b",
            }));
            const enter = () => refs.forEach(({ cell, kind }) => cell.addReference(kind));
            const leave = () => {
                refs.forEach(({ cell }) => cell.clearReference());
                // Hovering away shouldn't strip the references of the focused hint.
                this.applyFocusReferences();
            };
            const el = cell.getElement();
            el.addEventListener("mouseenter", enter);
            el.addEventListener("mouseleave", leave);
            this.hintHovers.push({ cell, enter, leave, refs });
            this.hints.push({ cell, reason, refs });
        }

        return cells.length;
    }

    public getHintCount(): number {
        return this.hints.length;
    }

    /** Marks one hint as the one being explained, lights the cells its deduction rests on,
     * and returns its explanation plus the row it sits on, so the caller can keep its
     * message from covering it. Wraps, so the caller can just keep incrementing. */
    public focusHint(index: number): { reason: string; row: number } | null {
        if (this.hints.length === 0) {
            return null;
        }

        this.hints.forEach(hint => {
            hint.cell.setHintFocus(false);
            hint.refs.forEach(ref => ref.cell.clearReference());
        });

        this.focusedHint = index % this.hints.length;
        const hint = this.hints[this.focusedHint];
        hint.cell.setHintFocus(true);
        this.applyFocusReferences();

        return { reason: hint.reason, row: hint.cell.getRow() };
    }

    private applyFocusReferences(): void {
        if (this.focusedHint < 0 || this.focusedHint >= this.hints.length) {
            return;
        }

        this.hints[this.focusedHint].refs.forEach(({ cell, kind }) => cell.addReference(kind));
    }

    private clearHintsOnReveal(): void {
        this.clearHints();
    }

    private clearHintsOnFlag(): void {
        if (this.hintDanger) {
            this.clearHints();
        }
    }

    public clearHints(): void {
        this.hintedCells.forEach(cell => cell.clearHint());
        this.hintedCells = [];
        this.hints = [];
        this.focusedHint = -1;

        this.hintHovers.forEach(({ cell, enter, leave, refs }) => {
            const el = cell.getElement();
            el.removeEventListener("mouseenter", enter);
            el.removeEventListener("mouseleave", leave);
            refs.forEach(ref => ref.cell.clearReference());
        });
        this.hintHovers = [];
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
