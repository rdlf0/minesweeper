import { Board } from "./board.js";
import { Timer } from "./timer.js";
import { Counter } from "./counter.js";
import { Config, Mode, BOARD_CONFIG, MODE_NAME, HINT_MODE } from "./config.js";
import { State } from "./state.js";
import { UrlTool } from "./urlTool.js";
import {
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    EVENT_SAFE_AREA_CREATED,
    EVENT_SETTINGS_CHANGED,
    EVENT_MODE_CHANGED,
    EVENT_HINT_MODE_CHANGED,
    PubSub,
} from "./util/pub-sub.js";
import { Session } from "./util/session.js";
import { Settings } from "./settings.js";
import { isTouchDevice, getDeviceBoardArea, computeDeviceMode } from "./util/device.js";

/** Debounce for the resize-driven recomputation of the device mode. */
const RESIZE_DEBOUNCE_MS = 150;

export class Game {

    // Visual elements
    private counter: Counter;
    private resetBtn: HTMLElement;
    private replayBtn: HTMLElement;
    private hintBtn: HTMLElement;
    private toggleSettingsBtn: HTMLElement;
    private timer: Timer;
    private board: Board;
    private boardEl: HTMLElement;
    private settingsEl: HTMLElement;
    private hintMessageEl: HTMLElement;
    private winMessageEl: HTMLElement;
    private winMessageTimeout: number | undefined;
    private hintMessageTimeout: number | undefined;
    // Blocks re-invoking the hint until the player makes a move.
    private hintUsed: boolean = false;
    private lastHintMessage: string | undefined;

    // Other properties
    private flagsCounter: number;
    private isOver: boolean;
    private isReset: boolean;
    private isReplay: boolean;
    private urlTool: UrlTool;
    private settingsOpened: boolean = false;
    private resizeTimeout: number | undefined;

