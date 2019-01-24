import { Board } from "./board";
import { Timer } from "./timer";

// enum MODE {Beginner, Intermediate, Expert};

// Beginner
// const ROWS = 9;
// const COLS = 9;
// const MINES = 10;

// Intermediate
// const ROWS = 16;
// const COLS = 16;
// const MINES = 40;

// Expert
const ROWS = 16;
const COLS = 30;
const MINES = 99;

export class Game {

    private boardContainer: HTMLElement;
    private minesCounter: HTMLElement;
    private resetBtn: HTMLElement;
    private timer: Timer;
    private flags: number;

    constructor(private debug: boolean = false) {
        this.boardContainer = document.getElementById("board");
        this.minesCounter = document.getElementById("mines-counter");
        this.timer = new Timer(document.getElementById("timer"));
        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.setFlags(0);
        this.generateScenario();
    }

    public isDebugEnabled(): boolean {
        return this.debug;
    }

    private generateScenario(): void {
        let board = new Board(this, ROWS, COLS, MINES);
        board.draw(this.boardContainer);
    }

    private setFlags(value: number): void {
        this.flags = value;
        this.updateMinesCounter();
    }

    public start(): void {
        if (!this.timer.isStarted()) {
            this.timer.start();
        }
    }

    public isStarted(): boolean {
        return this.timer.isStarted();
    }

    private reset(): void {
        this.timer.stop();
        this.setFlags(0);
        this.generateScenario();
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flags + value);
    }

    public updateMinesCounter(): void {
        this.minesCounter.innerHTML = (MINES - this.flags).toString();
    }

}