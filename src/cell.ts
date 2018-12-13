export class Cell {

    private value = 0;

    constructor() {

    }

    public setValue(value: number): void {
        this.value = value;
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

    public toString(): string {
        return this.value.toString();
    }
}