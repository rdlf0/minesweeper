export class Cell {

    private value: number | null = null;
    private revealed: boolean = false;
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

    public reveal(grid: Cell[][], row: number, col: number): number {
        if (grid[row][col].getValue() != null) {
            return grid[row][col].getValue();
        }

        let value = 0;

        let adjacent = this.getAdjacent(grid, row, col);
        for (let adj of adjacent) {
            if (adj.getCell().isMine()) value++;
        }

        this.value = value;
        this.revealed = true;

        this.el.innerHTML = this.toString();
        this.el.classList.add("revealed");

        if (value > 0) {
            return;
        }

        for (let adj of adjacent) {
            adj.getCell().reveal(grid, adj.getRow(), adj.getCol());
        }
    }

    public getAdjacent(grid: Cell[][], row: number, col: number): Adjacent[] {
        let adj: Adjacent[] = [];
        let rows = grid.length;
        let cols = grid[0].length;

        if (row < rows - 1) {
            if (col > 0) adj.push(new Adjacent(grid[row + 1][col - 1], row + 1, col - 1));
            if (col < cols - 1) adj.push(new Adjacent(grid[row + 1][col + 1], row + 1, col + 1));
            adj.push(new Adjacent(grid[row + 1][col], row + 1, col));
        }

        if (row > 0) {
            if (col > 0) adj.push(new Adjacent(grid[row - 1][col - 1], row - 1, col - 1));
            if (col < cols - 1) adj.push(new Adjacent(grid[row - 1][col + 1], row - 1, col + 1));
            adj.push(new Adjacent(grid[row - 1][col], row - 1, col));
        }

        if (col > 0) adj.push(new Adjacent(grid[row][col - 1], row, col - 1));
        if (col < cols - 1) adj.push(new Adjacent(grid[row][col + 1], row, col + 1));

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