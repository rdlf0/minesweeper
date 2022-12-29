import { Game } from "./game";
import { FIRST_CLICK, MODE_NAME, Config } from "./config";
import { CantorPairer } from "./pairer/cantorPairer";
import { BinaryToBase64UrlEncoderV2 } from "./encoder/binaryToBase64UrlEncoderV2";

const config: Config = {
    mode: MODE_NAME.Expert,
    encoder: BinaryToBase64UrlEncoderV2.prototype,
    modePairer: CantorPairer.prototype,
    firstClick: FIRST_CLICK.GuaranteedCascade,
    debug: true,
    darkModeOn: true,
    github: {
        owner: "rdlf0",
        repo: "minesweeper"
    }
}

new Game(config); // nosonar