    constructor(private config: Config) {
        document.body.classList.toggle("dark", this.config.darkModeOn);

        this.counter = new Counter(document.getElementById("mines-counter")!);
        this.timer = new Timer(document.getElementById("timer")!);

        this.resetBtn = document.getElementById("reset")!;
        this.resetBtn.addEventListener("click", this.reset.bind(this));

        this.replayBtn = document.getElementById("replay")!;
        this.replayBtn.addEventListener("click", this.replay.bind(this));

        this.hintBtn = document.getElementById("hint")!;
        this.hintBtn.title = `Get a hint (+${this.config.hintCost}s)`;
        this.hintBtn.addEventListener("click", this.showHint.bind(this));

        this.toggleSettingsBtn = document.getElementById("toggle-settings")!;
        this.toggleSettingsBtn.addEventListener("click", this.toggleSettings.bind(this));

        if (this.config.debug) {
            const testWinBtn = document.getElementById("test-win")!;
            testWinBtn.style.display = "block";
            testWinBtn.addEventListener("click", () => this.gameOver(true));
        }

        this.boardEl = document.getElementById("board")!;
        this.settingsEl = document.getElementById("settings")!;
        this.hintMessageEl = document.getElementById("hint-message")!;
        this.winMessageEl = document.getElementById("win-message")!;
        window.addEventListener("hashchange", this.handleHashChange.bind(this));
        // orientationchange fires a resize too, so this covers rotation as well.
        window.addEventListener("resize", this.handleResize.bind(this));

        this.lockPortraitOrientation();

        this.urlTool = new UrlTool(
            this.config.encoder,
            this.config.modePairer,
        );

        PubSub.subscribe(EVENT_CELL_REVEALED, this.start.bind(this));
        PubSub.subscribe(EVENT_CELL_REVEALED, this.allowHint.bind(this));
        PubSub.subscribe(EVENT_CELL_FLAGGED, this.incrementFlags.bind(this));
        PubSub.subscribe(EVENT_CELL_FLAGGED, this.allowHint.bind(this));
        PubSub.subscribe(EVENT_HINT_MODE_CHANGED, this.allowHint.bind(this));
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

    private showHint(): void {
        if (this.isOver || this.settingsOpened) {
            return;
        }

        if (!this.isStarted()) {
            this.flashHintMessage("Click any cell — your first move is always safe.");
            return;
        }

        if (this.hintUsed) {
            if (this.lastHintMessage !== undefined) {
                this.flashHintMessage(this.lastHintMessage);
            }
            return;
        }

        const found = this.board.showHint(this.config.hintMode);

        // Using the helper costs the player time, even when it finds nothing.
        this.timer.addTime(this.config.hintCost);
        this.hintUsed = true;

        if (found === 0) {
            this.lastHintMessage = this.config.hintMode === HINT_MODE.Mines
                ? "No mine can be logically pinned down yet."
                : "No logical move — you'll have to take a guess.";
            this.flashHintMessage(this.lastHintMessage);
        } else {
            this.lastHintMessage = undefined;
        }
    }

    private allowHint(): void {
        this.hintUsed = false;
        this.lastHintMessage = undefined;
    }

    private flashHintMessage(message: string): void {
        this.hintMessageEl.textContent = message;
        this.hintMessageEl.classList.add("show");

        if (this.hintMessageTimeout !== undefined) {
            clearTimeout(this.hintMessageTimeout);
        }
        this.hintMessageTimeout = window.setTimeout(() => {
            this.hintMessageEl.classList.remove("show");
        }, 3000);
    }

    private handleHashChange(): void {
        this.logDebugMessage('======= HASH CHANGED =======');

        if (this.settingsOpened) {
            this.closeSettings();
        }
        this.initialize(false, false);

        // The hash may carry a different mode, so let the settings section re-sync.
        PubSub.publish(EVENT_MODE_CHANGED);
    }

    /** An installed mobile PWA can genuinely hold portrait. Everywhere else this is
     * unsupported and rejects harmlessly — the landscape message in `styles.css` is
     * what actually guarantees portrait-only play. */
    private lockPortraitOrientation(): void {
        if (!isTouchDevice()) {
            return;
        }

        const orientation = screen.orientation as ScreenOrientation & {
            lock?: (orientation: string) => Promise<void>;
        };

        orientation?.lock?.("portrait").catch(() => { /* not supported here */ });
    }

    /** The device mode is derived from the viewport, so it has to be recomputed when
     * the viewport changes — but never mid-game, or an in-progress board would be
     * thrown away. */
    private handleResize(): void {
        if (!isTouchDevice() || Session.get("gameStarted") === true) {
            return;
        }

        if (this.resizeTimeout !== undefined) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = window.setTimeout(() => {
            this.resizeTimeout = undefined;

            const mode = this.getDeviceMode();
            const current = this.board.getMode();

            if (mode.rows === current.rows &&
                mode.cols === current.cols &&
                mode.mines === current.mines) {
                return;
            }

            this.logDebugMessage('======= DEVICE MODE CHANGED =======');
            this.initialize(false, false);
        }, RESIZE_DEBOUNCE_MS);
    }

    private getDeviceMode(): Mode {
        const area = getDeviceBoardArea();

        return computeDeviceMode(area.width, area.height, this.config.mobileMineDensity);
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
        this.hintUsed = false;
        this.lastHintMessage = undefined;
        this.timer.stop();
        this.timer.reset();
        this.boardEl.classList.remove("won");
        this.winMessageEl.classList.remove("show");
        if (this.winMessageTimeout !== undefined) {
            clearTimeout(this.winMessageTimeout);
            this.winMessageTimeout = undefined;
        }
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
        let state: State | null;

        if (this.isReset) {
            mode = this.board.getMode();
            state = null;
            Session.set("applyFirstClickRule", true);
        } else if (this.isReplay) {
            // Same as if started by a URL with a hash, but here we avoid decoding and unpairing
            mode = this.board.getMode();
            state = this.board.getState();
        } else if (!isTouchDevice() && this.urlTool.isHashSet()) {
            // Touch devices skip this branch: a shared board carries fixed dimensions
            // that would not fit the screen, so they always play a device-derived one.
            const decodedMode = this.urlTool.extractMode();
            mode = decodedMode ?? this.board?.getMode() ?? BOARD_CONFIG[this.config.mode];
            this.config.mode = this.getModeNameFromMode(mode);

            if (decodedMode == null) {
                // Nothing usable in the hash at all — extractMode has already said why.
                console.warn("Could not read a board from the hash. Falling back to defaults.");
                state = null;
            } else {
                // Only worth reading a layout once we know which board it belongs to.
                // extractState reports a missing layout itself, at the right severity.
                state = this.urlTool.extractState(mode);
            }
        } else {
            mode = isTouchDevice() ? this.getDeviceMode() : BOARD_CONFIG[this.config.mode]!;
            state = null;
            Session.set("applyFirstClickRule", true);
        }

        this.logDebugMessage(mode);

        this.board = new Board(mode, state, this.boardEl);
    }

    private getModeNameFromMode(mode: Mode): MODE_NAME {
        for (const modeValue of Object.values(MODE_NAME)) {
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
        this.board.clearHints();
        this.allowHint();
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
            this.restartAnimation(this.boardEl, "won");
            this.showWinMessage();
        }
    }

    private showWinMessage(): void {
        this.restartAnimation(this.winMessageEl, "show");

        if (this.winMessageTimeout !== undefined) {
            clearTimeout(this.winMessageTimeout);
        }
        this.winMessageTimeout = window.setTimeout(() => {
            this.winMessageEl.classList.remove("show");
        }, 4000);
    }

    // Re-adds a class so its CSS animation replays even if it was already applied.
    private restartAnimation(el: HTMLElement, className: string): void {
        el.classList.remove(className);
        void el.offsetWidth; // force reflow so the animation restarts
        el.classList.add(className);
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
