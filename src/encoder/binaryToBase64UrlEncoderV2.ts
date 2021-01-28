import { Encoder } from "./encoder";

enum Side {
    BEGINING,
    END
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Converts a binary string to Base64Url (RFC 4648 §5)
 *
 * This version uses direct conversion at bit level using custom alphabet
 */
export class BinaryToBase64UrlEncoderV2 implements Encoder {

    public encode(binary: string): string {
        const padded = BinaryToBase64UrlEncoderV2.padString(binary, Side.END, 6, "0");
        const b64u = padded.match(/.{6}/g)
            .map(sextet => ALPHABET[parseInt(sextet, 2)])
            .join("");

        return b64u;
    }

    public decode(b64u: string): string {
        const bytes = b64u.split("")
            .map(ch => {
                const index = ALPHABET.indexOf(ch);
                if (index == -1) {
                    throw "Invalid Base64Url string!";
                }

                return index;
            })
            .map(idx => idx.toString(2).padStart(6, "0"))
            .join("");

        return bytes;
    }

    private static padString(str: string, s: Side, factor: number, char: string): string {
        const padLen = (factor - str.length % factor) % factor;

        if (s == Side.BEGINING) {
            return str.padStart(str.length + padLen, char);
        }

        return str.padEnd(str.length + padLen, char);
    }
}
