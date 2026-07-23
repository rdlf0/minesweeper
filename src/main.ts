import { Game } from "./game.js";
import { FIRST_CLICK, HINT_MODE, MODE_NAME, Config } from "./config.js";
import { CantorPairer } from "./pairer/cantorPairer.js";
import { BinaryToBase64UrlEncoderV2 } from "./encoder/binaryToBase64UrlEncoderV2.js";

const config: Config = {
    mode: MODE_NAME.Expert,
    encoder: BinaryToBase64UrlEncoderV2.prototype,
    modePairer: CantorPairer.prototype,
    firstClick: FIRST_CLICK.GuaranteedCascade,
    hintMode: HINT_MODE.Mines,
    hintCost: 10,
    debug: false,
    darkModeOn: true,
    github: {
        owner: "rdlf0",
        repo: "minesweeper"
    }
}

new Game(config); // nosonar
