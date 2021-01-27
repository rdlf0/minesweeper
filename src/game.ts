import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config, Mode, BOARD_CONFIG, MODE_NAME } from "./config";
import { State } from "./state";
import { UrlTool } from "./urlTool";
import {
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    PubSub,
} from "./util/pub-sub";
import { Session } from "./util/session";

enum Starter {
    Default = "Default/Reset",
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
            this.config.modePairer,
        );

        PubSub.subscribe(EVENT_CELL_REVEALED, this.start.bind(this));
        PubSub.subscribe(EVENT_CELL_FLAGGED, this.incrementFlags.bind(this));
        PubSub.subscribe(EVENT_CELL_UNFLAGGED, this.decrementFlags.bind(this));
        PubSub.subscribe(EVENT_GAME_OVER, this.gameOver.bind(this));
        PubSub.subscribe(EVENT_SAFE_AREA_CREATED, this.updateUrlHash.bind(this));

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
        Session.clear();
        Session.set("debug", this.config.debug);
        Session.set("firstClick", this.config.firstClick);

        this.starter = this.determineStarter();
        this.isOver = false;
        this.timer.reset();

        if (this.board != null) { // Microsoft Edge Mobile doesn't support optional chaining yet
            this.board.unsubscribe();
        }
        this.generateScenario();

        const boardEl = document.getElementById("board");
        const boardMode = this.findModeNameByMode(this.board.getMode());
        boardEl.classList.add(`board-${boardMode}`);
        this.board.draw(boardEl);

        this.setFlags(0);
    }

    private determineStarter(): Starter {
        if (this.isReplay) {
            return Starter.Replay;
        }

        if (this.urlTool.isHashSet()) {
            return Starter.Hash;
        }

        Session.set("applyFirstClickRule", true);

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

        this.board = new Board(mode, state);

        this.updateUrlHash();
    }

    private findModeNameByMode(mode: Mode): MODE_NAME {
        if (mode == null) {
            return null;
        }

        let modeName: MODE_NAME;
        for (modeName in BOARD_CONFIG) {
            if (mode.rows == BOARD_CONFIG[modeName].rows
                && mode.cols == BOARD_CONFIG[modeName].cols
                && mode.mines == BOARD_CONFIG[modeName].mines) {
                return modeName;
            }
        }

        return null;
    }

    private start(): void {
        if (!this.timer.isStarted()) {
            this.timer.start();
            Session.set("gameStarted", true);
        }
    }

    public isStarted(): boolean {
        return this.timer.isStarted();
    }

    private gameOver(win: boolean = false): void {
        this.timer.stop();
        this.isOver = true;
        this.board.deactivateCells();
        this.board.revealMines(win);

        if (win) {
            this.resetBtn.innerHTML = "WIN!";
        }
    }

    public checkIsOver(): boolean {
        return this.isOver;
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

    private updateUrlHash(): void {
        this.urlTool.updateHash(this.board.getMode(), this.board.getState());
    }

}
