import { Board } from "./board";

export class Cell {

    private value: number | null = null;
    private el: HTMLElement;
    private flagged: boolean = false;

    constructor(private board: Board, private row: number, private col: number) {}

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

    public setElement(el: HTMLElement) {
        this.el = el;
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

    public isRevealed(): boolean {
        return this.getValue() != null && this.getValue() > -1;
    }

    public reveal(): void {
        if (this.isRevealed() || this.flagged) return;

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

        if (this.value > 0) {
            this.el.innerHTML = this.getValue().toString();
            return;
        }

        for (let adj of adjacent) {
            adj.reveal();
        }
    }

    private toggleFlag(): void {
        if (this.isRevealed()) return;

        if (this.flagged) {
            this.flagged = false;
            this.el.classList.remove("flagged");
        } else {
            this.flagged = true;
            this.el.classList.add("flagged");
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
                this.toggleFlag();
                break;
        }
    }

    public toString(): string {
        return this.value ? this.value.toString() : "";
    }
}