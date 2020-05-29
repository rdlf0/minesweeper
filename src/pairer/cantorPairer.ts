import { Pairer, Tuple } from "./pairer";

/**
 * Implemetns Cantor pairing and inverted pairing functions
 * https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
 * https://en.wikipedia.org/wiki/Pairing_function#Inverting_the_Cantor_pairing_function
 */
export class CantorPairer implements Pairer {

    public pair(t: Tuple): number {
        return (t.a + t.b) * (t.a + t.b + 1) / 2 + t.b;
    }

    public unpair(x: number): Tuple {
        const w = Math.floor((Math.sqrt((8 * x) + 1) - 1) / 2);
        const t = (w * w + w) / 2;
        const b = x - t;
        const a = w - b;

        const result: Tuple = {
            a,
            b,
        }

        return result;
    }

}
