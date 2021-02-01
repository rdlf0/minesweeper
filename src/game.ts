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
    private isReset: boolean;
    private isReplay: boolean;
    private urlTool: UrlTool;

    constructor(private config: Config) {
        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));

        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", this.reset.bind(this));

        this.replayBtn = document.getElementById("replay");
        this.replayBtn.addEventListener("click", this.replay.bind(this));

        window.addEventListener("hashchange", this.handleHashChange.bind(this));

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
        if (Session.get("debug")) {
            console.debug('======= RESET =======');
        }

        this.updateUrlHash(true);
        this.timer.stop();
        this.isReset = true;
        this.isReplay = false;
        this.resetBtn.innerHTML = "RESET";
        this.initialize();
    }

    private replay(): void {
        if (Session.get("debug")) {
            console.debug('======= REPLAY =======');
        }

        this.timer.stop();
        this.isReset = false;
        this.isReplay = true;
        this.initialize();
    }

    private handleHashChange(): void {
        if (Session.get("debug")) {
            console.debug('======= HASH CHANGED =======');
        }

        this.timer.stop();
        this.isReset = false;
        this.isReplay = false;
        this.initialize();
    }

    private initialize(): void {
        Session.clear();
        Session.set("debug", this.config.debug);
        Session.set("firstClick", this.config.firstClick);

        this.isOver = false;
        this.timer.reset();

        if (this.board != null) { // Microsoft Edge Mobile doesn't support optional chaining yet
            this.board.unsubscribe();
        }
        this.generateScenario();

        const boardEl = document.getElementById("board");
        boardEl.style.setProperty("--rows", this.board.getMode().rows.toString());
        boardEl.style.setProperty("--cols", this.board.getMode().cols.toString());
        this.board.draw(boardEl);

        this.setFlags(0);
    }

    private generateScenario(): void {
        let mode: Mode;
        let state: State;

        if (this.isReset) {
            mode = this.board.getMode();
            state = null;
            Session.set("applyFirstClickRule", true);
        } else if (this.isReplay) {
            // Same as if started by a URL with a hash, but here we avoid decoding and unpairing
            mode = this.board.getMode();
            state = this.board.getState();
        } else if (this.urlTool.isHashSet()) {
            mode = this.urlTool.extractMode();
            // Optional chaining workaround
            if (mode == null && this.board != null) {
                mode = this.board.getMode();
            } else if (mode == null) {
                mode = BOARD_CONFIG[this.config.mode]
            }

            state = this.urlTool.extractState(mode);

            if (state == null) {
                console.warn("Could not extract mode or state from hash. Falling back to defaults.");
            }
        } else {
            mode = BOARD_CONFIG[this.config.mode];
            state = null;
            Session.set("applyFirstClickRule", true);
        }

        if (Session.get("debug")) {
            console.debug(mode);
        }

        this.board = new Board(mode, state);

        this.updateUrlHash();
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

    private updateUrlHash(empty: boolean = false): void {
        if (empty) {
            this.urlTool.updateHash(null, null);
        } else {
            this.urlTool.updateHash(this.board.getMode(), this.board.getState());
        }
    }

}
