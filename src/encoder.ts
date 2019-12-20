/**
 * Implemetns Cantor pairing and inverted pairing functions
 * https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
 * https://en.wikipedia.org/wiki/Pairing_function#Inverting_the_Cantor_pairing_function
 */
export class Encoder {

    private constructor() {};

    public static encode(pair: Pair): number {
        return (((pair.a + pair.b) * (pair.a + pair.b + 1)) / 2) + pair.b;
    }

    public static decode(x: number): Pair {
        const w = Math.floor((Math.sqrt((8 * x) + 1) - 1) / 2);
        const t = (w * w + w) /2;
        const b = x - t;
        const a = w - b;

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