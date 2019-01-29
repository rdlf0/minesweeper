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
    private board: Board;
    private timer: Timer;
    private flags: number;
    private over: boolean = false;

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
        this.board = new Board(this, ROWS, COLS, MINES);
        this.board.draw(this.boardContainer);
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
        this.timer.reset();
        this.over = false;
        this.resetBtn.innerHTML = "RESET";
        this.setFlags(0);
        this.generateScenario();
    }

    public gameOver(win: boolean = false): void {
        this.timer.stop();
        this.over = true;

        this.board.revealMines(win);

        if (win) {
            this.resetBtn.innerHTML = "WIN!";
        }
    }

    public isOver(): boolean {
        return this.over;
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flags + value);
    }

    public updateMinesCounter(): void {
        this.minesCounter.innerHTML = ("000" + (MINES - this.flags)).slice(-3);
    }

}