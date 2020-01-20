export class SzudzikEncoder {

    private constructor() {};

    public static encode(pair: Pair): number {
        if (pair.a > pair.b) {
            return pair.a * pair.a + pair.b;
        } else {
            return pair.b * pair.b + pair.b + pair.a;
        }
    }

    public static decode(x: number): Pair {
        const shell = Math.floor(Math.sqrt(x));

        let a: number, b: number;

        if (x - shell * shell < shell) {
            a = shell;
            b = x - shell * shell;
        } else {
            a = x - shell * shell - shell;
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