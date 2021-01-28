import { Encoder } from "./encoder/encoder";
import { Pairer, Tuple } from "./pairer/pairer";
import { Mode } from "./config";
import { State } from "./state";

const MODE_SIZE = 24;

export class UrlTool {

    private decodedHash: string = "";

    constructor(
        private encoder: Encoder,
        private pairer: Pairer,
    ) { }

    public isHashSet(): boolean {
        return window.location.hash.length > 1;
    }

    public extractMode(): Mode {
        try {
            this.decodedHash = this.encoder.decode(window.location.hash.slice(1));
        } catch (e) {
            console.error("Invalid hash!", e);
            return null;
        }

        const binaryMode = this.decodedHash.slice(0, MODE_SIZE);
        const decimal = parseInt(binaryMode, 2);
        let decoded: Tuple = this.pairer.unpair(decimal);

        const mines = decoded.b;

        if (mines < 1) {
            console.error("Invalid hash! Can't extract mode!");
            return null;
        }

        decoded = this.pairer.unpair(decoded.a);

        const rows = decoded.a;
        const cols = decoded.b;

        if (rows < 1 || cols < 1 || rows * cols < mines) {
            console.error("Invalid hash! Can't extract mode!");
            return null;
        }

        let mode: Mode = {
            rows,
            cols,
            mines,
        }

        return mode;
    }

    public extractState(mode: Mode): State {
        const stateString = this.decodedHash.slice(MODE_SIZE, mode.rows * mode.cols + MODE_SIZE);
        if (mode.rows * mode.cols != stateString.length) {
            console.error("Invalid hash! Can't extract state!");
            return null;
        }

        const state = new State(stateString.length);
        state.setData(stateString
            .split("")
            .map(bit => parseInt(bit))
        );

        return state;
    }

    public updateHash(mode: Mode, state: State): void {
        let encodedHash = "";

        if (mode != null && state != null) {
            const modeEncoded = this.encodeMode(mode);
            const decodedHash = modeEncoded + state;
            encodedHash = this.encoder.encode(decodedHash);
        }

        history.replaceState(undefined, undefined, `#${encodedHash}`);
    }

    private encodeMode(mode: Mode): string {
        let t: Tuple = {
            a: mode.rows,
            b: mode.cols,
        };

        let paired = this.pairer.pair(t);

        t = {
            a: paired,
            b: mode.mines,
        };

        paired = this.pairer.pair(t);

        const binary = paired.toString(2);

        return binary.padStart(MODE_SIZE, "0");
    }

}
