export class Board {
    constructor(private rows: number, private cols: number) { }

    public printBoard(): string {
        return `This board has ${this.rows} rows and ${this.cols} cols.`;
    }
}