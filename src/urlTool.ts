import { Encoder } from "./encoder/encoder.js";
import { Pairer, Tuple } from "./pairer/pairer.js";
import { Mode, MIN_ROWS, MIN_COLS, MAX_MINES_TO_CELLS_RATIO } from "./config.js";
import { State } from "./state.js";

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

    public extractMode(): Mode | null {
        try {
            this.decodedHash = this.encoder.decode(window.location.hash.slice(1));
        } catch (e) {
            // Log the message, not the Error — its stack only points into the encoder
            // and says nothing the message doesn't.
            console.error(`Invalid hash! ${e instanceof Error ? e.message : String(e)}`);
            return null;
        }

        const binaryMode = this.decodedHash.slice(0, MODE_SIZE);
        const decimal = parseInt(binaryMode, 2);
        let decoded: Tuple = this.pairer.unpair(decimal);

        const mines = decoded.b;

        if (mines < 1) {
            console.error(`Invalid hash! Decoded a board with no mines (${mines}).`);
            return null;
        }

        decoded = this.pairer.unpair(decoded.a);

        const rows = decoded.a;
        const cols = decoded.b;

        if (rows < MIN_ROWS || cols < MIN_COLS) {
            console.error(`Invalid hash! Decoded board ${cols}x${rows} is below the ${MIN_COLS}x${MIN_ROWS} minimum.`);
            return null;
        }

        if (mines > rows * cols * MAX_MINES_TO_CELLS_RATIO) {
            console.error(`Invalid hash! Decoded board ${cols}x${rows} packs ${mines} mines, over the ${MAX_MINES_TO_CELLS_RATIO} limit.`);
            return null;
        }

        return {
            rows,
            cols,
            mines,
        }
    }

    public extractState(mode: Mode): State | null {
        const expectedLength = mode.rows * mode.cols;
        const stateString = this.decodedHash.slice(MODE_SIZE, expectedLength + MODE_SIZE);

        // A hash that stops after the mode is well-formed — it just asks for a fresh
        // board of that size. The PWA shortcuts in manifest.webmanifest are exactly this.
        if (stateString.length === 0) {
            console.warn("Hash carries a mode but no mine layout. Planting a new board.");
            return null;
        }

        // Some layout bits are present but they don't fill the board: truncated or corrupt.
        if (stateString.length !== expectedLength) {
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

    public updateHash(mode: Mode | null, state: State | null): void {
        let encodedHash = "";

        if (mode != null && state != null) {
            const modeEncoded = this.encodeMode(mode);
            const decodedHash = modeEncoded + state;
            encodedHash = this.encoder.encode(decodedHash);
        }

        history.replaceState(undefined, "", `#${encodedHash}`);
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
