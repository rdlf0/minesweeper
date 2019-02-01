import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";

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

    private counter: Counter;
    private resetBtn: HTMLElement;
    private board: Board;
    private timer: Timer;
    private flags: number;
    private over: boolean;

    constructor(private debug: boolean = false) {
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));
        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.reset();
    }

    public isDebugEnabled(): boolean {
        return this.debug;
    }

    private generateScenario(): void {
        this.board = new Board(this, ROWS, COLS, MINES);
        this.board.draw(document.getElementById("board"));
    }

    public start(): void {
        if (!this.timer.isStarted()) {
            this.timer.start();
        }
    }

    public isStarted(): boolean {
        return this.timer.isStarted();
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

    private reset(): void {
        this.timer.stop();
        this.timer.reset();
        this.resetBtn.innerHTML = "RESET";
        this.over = false;
        this.setFlags(0);
        this.generateScenario();
    }

    private setFlags(value: number): void {
        this.flags = value;
        this.counter.updateEl(MINES - this.flags);
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flags + value);
    }

}