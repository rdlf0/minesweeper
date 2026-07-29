import { Encoder } from "./encoder/encoder.js"
import { Pairer } from "./pairer/pairer.js"


export interface Config {
    mode: MODE_NAME;
    encoder: Encoder;
    modePairer: Pairer;
    firstClick: FIRST_CLICK;
    hintMode: HINT_MODE;
    /** Seconds added to the timer each time a hint is shown. */
    hintCost: number;
    debug: boolean;
    darkModeOn: boolean;
    /** Mine-to-cell ratio for boards derived from the device screen (touch devices).
     * Clamped to [MIN_MINES_TO_CELLS_RATIO, MAX_MINES_TO_CELLS_RATIO]. */
    mobileMineDensity: number;
    github: GitHub
}

/** The JSON-serializable settings loaded from `config.json`. The code-only fields
 * (`encoder`, `modePairer`, `github`) are supplied in `main.ts`. */
export type ConfigData = Omit<Config, "encoder" | "modePairer" | "github">;

interface GitHub {
    owner: string;
    repo: string;
}

export enum FIRST_CLICK {
    GuaranteedNonMine = 0,
    GuaranteedCascade = 1,
}

export enum HINT_MODE {
    Mines = "mines",
    Safe = "safe",
}

export enum MODE_NAME {
    Beginner = "beginner",
    Intermediate = "intermediate",
    Expert = "expert",
    Custom = "custom",
}

export interface Mode {
    rows: number;
    cols: number;
    mines: number;
}

/** Bounds every mode must satisfy — enforced when decoding a shared board in
 * `urlTool.ts` and when deriving a board from the device screen in `util/device.ts`. */
export const MIN_ROWS = 5;
export const MIN_COLS = 5;
export const MIN_MINES_TO_CELLS_RATIO = 0.05;
export const MAX_MINES_TO_CELLS_RATIO = 0.25;

type BoardConfig = {
    readonly [name in MODE_NAME]?: Mode;
}

export const BOARD_CONFIG: BoardConfig = {
    beginner: {
        rows: 9,
        cols: 14,
        mines: 10,
    },
    intermediate: {
        rows: 16,
        cols: 16,
        mines: 40,
    },
    expert: {
        rows: 16,
        cols: 30,
        mines: 99,
    }
}
