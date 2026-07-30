import { test } from "node:test";
import assert from "node:assert/strict";

import { computeDeviceMode, TARGET_CELL_SIDE } from "../dist/util/device.js";
import {
    MIN_ROWS,
    MIN_COLS,
    MIN_MINES_TO_CELLS_RATIO,
    MAX_MINES_TO_CELLS_RATIO,
} from "../dist/config.js";
import { CantorPairer } from "../dist/pairer/cantorPairer.js";

// The mode is packed into a fixed 24-bit prefix of the hash (MODE_SIZE in urlTool.ts),
// so any derived board must pair below this or the shared URL silently corrupts.
const MODE_MAX = 2 ** 24 - 1;

// Mirrors UrlTool.encodeMode: pair(pair(rows, cols), mines).
function pairMode(mode) {
    const pairer = new CantorPairer();
    const rowsCols = pairer.pair({ a: mode.rows, b: mode.cols });

    return pairer.pair({ a: rowsCols, b: mode.mines });
}

test("cells land close to the target touch size on a phone viewport", () => {
    // iPhone 14 portrait, minus the controls bar.
    const mode = computeDeviceMode(390, 788, 0.18);

    assert.equal(mode.cols, 10); // 390 / 40 = 9.75 -> 10
    assert.equal(mode.rows, 20); // 788 / 40 = 19.7 -> 20

    // Every cell stays within a few px of the target once the 1fr tracks stretch.
    assert.ok(Math.abs(390 / mode.cols - TARGET_CELL_SIDE) < 5);
    assert.ok(Math.abs(788 / mode.rows - TARGET_CELL_SIDE) < 5);
});

test("a tiny viewport is still clamped to a playable board", () => {
    const mode = computeDeviceMode(100, 120, 0.18);

    assert.ok(mode.rows >= MIN_ROWS);
    assert.ok(mode.cols >= MIN_COLS);
    assert.ok(mode.mines >= 1);
});

test("density is clamped to the ratio bounds", () => {
    const cells = 10 * 20;

    const tooDense = computeDeviceMode(390, 788, 0.9);
    assert.ok(tooDense.mines <= cells * MAX_MINES_TO_CELLS_RATIO);
    assert.equal(tooDense.mines, Math.floor(cells * MAX_MINES_TO_CELLS_RATIO));

    const tooSparse = computeDeviceMode(390, 788, 0);
    assert.equal(tooSparse.mines, Math.floor(cells * MIN_MINES_TO_CELLS_RATIO));
});

test("derived boards always pass the hash validation in urlTool", () => {
    // Phone through to a large tablet, across the full density range.
    const viewports = [[320, 480], [390, 788], [414, 840], [768, 1000], [1024, 1310]];
    const densities = [0, 0.05, 0.18, 0.25, 0.9];

    for (const [width, height] of viewports) {
        for (const density of densities) {
            const mode = computeDeviceMode(width, height, density);

            assert.ok(mode.rows >= MIN_ROWS, `rows for ${width}x${height}`);
            assert.ok(mode.cols >= MIN_COLS, `cols for ${width}x${height}`);
            assert.ok(mode.mines >= 1, `mines for ${width}x${height}`);
            assert.ok(
                mode.mines <= mode.rows * mode.cols * MAX_MINES_TO_CELLS_RATIO,
                `mine ratio for ${width}x${height} @ ${density}`,
            );
            assert.ok(
                pairMode(mode) <= MODE_MAX,
                `mode pairs within 24 bits for ${width}x${height} @ ${density}`,
            );
        }
    }
});
