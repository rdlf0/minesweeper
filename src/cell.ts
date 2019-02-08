import { Board } from "./board";

enum State {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed",
    Exploаded = "exploaded",
    WronglyFlagged = "wronglyFlagged",
};

const MINE_CONTENT = "<span class=\"mine\"></span>";

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: State;

    constructor(private board: Board, private row: number, private col: number) {
        this.value = -2;
        this.createHTMLElement();
        this.setState(State.Default);
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

            if (this.board.getGame().isDebugEnabled()) {
                this.setContent(MINE_CONTENT);
            }

            return 1;
        }

        return 0;
    }

    private unsetMine(): void {
        if (this.isMine()) {
            this.value = -2;
            this.setContent("");
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

    private reveal(): void {
        if (this.getState() != State.Default) return;

        if (this.isMine()) {
            this.explode();
            return;
        }

        if (!this.board.getGame().isStarted()) {
            this.board.getGame().start();
        }

        this.board.incrementRevealed();

        this.setState(State.Revealed);

        this.value = 0;
        let adjacent = this.board.getAdjacentCells(this.row, this.col);
        for (let adj of adjacent) {
            if (adj.isMine()) this.value++;
        }

        if (this.value > 0) {
            this.setContent(this.value.toString());
            this.el.classList.add(`cell-value-${this.value.toString()}`);
            return;
        }

        for (let adj of adjacent) {
            adj.reveal();
        }
    }

    public revealMine(): void {
        if (this.getState() === State.Flagged) return;

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

    private explode(): void {
        // Mine-free first click
        if (!this.board.getGame().isStarted()) {
            this.unsetMine();
            this.board.replantMine(this.row, this.col);
            this.reveal();
            return;
        }

        this.setState(State.Exploаded);
        this.board.getGame().gameOver();
    }

    public handleEvent(e: Event) {
        switch (e.type) {
            case "click":
                if (!this.board.getGame().isOver()) {
                    this.reveal();
                }
                break;
            case "contextmenu":
                e.preventDefault();
                if (!this.board.getGame().isOver()) {
                    this.mark();
                }
                break;
        }
    }
}