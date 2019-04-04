import { Game } from "./game";
import { FIRST_CLICK, MODE, Config } from "./config";

const config: Config = {
    mode: MODE.Expert,
    firstClick: FIRST_CLICK.GuaranteedCascade,
    debug: false,
}

new Game(config);