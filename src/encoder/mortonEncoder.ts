/**
 * Implements Morton order function (Z-Order curve)
 * https://en.wikipedia.org/wiki/Z-order_curve
 */
export class MortonEncoder {

    private constructor() { };

    public static encode(pair: Pair): number {
        let x = pair.a;
        let y = pair.b;
        let p = 0;
        let i = 0;

        while(x || y) {
            p |= (x & 1) << i;
            x >>= 1;
            p |= (y & 1) << (i + 1);
            y >>= 1;
            i += 2;
        }

        return p;
    }

    public static decode(x: number): Pair {
        let a = 0;
        let b = 0;
        let i = 0;

        while (x) {
            a |= (x & 1) << i;
            x >>= 1;
            b |= (x & 1) << i;
            x >>= 1;
            i++;
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