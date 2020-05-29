import { Pairer, Tuple } from "./pairer";

export class SzudzikPairer implements Pairer {

    public pair(t: Tuple): number {
        if (t.a > t.b) {
            return t.a * t.a + t.b;
        } else {
            return t.b * t.b + t.b + t.a;
        }
    }

    public unpair(x: number): Tuple {
        const shell = Math.floor(Math.sqrt(x));

        let a: number, b: number;

        if (x - shell * shell < shell) {
            a = shell;
            b = x - shell * shell;
        } else {
            a = x - shell * shell - shell;
            b = shell;
        }

        const result: Tuple = {
            a,
            b,
        }

        return result;
    }

}
