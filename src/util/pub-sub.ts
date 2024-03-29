import { Session } from "./session";

interface CallbackFunc {
    (data?: any): any;
}

export const EVENT_CELL_CLICKED = "cellClicked";
export const EVENT_CELL_REVEALED = "cellRevealed";
export const EVENT_CELL_FLAGGED = "cellFlagged";
export const EVENT_CELL_UNFLAGGED = "cellUnflagged";
export const EVENT_GAME_OVER = "gameOver";
export const EVENT_SAFE_AREA_CREATED = "safeAreaCreated";
export const EVENT_SETTINGS_CHANGED = "settingsChanged";

export class PubSub {

    private constructor() { } // nosonar

    private static events: { [eventName: string]: Array<CallbackFunc> } = {};

    public static subscribe(eventName: string, func: CallbackFunc): void {
        PubSub.events[eventName] = PubSub.events[eventName] || [];
        PubSub.events[eventName].push(func);
    }

    public static unsubscribe(eventName: string, func: CallbackFunc): void {
        if (PubSub.events[eventName]) {
            PubSub.events[eventName] = PubSub.events[eventName].filter((f: CallbackFunc) => f != func);
        }
    }

    public static publish(eventName: string, data?: any): void {
        if (PubSub.events[eventName]) {
            if (Session.get("debug")) {
                console.debug(`EVENT: ${eventName}, DATA: ${JSON.stringify(data)}`);
            }
            PubSub.events[eventName].forEach((f: CallbackFunc) => f(data))
        }
    }
}
