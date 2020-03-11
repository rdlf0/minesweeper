import { Encoder } from "./encoder/encoder";
import { Pairer, Tuple } from "./pairer/pairer";
import { Mode } from "./config";
import { State } from "./state";

const MODE_SIZE = 24;

export class UrlTool {

    private decodedHash: string = "";

    constructor(
        private encoder: Encoder,
        private pairer: Pairer) {
    }

    public isHashSet(): boolean {
        return window.location.hash.length > 1;
    }

    private getDecodedHash(): string {
        if (this.isHashSet() && this.decodedHash.length == 0) {
            this.decodedHash = this.encoder.decode(window.location.hash.slice(1));
        }

        return this.decodedHash;
    }

    public extractMode(): Mode {
        const hash = this.getDecodedHash();
        const binaryMode = hash.slice(0, MODE_SIZE);
        const decimal = parseInt(binaryMode, 2);
        let decoded: Tuple = this.pairer.unpair(decimal);

        const mines = decoded.b;

        decoded = this.pairer.unpair(decoded.a);

        const rows = decoded.a;
        const cols = decoded.b;

        let result: Mode = {
            rows,
            cols,
            mines
        }

        return result;
    }

    public extractState(mode: Mode): State {
        const hash = this.getDecodedHash();
        const stateString = hash.slice(MODE_SIZE, mode.rows * mode.cols + MODE_SIZE);
        const state = new State(stateString.length);
        state.setData(stateString
            .split("")
            .map(bit => parseInt(bit))
        );

        return state;
    }

    public updateHash(mode: Mode, state: State): void {
        const modeEncoded = this.encodeMode(mode);
        const decodedHash = modeEncoded + state;
        const encodedHash = this.encoder.encode(decodedHash);

        history.replaceState(undefined, undefined, "#" + encodedHash);
    }

    private encodeMode(mode: Mode): string {
        let t: Tuple = {
            a: mode.rows,
            b: mode.cols
        };

        let paired = this.pairer.pair(t);

        t = {
            a: paired,
            b: mode.mines
        };

        paired = this.pairer.pair(t);

        const binary = paired.toString(2);

        return binary.padStart(MODE_SIZE, "0");
    }

}
