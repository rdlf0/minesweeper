export class Timer {
    private intervaID: number;
    private value: number = 0;

    constructor(private el: HTMLElement) { }

    public start(): void {
        this.intervaID = window.setInterval(() => {
            this.value++;
            this.updateEl();
        }, 1000);
    }

    public stop(): void {
        window.clearInterval(this.intervaID);
        this.value = 0;
        this.updateEl();
    }

    private updateEl(): void {
        this.el.innerHTML = ("000" + this.value).slice(-3);
    }
}