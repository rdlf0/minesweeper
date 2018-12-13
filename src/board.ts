import { Cell } from "./cell";

export class Board {
    private grid: Cell[][];

    constructor(private rows: number, private cols: number, private mines: number) {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = new Cell();
            }
        }

        this.plantMines();
    }

    private plantMines(): void {
        let count = 0;

        while (count < this.mines) {
            count += this.grid[this.random(0, this.rows)][this.random(0, this.cols)].setMine();
        }
    }

    private random(from: number, to: number): number {
        return Math.floor(Math.random() * to) + from;
    }

    public printBoard(): string {
        let msg = `Here is the generated board:<br />Rows: ${this.rows} | Cols: ${this.cols} | Mines: ${this.mines}<br /><br /><pre>`;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                msg += String("  " + this.grid[i][j]).slice(-2) + "  ";
            }
            msg += "<br /><br />";
        }
        msg += "</pre>";

        return msg;
    }
}