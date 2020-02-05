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

    public encode() {
        let str = this.data.join("");
        console.log(str);
        let padLen = (8 - str.length % 8) % 8;
        let strPadded = str.padEnd(padLen + str.length, "0");

        console.log(strPadded);

        let bytes = strPadded.match(/.{8}/g);

        let result = bytes
            .map(b => String.fromCharCode(parseInt(b, 2)))
            .join("");

        const resultB64 = btoa(result);

        console.log(resultB64);
    }

}
