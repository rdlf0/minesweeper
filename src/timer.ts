export class Timer {
    private intervaID: number;
    private value: number = 0;

    constructor(private el: HTMLElement) { }

    public isStarted(): boolean {
        return this.intervaID !== undefined;
    }

    public start(): void {
        this.intervaID = window.setInterval(() => {
            this.value++;
            this.updateEl();
        }, 1000);
    }

    public stop(): void {
        if (this.intervaID !== undefined) {
            window.clearInterval(this.intervaID);
        }
    }

    public reset(): void {
        this.value = 0;
        this.intervaID = undefined;
        this.updateEl();
    }

    private updateEl(): void {
        this.el.innerHTML = ("000" + this.value).slice(-3);
    }
}