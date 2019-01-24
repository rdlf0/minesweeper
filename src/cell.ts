import { Board } from "./board";

enum State {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed"
};

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: State;

    constructor(private board: Board, private row: number, private col: number) {
        this.value = -2;
    }

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

    public setElement(el: HTMLElement) {
        this.el = el;
        this.setState(State.Default);
    }

    public getState(): State {
        return this.state;
    }

    public setState(state: State): void {
        this.el.classList.remove(`state-${this.getState()}`);
        this.el.classList.add(`state-${state}`);
        this.state = state;
    }

    public getRow(): number {
        return this.row;
    }

    public getCol(): number {
        return this.col;
    }

    public setMine(): number {
        if (!this.isMine()) {
            this.setValue(-1);
            return 1;
        }

        return 0;
    }

    public isMine(): boolean {
        return this.value == -1;
    }

    private reveal(): void {
        if (this.getState() != State.Default) return;

        this.board.getGame().start();

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.value = 0;
        let adjacent = this.board.getAdjacentCells(this);
        for (let adj of adjacent) {
            if (adj.isMine()) this.value++;
        }

        this.setState(State.Revealed);

        if (this.value > 0) {
            this.el.innerHTML = this.getValue().toString();
            return;
        }

        for (let adj of adjacent) {
            adj.reveal();
        }
    }

    private mark(): void {
        if (this.getState() == State.Revealed) return;

        switch (this.getState()) {
            case State.Default:
                this.setState(State.Flagged);
                this.board.incrementFlags(1);
                break;
            case State.Flagged:
                this.setState(State.Questioned);
                this.board.incrementFlags(-1);
                break;
            case State.Questioned:
                this.setState(State.Default);
                break;
        }
    }

    // To-do
    private explode() {
        alert("BOOM!");
    }

    public handleEvent(e: Event) {
        switch (e.type) {
            case "click":
                this.reveal();
                break;
            case "contextmenu":
                e.preventDefault();
                this.mark();
                break;
        }
    }
}