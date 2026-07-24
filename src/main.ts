import { Game } from "./game.js";
import { Config, ConfigData } from "./config.js";
import { CantorPairer } from "./pairer/cantorPairer.js";
import { BinaryToBase64UrlEncoderV2 } from "./encoder/binaryToBase64UrlEncoderV2.js";

fetch("config.json")
    .then((res) => res.json() as Promise<ConfigData>)
    .then((data) => {
        const config: Config = {
            ...data,
            encoder: BinaryToBase64UrlEncoderV2.prototype,
            modePairer: CantorPairer.prototype,
            github: {
                owner: "rdlf0",
                repo: "minesweeper",
            },
        };

        new Game(config); // nosonar
    });
