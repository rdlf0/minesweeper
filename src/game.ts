import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config } from "./config";

export class Game {

    // Visual elements
    private counter: Counter;
    private resetBtn: HTMLElement;
    private replayBtn: HTMLElement;
    private timer: Timer;
    private board: Board;

    // Other properties
    private flagsCounter: number;
    private isOver: boolean;
    private isReplay: boolean;

    constructor(private config: Config) {
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));

        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());
        
        this.replayBtn = document.getElementById("replay");
        this.replayBtn.addEventListener("click", (e: Event) => this.reset(true));

        this.reset();
    }

    public getConfig(): Config {
        return this.config;
    }

    private generateScenario(): void {
        let minesScheme: boolean[] = [];
        if (this.isReplay) {
            minesScheme = this.board.getMinesScheme();
        }

        this.board = new Board(this, minesScheme);
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
        this.isOver = true;
        this.board.revealMines(win);

        if (win) {
            this.resetBtn.innerHTML = "WIN!";
        }
    }

    public checkIsOver(): boolean {
        return this.isOver;
    }

    public checkIsReplay(): boolean {
        return this.isReplay;
    }

    private reset(replay: boolean = false): void {
        this.timer.stop();
        this.timer.reset();
        this.resetBtn.innerHTML = "RESET";
        this.isOver = false;
        this.isReplay = replay;
        this.generateScenario();
        this.setFlags(0);
    }

    private setFlags(value: number): void {
        this.flagsCounter = value;
        this.counter.updateEl(this.board.getMines() - this.flagsCounter);
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flagsCounter + value);
    }

}