import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config, BOARD_CONFIG } from "./config";

export class Game {

    private rows: number;
    private cols: number;
    private mines: number;

    private counter: Counter;
    private resetBtn: HTMLElement;
    private board: Board;
    private timer: Timer;
    private flags: number;
    private over: boolean;

    constructor(
        public config: Config
    ) {
        this.rows = BOARD_CONFIG[config.mode].rows;
        this.cols = BOARD_CONFIG[config.mode].cols;
        this.mines = BOARD_CONFIG[config.mode].mines;
        
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));
        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.reset();
    }

    private generateScenario(): void {
        this.board = new Board(this, this.rows, this.cols, this.mines);
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
        this.counter.updateEl(this.mines - this.flags);
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flags + value);
    }

}