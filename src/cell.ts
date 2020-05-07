import { Game } from "./game";
import {
    EVENT_CELL_CLICKED,
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    PubSub,
} from "./util/pub-sub";

enum CellState {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed",
    RevealedMine = "revealedMine",
    Exploаded = "exploaded",
    WronglyFlagged = "wronglyFlagged",
}

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: CellState;

    constructor(private game: Game, private row: number, private col: number) {
        this.value = -2;
        this.createHTMLElement();
        this.setState(CellState.Default);
    }

    public setValue(value: number): void {
        this.value = value;
        this.el.classList.add(`cell-value-${this.value.toString()}`);
    }

    private createHTMLElement(): void {
        this.el = document.createElement("div");
        this.el.classList.add("cell");
        this.el.addEventListener("click", this);
        this.el.addEventListener("contextmenu", this);
    }

    public getRow(): number {
        return this.row;
    }

    public getCol(): number {
        return this.col;
    }

    public getElement(): HTMLElement {
        return this.el;
    }

    private setState(state: CellState): void {
        this.el.classList.remove(`state-${this.state}`);
        this.el.classList.add(`state-${state}`);
        this.state = state;
    }

    public setMine(): void {
        this.value = -1;

        if (this.game.getConfig().debug === true) {
            this.el.classList.add("debug-mine");
        }
    }

    public unsetMine(): void {
        this.value = -2;
        this.el.classList.remove("debug-mine");
    }

    public isMine(): boolean {
        return this.value == -1;
    }

    public isFlagged(): boolean {
        return this.state === CellState.Flagged;
    }

    public setWronglyFlagged(): void {
        this.setState(CellState.WronglyFlagged);
    }

    public reveal(): void {
        if (this.state !== CellState.Default) return;

        PubSub.publish(EVENT_CELL_CLICKED, this);

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.setState(CellState.Revealed);
        PubSub.publish(EVENT_CELL_REVEALED, this);
    }

    private explode(): void {
        this.setState(CellState.Exploаded);
        PubSub.publish(EVENT_GAME_OVER);
    }

    public revealMine(): void {
        // Leave flags
        if (this.state === CellState.Flagged) return;

        // Reveal not exploaded mines
        if (this.state !== CellState.Exploаded) {
            this.setState(CellState.RevealedMine)
        }
    }

    public revealFlag(): void {
        if (this.state === CellState.Default) {
            this.mark();
        } else if (this.state === CellState.Questioned) {
            // :)
            this.mark();
            this.mark();
        }
    }

    private mark(): void {
        if (this.state == CellState.Revealed) return;

        switch (this.state) {
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
                if (!this.game.checkIsOver()) {
                    this.reveal();
                }
                break;
            case "contextmenu":
                e.preventDefault();
                if (!this.game.checkIsOver()) {
                    this.mark();
                }
                break;
        }
    }
}
