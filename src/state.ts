type bit = 0 | 1;

export class State {

    private data: Array<bit> = [];

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.data[i] = 0;
        }
    }

    public isHighBit(index: number): boolean {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        return this.data[index] == 1;
    }

    public setBit(index: number): void {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        this.data[index] = 1;
    }

    public unsetBit(index: number): void {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        this.data[index] = 0;
    }

}
