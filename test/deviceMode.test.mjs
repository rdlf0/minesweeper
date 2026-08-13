import { test } from "node:test";
import assert from "node:assert/strict";

import {
    computeDeviceGrid,
    computeDeviceMode,
    fitsDeviceArea,
    TARGET_CELL_SIDE,
} from "../dist/util/device.js";
import {
    MIN_ROWS,
    MIN_COLS,
    MIN_MINES_TO_CELLS_RATIO,
    MAX_MINES_TO_CELLS_RATIO,
    BOARD_CONFIG,
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

// iPhone 14 portrait minus the controls bar — the grid it yields is 10x20.
const AREA = { width: 390, height: 788 };

test("a device board always matches the grid, so its own hash needs no fixed cells", () => {
    // The app writes its board's hash, so every reload decodes a board it derived itself.
    // If those dimensions ever drifted from the grid, a reload would decode a board the
    // fit rule then refuses, and the player would lose their board to a fresh one.
    const viewports = [[320, 480], [360, 784], [390, 788], [412, 859], [768, 1000]];

    for (const [width, height] of viewports) {
        const grid = computeDeviceGrid(width, height);

        for (const density of [0, 0.05, 0.18, 0.25, 0.9]) {
            const mode = computeDeviceMode(width, height, density);

            assert.equal(mode.cols, grid.cols, `cols for ${width}x${height} @ ${density}`);
            assert.equal(mode.rows, grid.rows, `rows for ${width}x${height} @ ${density}`);
        }
    }
});

test("a shared board is refused rather than shrunk below the device grid", () => {
    // Every desktop preset is wider than a phone: none of them can be played as shared.
    for (const [name, mode] of Object.entries(BOARD_CONFIG)) {
        assert.equal(
            fitsDeviceArea(mode, AREA.width, AREA.height),
            false,
            `${name} should not fit a phone`,
        );
    }

    // A board shared from another phone of the same size is exactly the grid, so it fits.
    assert.equal(fitsDeviceArea({ rows: 20, cols: 10, mines: 36 }, AREA.width, AREA.height), true);
    // As does anything smaller, on either axis.
    assert.equal(fitsDeviceArea({ rows: 18, cols: 9, mines: 29 }, AREA.width, AREA.height), true);
    // One row over the grid is one row too many.
    assert.equal(fitsDeviceArea({ rows: 21, cols: 10, mines: 37 }, AREA.width, AREA.height), false);
    assert.equal(fitsDeviceArea({ rows: 20, cols: 11, mines: 39 }, AREA.width, AREA.height), false);
});
