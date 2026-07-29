import {
    EVENT_CELL_CLICKED,
    EVENT_CELL_REVEALED,
    EVENT_CELL_FLAGGED,
    EVENT_CELL_UNFLAGGED,
    EVENT_GAME_OVER,
    PubSub,
} from "./util/pub-sub.js";
import { Session } from "./util/session.js";
import {
    isTouchDevice,
    vibrate,
    LONG_PRESS_MS,
    LONG_PRESS_MOVE_TOLERANCE,
} from "./util/device.js";

/** Double buzz when a mine goes off. Flagging gets no buzz from us — Android already
 * fires its own haptic on a press-and-hold. */
const HAPTIC_EXPLOSION = [80, 40, 160];

/** The listeners a cell needs on touch: a tap reveals, a press-and-hold flags. */
const TOUCH_EVENTS = ["click", "pointerdown", "pointermove", "pointerup", "pointercancel"];

enum CellState {
    Default = "default",
    Flagged = "flagged",
    Questioned = "questioned",
    Revealed = "revealed",
    RevealedMine = "revealedMine",
    Exploded = "exploded",
    WronglyFlagged = "wronglyFlagged",
}

const VALUE_DEFAULT = -2;
const VALUE_MINE = -1;

export class Cell {

    private value: number;
    private el: HTMLElement;
    private state: CellState;
    private longPressTimeout: number | undefined;
    private pressX: number = 0;
    private pressY: number = 0;
    private suppressClick: boolean = false;

    constructor(
        private row: number,
        private col: number,
    ) {
        this.value = VALUE_DEFAULT;
        this.createHTMLElement();
        this.setState(CellState.Default);
    }

    public setValue(value: number): void {
        this.value = value;
        this.el.classList.add(`cell-value-${this.value.toString()}`);
    }

    private createHTMLElement(): void {
        this.el = document.createElement("div");
        this.el.classList.add("cell");

        if (isTouchDevice()) {
            TOUCH_EVENTS.forEach(type => this.el.addEventListener(type, this));
        } else {
            this.el.addEventListener("click", this);
            this.el.addEventListener("contextmenu", this);
        }
    }

    public getRow(): number {
        return this.row;
    }

    public getCol(): number {
        return this.col;
    }

    public getElement(): HTMLElement {
        return this.el;
    }

    private setState(state: CellState): void {
        this.el.classList.remove(`state-${this.state}`);
        this.el.classList.add(`state-${state}`);
        this.state = state;
    }

    public setMine(): void {
        this.value = VALUE_MINE;

        if (Session.get("debug") === true) {
            this.el.classList.add("debug-mine");
        }
    }

    public unsetMine(): void {
        this.value = VALUE_DEFAULT;
        this.el.classList.remove("debug-mine");
    }

    public isMine(): boolean {
        return this.value == VALUE_MINE;
    }

    public isFlagged(): boolean {
        return this.state === CellState.Flagged;
    }

    public isRevealed(): boolean {
        return this.state === CellState.Revealed;
    }

    public getValue(): number {
        return this.value;
    }

    public setHint(reason: string, danger: boolean): void {
        this.el.classList.add("hint");
        if (danger) {
            this.el.classList.add("hint-danger");
        }
        this.el.setAttribute("title", reason);
    }

    public clearHint(): void {
        this.el.classList.remove("hint", "hint-danger");
        this.el.removeAttribute("title");
    }

    public addReference(kind: string): void {
        this.el.classList.add(`hint-ref-${kind}`);
    }

    public clearReference(): void {
        this.el.classList.remove("hint-ref-a", "hint-ref-b");
    }

    public setWronglyFlagged(): void {
        this.setState(CellState.WronglyFlagged);
    }

    public reveal(): void {
        if (this.state !== CellState.Default) return;

        PubSub.publish(EVENT_CELL_CLICKED, this);

        if (this.isMine()) {
            this.explode();
            return;
        }

        this.setState(CellState.Revealed);
        PubSub.publish(EVENT_CELL_REVEALED, this);
    }

    private explode(): void {
        this.setState(CellState.Exploded);
        vibrate(HAPTIC_EXPLOSION);
        PubSub.publish(EVENT_GAME_OVER);
    }

    public revealMine(): void {
        // Leave flags
        if (this.state === CellState.Flagged) return;

        // Reveal not exploded mines
        if (this.state !== CellState.Exploded) {
            this.setState(CellState.RevealedMine)
        }
    }

    public revealFlag(): void {
        if (this.state === CellState.Default) {
            this.mark();
        } else if (this.state === CellState.Questioned) {
            // :)
            this.mark();
            this.mark();
        }
    }

    private mark(): void {
        if (this.state == CellState.Revealed) return;

        switch (this.state) {
            case CellState.Default:
                this.setState(CellState.Flagged);
                PubSub.publish(EVENT_CELL_FLAGGED)
                break;
            case CellState.Flagged:
                this.setState(CellState.Questioned);
                PubSub.publish(EVENT_CELL_UNFLAGGED);
                break;
            case CellState.Questioned:
                this.setState(CellState.Default);
                break;
        }
    }

    public handleEvent(e: Event) {
        switch (e.type) {
            case "click":
                if (!isTouchDevice()) {
                    this.reveal();
                    break;
                }

                // A press-and-hold already acted on this cell; swallow its trailing click.
                if (this.suppressClick) {
                    this.suppressClick = false;
                    break;
                }

                this.reveal();
                break;
            case "pointerdown":
                this.startLongPress(e as PointerEvent);
                break;
            case "pointermove":
                this.cancelLongPressIfDragged(e as PointerEvent);
                break;
            case "pointerup":
            case "pointercancel":
                this.cancelLongPress();
                break;
            case "contextmenu":
                e.preventDefault();
                this.mark();
                break;
        }
    }

    /** Arms the press-and-hold that flags. */
    private startLongPress(e: PointerEvent): void {
        this.suppressClick = false;
        this.pressX = e.clientX;
        this.pressY = e.clientY;

        this.longPressTimeout = window.setTimeout(() => {
            this.longPressTimeout = undefined;
            // Deliberately no vibrate() here — Android fires its own haptic on a
            // press-and-hold, and ours on top of it lands as a double buzz.
            this.mark();
            // Otherwise the release would reveal a cell the hold just cycled back to default.
            this.suppressClick = true;
        }, LONG_PRESS_MS);
    }

    /** A finger that travels is swiping, not holding. Touch pointers are implicitly
     * captured, so these moves keep arriving here even once it leaves the cell. */
    private cancelLongPressIfDragged(e: PointerEvent): void {
        if (this.longPressTimeout === undefined) {
            return;
        }

        if (Math.abs(e.clientX - this.pressX) > LONG_PRESS_MOVE_TOLERANCE ||
            Math.abs(e.clientY - this.pressY) > LONG_PRESS_MOVE_TOLERANCE) {
            this.cancelLongPress();
        }
    }

    private cancelLongPress(): void {
        if (this.longPressTimeout !== undefined) {
            window.clearTimeout(this.longPressTimeout);
            this.longPressTimeout = undefined;
        }
    }

    /** Stops the cell responding to input once the game is over. */
    public deactivate(): void {
        this.cancelLongPress();

        TOUCH_EVENTS.forEach(type => this.el.removeEventListener(type, this));
        this.el.removeEventListener("contextmenu", this);
        this.el.addEventListener("contextmenu", e => e.preventDefault());
    }
}
