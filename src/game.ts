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
    private started: boolean = false;
    private timer: Timer;

    constructor(private debug: boolean = false) {
        this.boardContainer = document.getElementById("board");
        this.minesCounter = document.getElementById("mines-counter");
        this.timer = new Timer(document.getElementById("timer"));
        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.generateScenario();
    }

    private generateScenario(): void {
        let board = new Board(this, ROWS, COLS, MINES, this.debug);
        board.draw(this.boardContainer);
    }

    public start(): void {
        if (this.started) return;

        this.timer.start();
        this.started = true;
    }

    private reset(): void {
        this.timer.stop();
        this.started = false;
        this.generateScenario();
    }

    public updateMinesCounter(flags: number): void {
        this.minesCounter.innerHTML = (MINES - flags).toString();
    }

}