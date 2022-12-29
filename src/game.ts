import { Board } from "./board";
import { Timer } from "./timer";
import { Counter } from "./counter";
import { Config, Mode, BOARD_CONFIG, MODE_NAME } from "./config";
import { State } from "./state";
import { UrlTool } from "./util/urlUtil";
import {
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    EVENT_SETTINGS_CHANGED,
    PubSub,
} from "./util/pub-sub";
import { Session } from "./util/session";
import { Settings } from "./settings";
import { MobileUtil } from "./util/mobileUtil";

export class Game {

    // Visual elements
    private counter: Counter;
    private resetBtn: HTMLElement;
    private replayBtn: HTMLElement;
    private toggleSettingsBtn: HTMLElement;
    private timer: Timer;
    private board: Board;
    private boardEl: HTMLElement;
    private settingsEl: HTMLElement;

    // Other properties
    private flagsCounter: number;
    private isOver: boolean;
    private isReset: boolean;
    private isReplay: boolean;
    private urlTool: UrlTool;
    private settingsOpened: boolean = false;

    constructor(private config: Config) {
        document.body.classList.toggle("dark", this.config.darkModeOn);

        this.counter = new Counter(document.getElementById("mines-counter"));
        this.timer = new Timer(document.getElementById("timer"));

        this.resetBtn = document.getElementById("reset");
        this.resetBtn.addEventListener("click", this.reset.bind(this));

        this.replayBtn = document.getElementById("replay");
        this.replayBtn.addEventListener("click", this.replay.bind(this));

        this.toggleSettingsBtn = document.getElementById("toggle-settings");
        this.toggleSettingsBtn.addEventListener("click", this.toggleSettings.bind(this));

        this.boardEl = document.getElementById("board");
        this.settingsEl = document.getElementById("settings");
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
        PubSub.subscribe(EVENT_SETTINGS_CHANGED, this.handleSettingsChange.bind(this));

        this.initialize(false, false);

        new Settings(this.settingsEl, this.config); // nosonar
    }

    private reset(): void {
        this.logDebugMessage('======= RESET =======');

        if (this.settingsOpened) {
            this.closeSettings();
        }
        this.updateUrlHash(true);
        this.initialize(true, false);
    }

    private replay(): void {
        this.logDebugMessage('======= REPLAY =======');

        if (this.settingsOpened) {
            this.closeSettings();
        }
        this.initialize(false, true);
    }

    private handleHashChange(): void {
        this.logDebugMessage('======= HASH CHANGED =======');

        if (this.settingsOpened) {
            this.closeSettings();
        }
        this.initialize(false, false);
    }

    private handleSettingsChange() {
        this.logDebugMessage('======= SETTINGS CHANGED =======');

        this.updateUrlHash(true);
        this.initialize(false, false);
    }

    private initialize(isReset: boolean, isReplay: boolean): void {
        Session.clear();
        Session.set("debug", this.config.debug);
        Session.set("firstClick", Number(this.config.firstClick));

        this.isReset = isReset;
        this.isReplay = isReplay;
        this.isOver = false;
        this.timer.stop();
        this.timer.reset();
        this.board?.unsubscribe();

        this.generateBoard();
        this.updateTitle();
        this.updateUrlHash();
        this.resizeBoard();

        this.board.draw();

        this.setFlags(0);
    }

    private generateBoard(): void {
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
            mode = this.urlTool.extractMode() ?? this.board?.getMode() ?? BOARD_CONFIG[this.config.mode];
            this.config.mode = this.getModeNameFromMode(mode);
            state = this.urlTool.extractState(mode);

            if (state == null) {
                console.warn("Could not extract mode or state from hash. Falling back to defaults.");
            }
        } else {
            mode = BOARD_CONFIG[this.config.mode];
            state = null;
            Session.set("applyFirstClickRule", true);
        }

        if (MobileUtil.isMobile()) {
            // Overwrite mode
            mode = { rows: 12, cols: 8, mines: 15 };
            console.debug(window.screen.availWidth);
            console.debug(window.screen.availHeight);
        }

        this.logDebugMessage(mode);

        this.board = new Board(mode, state, this.boardEl);
    }

    private getModeNameFromMode(mode: Mode): MODE_NAME {
        for (const modeKey in MODE_NAME) {
            const modeValue = MODE_NAME[modeKey];
            const m = BOARD_CONFIG[modeValue];
            if (m == null) {
                continue;
            }

            if (m.rows == mode.rows &&
                m.cols == mode.cols &&
                m.mines == mode.mines) {
                return modeValue;
            }
        }

        return MODE_NAME.Custom;
    }

    private toggleSettings(): void {
        if (!this.settingsOpened) {
            this.openSettings();
        } else {
            this.closeSettings();
        }
    }

    private openSettings(): void {
        this.timer.stop();
        this.settingsOpened = true;
        this.boardEl.style.display = "none";
        this.settingsEl.style.display = "flex";
    }

    private closeSettings(): void {
        if (this.timer.isStarted() && !this.isOver) {
            this.timer.start();
        }
        this.settingsOpened = false;
        this.boardEl.style.display = "grid";
        this.settingsEl.style.display = "none";
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
            // @TODO: Congratulate the player somehow
        }
    }

    public checkIsOver(): boolean {
        return this.isOver;
    }

    private setFlags(value: number): void {
        this.flagsCounter = value;
        this.counter.updateEl(this.board.getMines() - this.flagsCounter);
    }

    private incrementFlags(): void {
        this.setFlags(++this.flagsCounter);
    }

    private decrementFlags(): void {
        this.setFlags(--this.flagsCounter);
    }

    private updateTitle(): void {
        const modeName = this.getModeNameFromMode(this.board.getMode());
        document.title = `Minesweeper - ${modeName.charAt(0).toUpperCase() + modeName.slice(1)} mode`
    }

    private updateUrlHash(empty: boolean = false): void {
        if (empty) {
            this.urlTool.updateHash(null, null);
        } else {
            this.urlTool.updateHash(this.board.getMode(), this.board.getState());
        }
    }

    private resizeBoard(): void {
        this.boardEl.style.setProperty("--rows", this.board.getMode().rows.toString());
        this.boardEl.style.setProperty("--cols", this.board.getMode().cols.toString());

        this.settingsEl.style.setProperty("--rows", this.board.getMode().rows.toString());
        this.settingsEl.style.setProperty("--cols", this.board.getMode().cols.toString());
    }

    private logDebugMessage(...message: any[]): void {
        if (Session.get("debug")) {
            console.debug(message);
        }
    }

}
