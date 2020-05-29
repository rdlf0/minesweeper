import { Pairer, Tuple } from "./pairer";

export class PeterPairer implements Pairer {

    public pair(t: Tuple): number {
        const shell = Math.max(t.a, t.b);
        const step = Math.min(t.a, t.b);
        let flag = 1;

        if (step == t.b) {
            flag = 0;
        }

        return shell * shell + step * 2 + flag;
    }

    public unpair(x: number): Tuple {
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

        const result: Tuple = {
            a,
            b,
        }

        return result;
    }

}
