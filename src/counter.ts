export class Counter {
    constructor(private el: HTMLElement) { }

    public updateEl(value: number): void {
        this.el.innerHTML = ("000" + value).slice(-3);
    }
}