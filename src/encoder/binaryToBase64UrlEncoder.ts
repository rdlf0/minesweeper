import { Encoder } from "./encoder";

enum side {
    BEGINING,
    END
}

/**
 * Converts a binary string to Base64Url (RFC 4648 §5)
 */
export class BinaryToBase64UrlEncoder implements Encoder {

    public encode(binary: string): string {
        const padded = BinaryToBase64UrlEncoder.padString(binary, side.END, 8, "0");
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
        const padded = BinaryToBase64UrlEncoder.padString(b64u, side.END, 4, "=");
        const b64 = padded
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const chars = atob(b64);

        const bytes = chars.split("")
            .map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0"))
            .join("");

        return bytes;
    }

    private static padString(str: string, s: side, factor: number, char: string): string {
        const padLen = (factor - str.length % factor) % factor;

        if (s == side.BEGINING) {
            return str.padStart(str.length + padLen, char);
        }

        return str.padEnd(str.length + padLen, char);
    }
}
