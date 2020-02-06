type bit = 0 | 1;

export class State {

    private data: Array<bit> = [];

    constructor(private size: number) {
        for (let i = 0; i < size; i++) {
            this.data[i] = 0;
        }
    }

    public isHighBit(index: number): boolean {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        return this.data[index] == 1;
    }

    public setBit(index: number): void {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        this.data[index] = 1;
    }

    public unsetBit(index: number): void {
        if (index >= this.size) {
            throw "Index out of bounds!";
        }

        this.data[index] = 0;
    }

    public encode(): string {
        const str = this.data.join("");
        console.log(str);
        const padLen = (8 - str.length % 8) % 8;
        const strPadded = str.padEnd(str.length + padLen, "0");
        console.log(strPadded);
        const bytes = strPadded.match(/.{8}/g);
        const chars = bytes.map(b => String.fromCharCode(parseInt(b, 2))).join("");
        const b64 = btoa(chars);
        console.log(b64);
        const b64u = b64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        console.log(b64u);

        return b64u;
    }

    public decode(b64u: string) {
        const padLen = (4 - b64u.length % 4) % 4;
        const padded = b64u.padEnd(b64u.length + padLen, "=");
        const b64 = padded
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const chars = atob(b64);

        const bytes = chars.split("")
            .map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0"))
            .join("");

        console.log(bytes);
    }

}
