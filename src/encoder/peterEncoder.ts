export class PeterEncoder {

    private constructor() { };

    public static encode(pair: Pair): number {
        const shell = Math.max(pair.a, pair.b);
        const step = Math.min(pair.a, pair.b);
        let flag = 1;

        if (step == pair.b) {
            flag = 0;
        }

        return shell * shell + step * 2 + flag;
    }

    public static decode(x: number): Pair {
        const shell = Math.floor(Math.sqrt(x));
        const remainder = x - shell * shell;
        const step = Math.floor(remainder / 2);

        let a: number, b: number;

        if (remainder % 2 == 0) {
            a = shell;
            b = step;
        } else {
            a = step;
            b = shell;
        }

        const result: Pair = {
            a,
            b
        }

        return result;
    }

}

export interface Pair {
    a: number,
    b: number
}