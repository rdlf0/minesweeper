type ValueType = string | number | boolean;

export class Session {

    private constructor() { };

    private static data: Map<string, ValueType> = new Map();

    public static set(key: string, value: ValueType): void {
        if (Session.get("debug")) {
            console.debug(`SESSION SET: ${key} = ${value}`);
        }

        Session.data.set(key, value);
    }

    public static get(key: string, defaultValue?: ValueType): ValueType {
        if (Session.data.has(key)) {
            return Session.data.get(key);
        }

        return defaultValue;
    }

    public static clear(): void {
        if (Session.get("debug")) {
            console.debug("SESSION CLEARED");
        }

        Session.data.clear();
    }

    public static toString(): string {
        return Array.from(Session.data).join("\r\n");
    }

}
