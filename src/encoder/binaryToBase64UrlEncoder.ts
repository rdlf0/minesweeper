import { Encoder } from "./encoder";

enum Side {
    BEGINING,
    END
}

/**
 * Converts a binary string to Base64Url (RFC 4648 §5)
 */
export class BinaryToBase64UrlEncoder implements Encoder {

    public encode(binary: string): string {
        const padded = BinaryToBase64UrlEncoder.padString(binary, Side.END, 8, "0");
        const bytes = padded.match(/.{8}/g);
        const chars = bytes
            .map(b => String.fromCharCode(parseInt(b, 2)))
            .join("");
        const b64 = btoa(chars);

        const b64u = b64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return b64u;
    }

    public decode(b64u: string): string {
        const padded = BinaryToBase64UrlEncoder.padString(b64u, Side.END, 4, "=");
        const b64 = padded
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        let chars: string;
        try {
            chars = atob(b64);
        } catch (e) {
            throw "Invalid Base64Url string!";
        }

        const bytes = chars.split("")
            .map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0"))
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
