export class BinaryEncoder {

    private constructor() {};

    public static encode(scheme: boolean[]): string {
        let bin = "";
        for (const b of scheme) {
            bin += +!!b;
        }

        console.log(scheme);
        console.log(bin);

        return "";
    }

    public static decode(figerprint: string): boolean[] {
        return [];
    }

}