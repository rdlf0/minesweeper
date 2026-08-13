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
import {
    isTouchDevice,
    getDeviceBoardArea,
    computeDeviceMode,
    computeFittedCellSide,
    fitsDeviceArea,
    preventPinchZoom,
} from "./util/device.js";

/** Debounce for the resize-driven recomputation of the device mode. */
const RESIZE_DEBOUNCE_MS = 150;

/** How long a message that isn't a hint explanation stays up. */
const MESSAGE_TIMEOUT_MS = 5000;

const SCORE_ENDPOINT = "https://tkm6ixtsnirfxoev57phipmmwq0hezqf.lambda-url.us-east-2.on.aws/";


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
    private messageEl: HTMLElement;
    private messageTextEl: HTMLElement;
    private messageTimeout: number | undefined;
    /** Set while generating a board, shown once the board is up — `initialize` clears
     * the toast before `generateBoard` runs, so it can't show its own message. */
    private pendingMessage: string | undefined;
    private winMessageEl: HTMLElement;
    private winMessageTimeout: number | undefined;
    // Blocks re-invoking the hint until the player makes a move.
    private hintUsed: boolean = false;
    private lastHintMessage: string | undefined;
    // Which of the current hints the button is explaining; advances on each press.
    private hintIndex: number = 0;

    // Other properties
    private flagsCounter: number;
    private isOver: boolean;
    private isReset: boolean;
    private isReplay: boolean;
    /** Whether the board on screen came from the URL hash rather than being derived
     * from the device or the configured mode. */
    private boardFromHash: boolean = false;
    private urlTool: UrlTool;
    private settingsOpened: boolean = false;
    private resizeTimeout: number | undefined;
    /** The board area as of the last `measureDeviceArea()`. Held rather than re-read
     * because reading it forces a synchronous layout — see that method. */
    private deviceArea: { width: number; height: number };

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
        this.messageEl = document.getElementById("message")!;
        this.messageTextEl = document.getElementById("message-text")!;
        // On the whole toast, not just the ×: it blocks input anyway, so a tap anywhere
        // on it should dismiss rather than do nothing. The × clicks bubble up here too.
        this.messageEl.addEventListener("click", this.hideMessage.bind(this));
        this.winMessageEl = document.getElementById("win-message")!;
        window.addEventListener("hashchange", this.handleHashChange.bind(this));
        // orientationchange fires a resize too, so this covers rotation as well.
        window.addEventListener("resize", this.handleResize.bind(this));

        this.lockPortraitOrientation();
        preventPinchZoom();

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
        this.pulseButton(this.resetBtn);
        this.updateUrlHash(true);
        this.initialize(true, false);
    }

    private replay(): void {
        this.logDebugMessage('======= REPLAY =======');

        if (this.settingsOpened) {
            this.closeSettings();
        }
        this.pulseButton(this.replayBtn);
        this.initialize(false, true);
    }

    /** Acknowledges the press on the button itself. Touch only — desktop already answers
     * with the hover background and icon rotation, and with no animation to end there the
     * listener below would never fire and would pile up a click at a time.
     * The class comes off on animationend: left on, it would override that hover transform. */
    private pulseButton(btn: HTMLElement): void {
        if (!isTouchDevice()) {
            return;
        }

        this.restartAnimation(btn, "pressed");
        btn.addEventListener("animationend", () => btn.classList.remove("pressed"), { once: true });
    }

    private showHint(): void {
        if (this.isOver || this.settingsOpened) {
            return;
        }

        if (!this.isStarted()) {
            this.showMessage("Click any cell — your first move is always safe.");
            return;
        }

        if (this.hintUsed) {
            // The board hasn't changed, so there's nothing new to solve. Step to the next
            // explanation instead — same hint, so it isn't charged again.
            if (this.board.getHintCount() > 0) {
                this.hintIndex++;
                this.explainFocusedHint();
            } else if (this.lastHintMessage !== undefined) {
                this.showMessage(this.lastHintMessage);
            }
            return;
        }

        const found = this.board.showHint(this.config.hintMode);

        // Using the helper costs the player time, even when it finds nothing.
        this.timer.addTime(this.config.hintCost);
        this.hintUsed = true;
        this.hintIndex = 0;

        if (found === 0) {
            this.lastHintMessage = this.config.hintMode === HINT_MODE.Mines
                ? "No mine can be logically pinned down yet."
                : "No logical move — you'll have to take a guess.";
            this.showMessage(this.lastHintMessage);
        } else {
            this.lastHintMessage = undefined;
            this.explainFocusedHint();
        }
    }

    /** Surfaces the current hint's explanation somewhere reachable without a mouse, and
     * lights the cells its deduction rests on.
     *
     * Touch only. On desktop the `title` tooltip already delivers the explanation on
     * hover, and a toast large enough to hold one can cover the controls. */
    private explainFocusedHint(): void {
        if (!isTouchDevice()) {
            return;
        }

        const count = this.board.getHintCount();
        const focus = this.board.focusHint(this.hintIndex);

        if (focus === null) {
            return;
        }

        // On mobile the board fills the screen, so a fixed message always covers cells.
        // Put it in the half the hinted cell isn't in, or it hides what it's describing.
        const inTopHalf = focus.row < this.board.getMode().rows / 2;
        this.messageEl.classList.toggle("at-top", !inTopHalf);

        // Without the counter there's nothing telling the player more hints are waiting.
        const position = count > 1 ? `(${(this.hintIndex % count) + 1}/${count}) ` : "";
        this.showMessage(position + focus.reason);
        this.messageEl.classList.toggle("at-top", !inTopHalf);
    }

    private allowHint(): void {
        this.hintUsed = false;
        this.lastHintMessage = undefined;
        this.hintIndex = 0;
        // The board moved on, so whatever the message was explaining is stale.
        this.hideMessage();
    }

    /** Shows a message, by default leaving it up. A solver explanation is something to
     * read, and no timeout suits every reader — it clears when the player dismisses it,
     * steps to another hint, or changes the board. Messages that merely report something
     * (`timeoutMs`) retire themselves instead, so they can't sit over the board. */
    private showMessage(message: string, timeoutMs?: number): void {
        this.clearMessageTimeout();

        // Callers that have a cell to avoid re-anchor after this; the rest sit at the bottom.
        this.messageEl.classList.remove("at-top");
        this.messageTextEl.textContent = message;
        this.messageEl.classList.add("show");

        if (timeoutMs !== undefined) {
            this.messageTimeout = window.setTimeout(() => this.hideMessage(), timeoutMs);
        }
    }

    private hideMessage(): void {
        this.clearMessageTimeout();
        this.messageEl.classList.remove("show");
    }

    private clearMessageTimeout(): void {
        if (this.messageTimeout !== undefined) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = undefined;
        }
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
        // A board from a hash keeps the dimensions it was shared with, so there is no
        // device mode for it to fall out of step with.
        if (!isTouchDevice() || this.boardFromHash || Session.get("gameStarted") === true) {
            return;
        }

        if (this.resizeTimeout !== undefined) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = window.setTimeout(() => {
            this.resizeTimeout = undefined;

            // The viewport is what changed, so this one has to re-measure.
            this.measureDeviceArea();

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

    /** Takes the viewport measurement the derived mode, the fit test and the cell sizing
     * all work from.
     *
     * Deliberately one call per board: `getDeviceBoardArea` reads `clientWidth` /
     * `clientHeight`, which forces the browser to lay out the document before it can
     * answer. Called at the top of `initialize`, before anything writes a style, that
     * costs nothing — the layout is already clean. Interleaved with the class and custom
     * property writes that follow, each read would instead flush a fresh layout of a
     * board several hundred cells wide. */
    private measureDeviceArea(): void {
        this.deviceArea = getDeviceBoardArea();
    }

    private getDeviceMode(): Mode {
        return computeDeviceMode(
            this.deviceArea.width,
            this.deviceArea.height,
            this.config.mobileMineDensity,
        );
    }

    private fitsDevice(mode: Mode): boolean {
        return fitsDeviceArea(mode, this.deviceArea.width, this.deviceArea.height);
    }

    /** The board to fall back to when the hash can't be played: whatever this device
     * would have produced on its own. */
    private getFallbackMode(): Mode {
        if (isTouchDevice()) {
            return this.getDeviceMode();
        }

        return this.board?.getMode() ?? BOARD_CONFIG[this.config.mode]!;
    }

    private handleSettingsChange() {
        this.logDebugMessage('======= SETTINGS CHANGED =======');

        this.updateUrlHash(true);
        this.initialize(false, false);
    }

    private initialize(isReset: boolean, isReplay: boolean): void {
        // Before the style writes below, so the read comes off a clean layout.
        this.measureDeviceArea();

        Session.clear();
        Session.set("debug", this.config.debug);
        Session.set("firstClick", Number(this.config.firstClick));

        this.isReset = isReset;
        this.isReplay = isReplay;
        this.isOver = false;
        this.hintUsed = false;
        this.lastHintMessage = undefined;
        this.hintIndex = 0;
        this.hideMessage();
        this.timer.stop();
        this.timer.reset();
        this.boardEl.classList.remove("won");
        this.clearBoardEffect();
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

        if (this.pendingMessage !== undefined) {
            this.showMessage(this.pendingMessage, MESSAGE_TIMEOUT_MS);
            this.pendingMessage = undefined;
        }

        this.playBoardChangeEffect();
    }

    /** A rebuilt board is indistinguishable from the one it replaced — every cell is
     * unrevealed either way — so New game and Replay have to announce themselves. Only
     * those two: a hash or settings change is already visible on its own. */
    private playBoardChangeEffect(): void {
        if (!this.isReset && !this.isReplay) {
            return;
        }

        this.boardEl.addEventListener("animationend", this.clearBoardEffect);
        this.restartAnimation(this.boardEl, this.isReset ? "new-game" : "replayed");
    }

    private generateBoard(): void {
        let mode: Mode;
        let state: State | null;

        // Not reset here: reset and replay keep the mode they were given, so a board that
        // came from a hash is still one after either of them.
        if (this.isReset) {
            mode = this.board.getMode();
            state = null;
            Session.set("applyFirstClickRule", true);
        } else if (this.isReplay) {
            // Same as if started by a URL with a hash, but here we avoid decoding and unpairing
            mode = this.board.getMode();
            state = this.board.getState();
        } else if (this.urlTool.isHashSet()) {
            const decodedMode = this.urlTool.extractMode();
            // Touch only: a shared board carries fixed dimensions, and one bigger than the
            // grid this screen yields could only be shown with cells too small to hit.
            const tooBig = decodedMode != null
                && isTouchDevice()
                && !this.fitsDevice(decodedMode);

            if (decodedMode == null) {
                // Nothing usable in the hash at all — extractMode has already said why.
                console.warn("Could not read a board from the hash. Falling back to defaults.");
            }

            if (decodedMode == null || tooBig) {
                mode = this.getFallbackMode();
                state = null;
                Session.set("applyFirstClickRule", true);

                // Only worth saying when a board was actually shared. A mode-only hash —
                // the PWA shortcuts in manifest.webmanifest — asks for a size, not a
                // specific board, and gets a device-sized one without any explaining.
                if (tooBig && this.urlTool.hasLayout()) {
                    this.pendingMessage = "That board is too big for this screen — here's a new one.";
                }

                this.boardFromHash = false;
            } else {
                mode = decodedMode;
                // Only worth reading a layout once we know which board it belongs to.
                // extractState reports a missing layout itself, at the right severity.
                state = this.urlTool.extractState(mode);
                // True even when the hash carried no layout: the *dimensions* came from
                // the hash either way, so they are not the device's to stretch or resize.
                this.boardFromHash = true;
            }

            this.config.mode = this.getModeNameFromMode(mode);
        } else {
            mode = isTouchDevice() ? this.getDeviceMode() : BOARD_CONFIG[this.config.mode]!;
            state = null;
            Session.set("applyFirstClickRule", true);
            this.boardFromHash = false;
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

        // Hitting a mine never publishes EVENT_CELL_REVEALED, so allowHint doesn't run
        // here — the hint and its explanation have to be retired explicitly.
        this.board.clearHints();
        this.hideMessage();

        this.board.revealMines(win);

        if (win) {
            this.restartAnimation(this.boardEl, "won");
            this.showWinMessage();
            this.recordWin();
        }
    }

    private recordWin(): void {
        const mode = this.board.getMode();

        fetch(SCORE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify({
                rows: mode.rows,
                cols: mode.cols,
                mines: mode.mines,
                time: this.timer.getValue(),
                hash: window.location.hash.slice(1),
            }),
            keepalive: true,
        }).catch(() => {}); // nosonar
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

    /** Retires a finished board effect. Leaving the class on would replay it: showing the
     * board again — `closeSettings` flipping it back to `display: grid` — restarts every
     * animation still attached to it. Kept as one instance so re-adding it is a no-op. */
    private clearBoardEffect = (): void => {
        this.boardEl.classList.remove("new-game", "replayed");
        this.boardEl.removeEventListener("animationend", this.clearBoardEffect);
    };

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
        this.sizeCellsForHashBoard();

        this.settingsEl.style.setProperty("--rows", this.board.getMode().rows.toString());
        this.settingsEl.style.setProperty("--cols", this.board.getMode().cols.toString());
    }

    /** A board from a hash has its own shape, so on touch it can't use the `1fr` tracks
     * that stretch a device board over the whole screen — it gets square cells sized to
     * whichever of the two axes runs out first, and the leftover space as margin. */
    private sizeCellsForHashBoard(): void {
        const fixed = this.boardFromHash && isTouchDevice();

        this.boardEl.classList.toggle("fixed-cells", fixed);

        if (!fixed) {
            // Desktop sizes the board off `--cell-side`, so a value left over from a
            // touch board would follow the page across a viewport change.
            this.boardEl.style.removeProperty("--cell-side");
            return;
        }

        const side = computeFittedCellSide(
            this.board.getMode(),
            this.deviceArea.width,
            this.deviceArea.height,
        );

        // `html` is `font-size: 1px`, so the `rem` the stylesheet is written in and the
        // CSS pixels measured here are the same unit.
        this.boardEl.style.setProperty("--cell-side", `${side}rem`);
    }

    private logDebugMessage(...message: any[]): void {
        if (Session.get("debug")) {
            console.debug(message);
        }
    }

}
