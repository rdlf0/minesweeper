import { test } from "node:test";
import assert from "node:assert/strict";

import { CantorPairer } from "../dist/pairer/cantorPairer.js";

const pairer = new CantorPairer();

test("pair() produces the known Cantor values for small tuples", () => {
    assert.equal(pairer.pair({ a: 0, b: 0 }), 0);
    assert.equal(pairer.pair({ a: 1, b: 0 }), 1);
    assert.equal(pairer.pair({ a: 0, b: 1 }), 2);
    assert.equal(pairer.pair({ a: 1, b: 1 }), 4);
});

test("unpair() inverts pair() for a range of tuples", () => {
    for (let a = 0; a < 40; a++) {
        for (let b = 0; b < 40; b++) {
            const x = pairer.pair({ a, b });
            assert.deepEqual(pairer.unpair(x), { a, b }, `round-trip failed for (${a}, ${b})`);
        }
    }
});

// This mirrors how UrlTool folds a mode into a single integer:
// pair(pair(rows, cols), mines) — then unpairs twice to recover it.
test("nested pairing round-trips the built-in game modes", () => {
    const modes = [
        { rows: 9, cols: 14, mines: 10 },   // beginner
        { rows: 16, cols: 16, mines: 40 },  // intermediate
        { rows: 16, cols: 30, mines: 99 },  // expert
    ];

    for (const { rows, cols, mines } of modes) {
        const paired = pairer.pair({ a: pairer.pair({ a: rows, b: cols }), b: mines });

        const outer = pairer.unpair(paired);
        const inner = pairer.unpair(outer.a);

        assert.equal(inner.a, rows);
        assert.equal(inner.b, cols);
        assert.equal(outer.b, mines);
    }
});
