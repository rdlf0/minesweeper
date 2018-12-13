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

    public draw(container: HTMLElement): void {
        let board = document.createElement("div");
        board.id = "board";

        let rowsContainer = document.createElement("ul");
        rowsContainer.id = "rows-container";

        for (let i = 0; i < this.rows; i++) {
            let row = document.createElement("li");
            row.classList.add("row");

            let cellsContainer = document.createElement("ul");
            cellsContainer.classList.add("cells-container");

            for (let j = 0; j < this.cols; j++) {
                let cell = document.createElement("li");
                cell.classList.add("cell")
                cell.innerHTML = this.grid[i][j].toString();

                cellsContainer.append(cell);
            }

            row.append(cellsContainer);
            rowsContainer.append(row);
        }

        board.append(rowsContainer);
        container.append(board);
    }
}