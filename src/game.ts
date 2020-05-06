import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { BOARD_CONFIG, Config, Mode } from "./config";
import { State } from "./state";
import { UrlTool } from "./urlTool";
import {
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    PubSub
} from "./util/pub-sub";

enum Starter {
    Default = "Default/Reset", // same as Reset
    Hash = "Hash",
    Replay = "Replay",
}

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
    private urlTool: UrlTool;
    private starter: Starter;

    constructor(private config: Config) {
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));

        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", (e: Event) => this.reset());

        this.replayBtn = document.getElementById("replay");
        this.replayBtn.addEventListener("click", (e: Event) => this.replay());

        this.urlTool = new UrlTool(
            this.config.encoder,
            this.config.modePairer);

        PubSub.subscribe(EVENT_CELL_REVEALED, this.start.bind(this));
        PubSub.subscribe(EVENT_CELL_FLAGGED, this.incrementFlags.bind(this));
        PubSub.subscribe(EVENT_CELL_UNFLAGGED, this.decrementFlags.bind(this));
        PubSub.subscribe(EVENT_GAME_OVER, this.gameOver.bind(this));
        PubSub.subscribe(EVENT_SAFE_AREA_CREATED, this.updateHash.bind(this));

        this.initialize();
    }

    public getConfig(): Config {
        return this.config;
    }

    private reset(): void {
        history.replaceState(undefined, undefined, "#");
        this.timer.stop();
        this.isReplay = false;
        this.resetBtn.innerHTML = "RESET";
        this.initialize();
    }

    private replay(): void {
        this.timer.stop();
        this.isReplay = true;
        this.initialize();
    }

    private initialize(): void {
        this.starter = this.determineStarter();
        this.isOver = false;
        this.timer.reset();
        this.board?.unsubscribe();
        this.generateScenario();
        this.board.draw(document.getElementById("board"));
        this.setFlags(0);
    }

    private determineStarter(): Starter {
        if (this.isReplay) {
            return Starter.Replay;
        }

        if (this.urlTool.isHashSet()) {
            return Starter.Hash;
        }

        // Default == Reset
        return Starter.Default;
    }

    private generateScenario(): void {
        let mode: Mode;
        let state: State;

        switch (this.starter) {
            case Starter.Replay:
                mode = BOARD_CONFIG[this.config.mode];
                state = this.board.getState();
                break;
            case Starter.Hash:
                mode = this.urlTool.extractMode();
                state = this.urlTool.extractState(mode);
                break;
            default:
                mode = BOARD_CONFIG[this.config.mode];
                state = null;
        }

        this.board = new Board(this, mode, state);

        this.urlTool.updateHash(mode, this.board.getState());
    }

    private start(): void {
        if (!this.timer.isStarted()) {
            this.timer.start();
        }
    }

    public isStarted(): boolean {
        return this.timer.isStarted();
    }

    private gameOver(win: boolean = false): void {
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

    public shouldSkipFirstClickCheck(): boolean {
        return this.starter == Starter.Replay ||
            this.starter == Starter.Hash;
    }

    private setFlags(value: number): void {
        this.flagsCounter = value;
        this.counter.updateEl(this.board.getMines() - this.flagsCounter);
    }

    private incrementFlags(value: number): void {
        this.setFlags(++this.flagsCounter);
    }

    private decrementFlags(): void {
        this.setFlags(--this.flagsCounter);
    }

    private updateHash(): void {
        const mode = this.urlTool.extractMode();
        this.urlTool.updateHash(mode, this.board.getState());
    }

}
