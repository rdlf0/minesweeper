import { Board } from "./board";

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

    private ticker: any;
    private timer: number = 0;
    private timerEl: HTMLElement;
    private started: boolean = false;

    constructor(private debug: boolean = false) {
        this.boardContainer = document.getElementById("board");
        this.minesCounter = document.getElementById("mines-counter");
        this.timerEl = document.getElementById("timer");
        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.generateScenario();
    }

    public isStarted(): boolean {
        return this.started;
    }

    private setStarted(value: boolean): void {
        this.started = value;
    }

    public generateScenario(): void {
        let board = new Board(this, ROWS, COLS, MINES, this.debug);
        board.draw(this.boardContainer);
    }

    public start(): void {
        if (this.isStarted()) return;

        this.setStarted(true);

        this.ticker = window.setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    public reset(): void {
        window.clearInterval(this.ticker);
        this.timer = 0;
        this.updateTimer();
        this.setStarted(false);
        this.generateScenario();
    }

    private updateTimer(): void {
        this.timerEl.innerHTML = ("000" + this.timer).slice(-3);
    }

    public updateMinesCounter(flags: number): void {
        this.minesCounter.innerHTML = (MINES - flags).toString();
    }

}