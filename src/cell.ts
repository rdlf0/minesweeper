export class Cell {

    private value: number | null = null;
    private el: HTMLElement;

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

    public setElement(el: HTMLElement) {
        this.el = el;
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

    public reveal(grid: Cell[][], row: number, col: number): void {
        // If already revealed
        if (this.getValue() != null) {
            return;
        }

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.value = 0;
        let adjacent = this.getAdjacentCells(grid, row, col);

        for (let adj of adjacent) {
            if (adj.getCell().isMine()) this.value++;
        }

        this.el.innerHTML = this.toString();
        this.el.classList.add("revealed");

        if (this.value > 0) {
            return;
        }

        for (let adj of adjacent) {
            adj.getCell().reveal(grid, adj.getRow(), adj.getCol());
        }
    }

    // To-do
    private explode() { }

    public getAdjacentCells(grid: Cell[][], row: number, col: number): Adjacent[] {
        let adj: Adjacent[] = [];
        let rows = grid.length;
        let cols = grid[0].length;

        for (let i = row - 1; i <= row + 1; i++) {
            for (let j = col - 1; j <= col + 1; j++) {
                // Don't check current cell
                if (i == row && j == col) continue;

                if (i >= 0 && i < rows && j >= 0 && j < cols) {
                    adj.push(new Adjacent(grid[i][j], i, j));
                }
            }
        }

        return adj;
    }

    public toString(): string {
        return this.value ? this.value.toString() : "";
    }
}

class Adjacent {
    constructor(private cell: Cell, private row: number, private col: number) { }

    public getCell(): Cell {
        return this.cell;
    }

    public getRow(): number {
        return this.row;
    }

    public getCol(): number {
        return this.col;
    }
}