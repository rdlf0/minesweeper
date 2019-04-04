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

            if (this.board.getGame().config.debug === true) {
                this.setContent(MINE_CONTENT_DEBUG);
            }

            return 1;
        }

        return 0;
    }

    public unsetMine(): void {
        if (this.isMine()) {
            this.value = -2;
            this.setContent("");
            this.board.replantMine(this.row, this.col);
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

        let gameStarted: boolean = this.board.getGame().isStarted();

        if (this.isMine()) {
            if (gameStarted) {
                this.explode();
                return;
            } else {
                this.unsetMine();
            }
        }

        this.setState(State.Revealed);
        this.board.incrementRevealed();

        this.value = 0;
        let adjacent = this.board.getAdjacentCells(this.row, this.col);
        for (let adj of adjacent) {
            if (adj.isMine()) {
                if (this.board.getGame().config.firstClick === FIRST_CLICK.GuaranteedCascade) {
                    gameStarted ? this.value++ : adj.unsetMine();
                } else {
                    this.value++;
                }
            }
        }

        if (this.value > 0) {
            this.setContent(this.value.toString());
            this.el.classList.add(`cell-value-${this.value.toString()}`);
            return;
        }

        if (!gameStarted) {
            this.board.getGame().start();
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