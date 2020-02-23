import { Encoder } from "./encoder/encoder";
import { Pairer, Tuple } from "./pairer/pairer";
import { Mode } from "./config";
import { State } from "./state";

const MODE_SIZE = 24;

export class UrlTool {

    constructor(
        private encoder: Encoder,
        private statePairer: Pairer) {
    }

    public isHashSet(): boolean {
        return window.location.hash.length > 1;
    }

    public getDecodedHash(): string {
        if (this.isHashSet()) {
            return this.encoder.decode(window.location.hash.slice(1));
        }

        return "";
    }

    // private isHashValid(): boolean {

    // }

    public extractMode(hash: string): Mode {
        const binaryMode = hash.slice(0, MODE_SIZE);
        const decimal = parseInt(binaryMode, 2);
        let decoded: Tuple = this.statePairer.unpair(decimal);

        const mines = decoded.b;

        decoded = this.statePairer.unpair(decoded.a);

        const rows = decoded.a;
        const cols = decoded.b;

        let result: Mode = {
            rows,
            cols,
            mines
        }

        return result;
    }

    public extractState(hash: string, mode: Mode): State {
        const stateString = hash.slice(MODE_SIZE, mode.rows * mode.cols + MODE_SIZE);
        const state = new State(hash.length);
        state.setData(stateString.split("").map(bit => +bit));

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

        let encoded = this.statePairer.pair(t);

        t = {
            a: encoded,
            b: mode.mines
        };

        encoded = this.statePairer.pair(t);

        const encodedBinary = encoded.toString(2);

        return encodedBinary.padStart(MODE_SIZE, "0");
    }

}
