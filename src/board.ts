import { Cell } from "./cell";
import { Game } from "./game";

export class Board {
    private grid: Cell[][];
    private flags: number = 0;

    constructor(
        private game: Game,
        private rows: number,
        private cols: number,
        private mines: number,
        private debug: boolean = false
    ) {
        this.initGrid();
        this.plantMines();
        this.game.updateMinesCounter(this.flags);
    }

    public initGrid(): void {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = new Cell(this, i, j);
            }
        }
    }

    public incrementFlags(value: number): void {
        this.flags += value;
        this.game.updateMinesCounter(this.flags);
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

    public draw(board: HTMLElement): void {
        board.innerHTML = "";

        let rowsContainer = document.createElement("ul");
        rowsContainer.id = "rows-container";
        board.append(rowsContainer);

        for (let i = 0; i < this.rows; i++) {
            let row = document.createElement("li");
            row.classList.add("row");
            rowsContainer.append(row);

            let colsContainer = document.createElement("ul");
            colsContainer.classList.add("cols-container");
            row.append(colsContainer);

            for (let j = 0; j < this.cols; j++) {
                let cellObj = this.grid[i][j];
                let cell = document.createElement("li");
                cell.classList.add("cell")
                cell.addEventListener("click", cellObj)
                cell.addEventListener("contextmenu", cellObj)
                colsContainer.append(cell);

                cellObj.setElement(cell);

                if (this.debug) {
                    if (cellObj.isMine()) {
                        cell.innerHTML = "<span class=\"mine\"></span>";
                    }
                }
            }
        }
    }

    public getAdjacentCells(cell: Cell): Cell[] {
        let adj: Cell[] = [];

        for (let i = cell.getRow() - 1; i <= cell.getRow() + 1; i++) {
            for (let j = cell.getCol() - 1; j <= cell.getCol() + 1; j++) {
                // Don't check current cell
                if (i == cell.getRow() && j == cell.getCol()) continue;

                if (i >= 0 && i < this.rows && j >= 0 && j < this.cols) {
                    adj.push(this.grid[i][j]);
                }
            }
        }

        return adj;
    }
}