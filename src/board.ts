import { Cell } from "./cell";

export class Board {
    private grid: Cell[][];
    private debug: boolean = false;

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

    public enableDebug() {
        this.debug = true;
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
        container.append(board);

        let rowsContainer = document.createElement("ul");
        rowsContainer.id = "rows-container";
        board.append(rowsContainer);

        for (let i = 0; i < this.rows; i++) {
            let row = document.createElement("li");
            row.classList.add("row");
            rowsContainer.append(row);

            let cellsContainer = document.createElement("ul");
            cellsContainer.classList.add("cells-container");
            row.append(cellsContainer);

            for (let j = 0; j < this.cols; j++) {
                let cellObj = this.grid[i][j];
                let cell = document.createElement("li");
                cell.classList.add("cell")
                if (this.debug) {
                    cell.innerHTML = cellObj.toString();
                }                
                cell.addEventListener("click", () => {
                    cellObj.reveal(this.grid, i, j);
                })

                cellObj.setElement(cell);
                cellsContainer.append(cell);
            }   
        }
    }
}