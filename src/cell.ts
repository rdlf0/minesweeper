import { Board } from "./board";
import { FIRST_CLICK } from "./config";

enum State {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed",
    Exploаded = "exploaded",
    WronglyFlagged = "wronglyFlagged",
};

const MINE_CONTENT = "<span class=\"mine\"></span>";
const MINE_CONTENT_DEBUG = "<span class=\"mine debug\"></span>";

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: State;
    private adjacentCells: Cell[] = [];

    constructor(private board: Board, private row: number, private col: number) {
        this.value = -2;
        this.createHTMLElement();
        this.setState(State.Default);
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

    private getState(): State {
        return this.state;
    }

    private setState(state: State): void {
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
            this.board.replantMine(centerRow, centerCol, this.row, this.col);
        }
    }

    public isMine(): boolean {
        return this.value == -1;
    }

    public isFlagged(): boolean {
        return this.getState() === State.Flagged;
    }

    public setWronglyFlagged(): void {
        this.setState(State.WronglyFlagged);
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
        if (this.getState() !== State.Default) return;

        const isFirstClick = this.board.getGame().isStarted() === false;
        if (isFirstClick) {
            this.board.getGame().start();
            if (!this.board.getGame().checkIsReplay()) {
                this.makeSafeArea();
            }
        }

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.setState(State.Revealed);
        this.board.incrementRevealed();

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
        };

        // Temporary solution until some kind of publish/subscribe get implemented
        this.board.getGame().updateHash();
    }

    private explode(): void {
        this.setState(State.Exploаded);
        this.board.getGame().gameOver();
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
        if (this.getState() === State.Flagged) return;

        // Reveal not exploaded mines
        if (this.getState() !== State.Exploаded) {
            this.setState(State.Revealed)
        };

        this.setContent(MINE_CONTENT);
    }

    public revealFlag(): void {
        if (this.getState() === State.Default) {
            this.mark();
        }

        if (this.getState() === State.Questioned) {
            // :)
            this.mark();
            this.mark();
        }
    }

    private mark(): void {
        if (this.getState() == State.Revealed) return;

        switch (this.getState()) {
            case State.Default:
                this.setState(State.Flagged);
                this.board.getGame().incrementFlags(1);
                break;
            case State.Flagged:
                this.setState(State.Questioned);
                this.board.getGame().incrementFlags(-1);
                break;
            case State.Questioned:
                this.setState(State.Default);
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
