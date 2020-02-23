import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config, Mode, BOARD_CONFIG } from "./config";
import { State } from "./state";
import { UrlTool } from "./urlTool";

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
    private urlTool: UrlTool

    constructor(private config: Config) {
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));

        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset(true, false));

        this.replayBtn = document.getElementById("replay");
        this.replayBtn.addEventListener("click", (e: Event) => this.reset(false, true));

        this.urlTool = new UrlTool(
            this.config.encoder,
            this.config.modePairer);

        this.reset();
    }

    public getConfig(): Config {
        return this.config;
    }

    private generateScenario(): void {
        let mode: Mode = BOARD_CONFIG[this.config.mode];
        let state: State = null;

        if (this.isReplay) {
            state = this.board.getState();
        } else {
            if (this.urlTool.isHashSet()) {
                const decodedHash = this.urlTool.getDecodedHash();
                mode = this.urlTool.extractMode(decodedHash);
                state = this.urlTool.extractState(decodedHash, mode);
                this.isReplay = true; // update hash after state got updated
            }
        }

        this.board = new Board(this, mode, state);
        this.board.draw(document.getElementById("board"));

        this.urlTool.updateHash(mode, this.board.getState());
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

    private reset(reset: boolean = false, replay: boolean = false): void {
        this.timer.stop();
        this.timer.reset();
        this.resetBtn.innerHTML = "RESET";
        this.isOver = false;
        this.isReplay = replay;

        if (reset) {
            history.replaceState(undefined, undefined, "#");
        }

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

    // Temporary solution until some kind of publish/subscribe get implemented
    public updateHash(): void {
        const decodedHash = this.urlTool.getDecodedHash();
        const mode = this.urlTool.extractMode(decodedHash);
        this.urlTool.updateHash(mode, this.board.getState());
    }

}
