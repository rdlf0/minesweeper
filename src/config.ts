export interface Config {
    mode: MODE;
    firstClick: FIRST_CLICK;
    debug: boolean;
}

export enum FIRST_CLICK {
    GuaranteedCell = 0,
    GuaranteedCascade = 1
}

export enum MODE {
    Beginner = "beginner",
    Intermediate = "intermediate",
    Expert = "expert"
};

interface BoardPreset {
    rows: number;
    cols: number;
    mines: number;
}

type BoardConfig = {
    readonly [mode in MODE]: BoardPreset;
}

export const BOARD_CONFIG: BoardConfig = {
    beginner: {
        rows: 9,
        cols: 9,
        mines: 10
    },
    intermediate: {
        rows: 16,
        cols: 16,
        mines: 40
    },
    expert: {
        rows: 16,
        cols: 30,
        mines: 99
    }
}