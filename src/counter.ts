const COUNTER_LENGTH = 3;
const COUNTER_PAD = "00";

export class Counter {
    constructor(private el: HTMLElement) { }

    public updateEl(value: number): void {
        let neg = value < 0 ? "-" : "";

        this.el.innerHTML = neg + (COUNTER_PAD + Math.abs(value)).slice((COUNTER_LENGTH - neg.length) * -1);
    }
}