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
        this.state = State.Default;
    }

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

    public setElement(el: HTMLElement) {
        this.el = el;
        this.el.classList.add(`state-${this.state}`);
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

    public reveal(): void {
        if (this.state != State.Default) return;

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.value = 0;
        let adjacent = this.board.getAdjacentCells(this);
        for (let adj of adjacent) {
            if (adj.isMine()) this.value++;
        }

        this.el.classList.add("revealed");
        this.state = State.Revealed;

        if (this.value > 0) {
            this.el.innerHTML = this.getValue().toString();
            return;
        }

        for (let adj of adjacent) {
            adj.reveal();
        }
    }

    private mark(): void {
        if (this.state == State.Revealed) return;

        this.el.classList.remove(`state-${this.state}`);

        switch (this.state) {
            case State.Default:
                this.state = State.Flagged;
                break;
            case State.Flagged:
                this.state = State.Questioned;
                break;
            case State.Questioned:
                this.state = State.Default;
                break;
        }

        this.el.classList.add(`state-${this.state}`);
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