import { Pairer, Tuple } from "./pairer";

/**
 * Implements Morton order function (Z-Order curve)
 * https://en.wikipedia.org/wiki/Z-order_curve
 */
export class MortonPairer implements Pairer {

    public pair(t: Tuple): number {
        let x = t.a;
        let y = t.b;
        let p = 0;
        let i = 0;

        while (x || y) {
            p |= (x & 1) << i;
            x >>= 1;
            p |= (y & 1) << (i + 1);
            y >>= 1;
            i += 2;
        }

        return p;
    }

    public unpair(x: number): Tuple {
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

        const result: Tuple = {
            a,
            b,
        }

        return result;
    }

}
