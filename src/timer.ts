export class Timer {
    private intervaID: number | undefined;
    private value: number = 0;
    private bumpTimeout: number | undefined;

    constructor(private el: HTMLElement) { }

    public isStarted(): boolean {
        return this.intervaID !== undefined;
    }

    public getValue(): number {
        return this.value;
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

    public addTime(seconds: number): void {
        this.value += seconds;
        this.updateEl();

        this.el.classList.add("bump");
        if (this.bumpTimeout !== undefined) {
            window.clearTimeout(this.bumpTimeout);
        }
        this.bumpTimeout = window.setTimeout(() => this.el.classList.remove("bump"), 1000);
    }

    private updateEl(): void {
        let min = Math.floor(this.value / 60);
        let sec = this.value % 60;
        this.el.title = `${min}min ${sec}sec`;
        this.el.innerHTML = ("00" + this.value).slice(-3);
    }
}
