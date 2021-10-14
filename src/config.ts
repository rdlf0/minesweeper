import { Encoder } from "./encoder/encoder"
import { Pairer } from "./pairer/pairer"


export interface Config {
    mode: MODE_NAME;
    encoder: Encoder;
    modePairer: Pairer;
    firstClick: FIRST_CLICK;
    debug: boolean;
    darkModeOn: boolean;
    github: GitHub
}

interface GitHub {
    owner: string;
    repo: string;
}

export enum FIRST_CLICK {
    GuaranteedCell = 0,
    GuaranteedCascade = 1,
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

type BoardConfig = {
    readonly [name in MODE_NAME]?: Mode;
}

export const BOARD_CONFIG: BoardConfig = {
    beginner: {
        rows: 9,
        cols: 9,
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
