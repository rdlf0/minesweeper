import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config } from "./config";

export class Game {

    private counter: Counter;
    private resetBtn: HTMLElement;
    private replayBtn: HTMLElement;
    private board: Board;
    private timer: Timer;
    private flags: number;
    private over: boolean;

    constructor(
        private config: Config
    ) { 
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));
        this.resetBtn = document.getElementById("reset");
        this.replayBtn = document.getElementById("replay");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());
        this.replayBtn.addEventListener("click", (e: Event) => this.reset(true));

        this.reset();
    }

    public getConfig(): Config {
        return this.config;
    }

    private generateScenario(replay: boolean = false): void {
        let minesList: boolean[] = [];
        if (replay && this.board !== undefined) {
            minesList = this.board.getMinesList();
        }

        this.board = new Board(this, minesList);
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

    private reset(replay: boolean = false): void {
        this.timer.stop();
        this.timer.reset();
        this.resetBtn.innerHTML = "RESET";
        this.over = false;
        this.generateScenario(replay);
        this.setFlags(0);
    }

    private setFlags(value: number): void {
        this.flags = value;
        this.counter.updateEl(this.board.getMines() - this.flags);
    }

    public incrementFlags(value: number): void {
        this.setFlags(this.flags + value);
    }

}