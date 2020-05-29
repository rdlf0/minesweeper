export interface Pairer {

    pair(t: Tuple): number;

    unpair(x: number): Tuple;
}

export interface Tuple {
    a: number,
    b: number,
}
