type ValueType = string | number | boolean;

export class Session {

    private static data = new Map<string, ValueType>();

    public static set(key: string, value: ValueType): void {
        Session.data.set(key, value);
    }

    public static get(key: string, defaultValue?: ValueType): ValueType {
        if (Session.data.has(key)) {
            return Session.data.get(key);
        }

        return defaultValue;
    }

    public static reset(): void {
        Session.data.clear();
    }

    public static toString(): string {
        return Array.from(Session.data).join("\r\n");
    }

}
