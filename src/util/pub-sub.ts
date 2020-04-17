interface callbackFunc {
    (data?: any): any;
}

export const EVENT_CELL_REVEALED = "cellRevealed";
export const EVENT_CELL_FLAGGED = "cellFlagged";
export const EVENT_CELL_UNFLAGGED = "cellUnflagged";
export const EVENT_GAME_OVER = "gameOver";
export const EVENT_SAFE_AREA_CREATED = "safeAreaCreated";

export class PubSub {
    private static events: any = {};

    public static subscribe(eventName: string, func: callbackFunc): void {
        PubSub.events[eventName] = PubSub.events[eventName] || [];
        PubSub.events[eventName].push(func);
    }

    public static unsubscribe(eventName: string, func: callbackFunc): void {
        if (PubSub.events[eventName]) {
            PubSub.events[eventName] = PubSub.events[eventName].filter((f: callbackFunc) => f != func);
        }
    }

    public static publish(eventName: string, data?: any): void {
        if (PubSub.events[eventName]) {
            PubSub.events[eventName].slice(0).forEach((f: callbackFunc) => f(data))
        }
    }
}
