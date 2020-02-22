export interface Encoder {

    encode(str: string): string;

    decode(encoded: string): string;

}
