import { Config, FIRST_CLICK, MODE_NAME } from "./config";
import { BinaryToBase64UrlEncoderV2 } from "./encoder/binaryToBase64UrlEncoderV2";
import { Game } from "./game";
import { CantorPairer } from "./pairer/cantorPairer";

const config: Config = {
    mode: MODE_NAME.Expert,
    encoder: BinaryToBase64UrlEncoderV2.prototype,
    modePairer: CantorPairer.prototype,
    firstClick: FIRST_CLICK.GuaranteedCascade,
    debug: false,
}

new Game(config);
