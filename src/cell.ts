import { Board } from "./board";
import { FIRST_CLICK } from "./config";
import {
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    PubSub
} from "./util/pub-sub";

enum CellState {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed",
    Exploаded = "exploaded",
    WronglyFlagged = "wronglyFlagged",
}

const MINE_CONTENT = "<span class=\"mine\"></span>";
const MINE_CONTENT_DEBUG = "<span class=\"mine debug\"></span>";

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: CellState;
    private adjacentCells: Cell[] = [];

    constructor(private board: Board, private row: number, private col: number) {
        this.value = -2;
        this.createHTMLElement();
        this.setState(CellState.Default);
    }

    private setValue(value: number): void {
        this.value = value;
        this.el.classList.add(`cell-value-${this.value.toString()}`);
    }

    private createHTMLElement(): void {
        this.el = document.createElement("li");
        this.el.classList.add("cell");
        this.el.addEventListener("click", this);
        this.el.addEventListener("contextmenu", this);
    }

    public getElement(): HTMLElement {
        return this.el;
    }

    private getState(): CellState {
        return this.state;
    }

    private setState(state: CellState): void {
        this.el.classList.remove(`state-${this.getState()}`);
        this.el.classList.add(`state-${state}`);
        this.state = state;
    }

    public setMine(): number {
        if (!this.isMine()) {
            this.value = -1;

            if (this.board.getGame().getConfig().debug === true) {
                this.setContent(MINE_CONTENT_DEBUG);
            }

            return 1;
        }

        return 0;
    }

    public unsetMine(centerRow: number, centerCol: number): void {
        if (this.isMine()) {
            this.value = -2;
            this.setContent("");
            this.board.removeFromState(this.row, this.col);
            this.board.replantMine(centerRow, centerCol);
        }
    }

    public isMine(): boolean {
        return this.value == -1;
    }

    public isFlagged(): boolean {
        return this.getState() === CellState.Flagged;
    }

    public setWronglyFlagged(): void {
        this.setState(CellState.WronglyFlagged);
        this.setContent(MINE_CONTENT);
    }

    private setContent(content: string): void {
        this.el.innerHTML = content;
    }

    private getAdjacentCells(): Cell[] {
        if (this.adjacentCells.length === 0) {
            this.adjacentCells = this.board.getAdjacentCells(this.row, this.col);
        }

        return this.adjacentCells;
    }

    private reveal(): void {
        if (this.getState() !== CellState.Default) return;

        if (!this.board.getGame().isStarted() && !this.board.getGame().skipFirstClickCheck()) {
            this.makeSafeArea();
        }

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.setState(CellState.Revealed);
        PubSub.publish(EVENT_CELL_REVEALED, this);

        this.calculateValue();

        if (this.value === 0) {
            this.revealAdjacentCells();
        } else {
            this.setContent(this.value.toString());
        }
    }

    private makeSafeArea(): void {
        this.unsetMine(this.row, this.col);

        if (this.board.getGame().getConfig().firstClick === FIRST_CLICK.GuaranteedCascade) {
            for (const adj of this.getAdjacentCells()) {
                adj.unsetMine(this.row, this.col);
            }
        }

        PubSub.publish(EVENT_SAFE_AREA_CREATED);
    }

    private explode(): void {
        this.setState(CellState.Exploаded);
        PubSub.publish(EVENT_GAME_OVER);
    }

    private calculateValue(): void {
        let value = 0;
        for (let adj of this.getAdjacentCells()) {
            if (adj.isMine()) {
                value++;
            }
        }

        this.setValue(value);
    }

    private revealAdjacentCells(): void {
        for (const adj of this.getAdjacentCells()) {
            adj.reveal();
        }
    }

    public revealMine(): void {
        // Leave flags
        if (this.getState() === CellState.Flagged) return;

        // Reveal not exploaded mines
        if (this.getState() !== CellState.Exploаded) {
            this.setState(CellState.Revealed)
        }

        this.setContent(MINE_CONTENT);
    }

    public revealFlag(): void {
        if (this.getState() === CellState.Default) {
            this.mark();
        }

        if (this.getState() === CellState.Questioned) {
            // :)
            this.mark();
            this.mark();
        }
    }

    private mark(): void {
        if (this.getState() == CellState.Revealed) return;

        switch (this.getState()) {
            case CellState.Default:
                this.setState(CellState.Flagged);
                PubSub.publish(EVENT_CELL_FLAGGED)
                break;
            case CellState.Flagged:
                this.setState(CellState.Questioned);
                PubSub.publish(EVENT_CELL_UNFLAGGED);
                break;
            case CellState.Questioned:
                this.setState(CellState.Default);
                break;
        }
    }

    public handleEvent(e: Event) {
        switch (e.type) {
            case "click":
                if (!this.board.getGame().checkIsOver()) {
                    this.reveal();
                }
                break;
            case "contextmenu":
                e.preventDefault();
                if (!this.board.getGame().checkIsOver()) {
                    this.mark();
                }
                break;
        }
    }
}
