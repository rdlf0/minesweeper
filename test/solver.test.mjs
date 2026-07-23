import { test } from "node:test";
import assert from "node:assert/strict";

import { solve } from "../dist/solver/minesweeperSolver.js";

const hidden = () => ({ revealed: false, flagged: false, value: 0 });
const flag = () => ({ revealed: false, flagged: true, value: 0 });
const num = (value) => ({ revealed: true, flagged: false, value });

// Collects "row,col" strings so order-independent comparisons are easy.
const coords = (result) => result.safe.map(({ row, col }) => `${row},${col}`).sort();

test("an empty board yields no hints", () => {
    const grid = [[hidden(), hidden()], [hidden(), hidden()]];
    assert.deepEqual(solve(grid).safe, []);
});

test("a satisfied '0' clears all its hidden neighbors", () => {
    // (0,0) is a revealed 0, so its three neighbors are provably safe.
    const grid = [
        [num(0), hidden()],
        [hidden(), hidden()],
    ];
    assert.deepEqual(coords(solve(grid)), ["0,1", "1,0", "1,1"]);
    // Every returned cell carries an explanation and references the '0' at (0,0).
    for (const cell of solve(grid).safe) {
        assert.ok(cell.reason.length > 0);
        assert.deepEqual(cell.references, [[0, 0]]);
    }
});

test("a '1' next to a single flag clears its other neighbors", () => {
    // Row: [flag][1][hidden] — the 1's mine is the flag, so (0,2) is safe.
    const grid = [[flag(), num(1), hidden()]];
    assert.deepEqual(coords(solve(grid)), ["0,2"]);
});

test("a fully-forced '1' pins the mine and reports it separately from safe cells", () => {
    // [1][hidden]: the 1 forces its only hidden neighbor to be a mine.
    const grid = [[num(1), hidden()]];
    const result = solve(grid);
    assert.deepEqual(result.safe, []);
    assert.deepEqual(coords({ safe: result.mines }), ["0,1"]);
    // The mine explanation points back at the '1'.
    assert.deepEqual(result.mines[0].references, [[0, 0]]);
});

test("subset (1-1-1) deduction clears cells no single number can", () => {
    // Three 1s in a row over three hidden cells (a, b, c):
    //   [1][1][1]
    //   [a][b][c]
    // The only consistent solution is b = mine, a and c safe. Proving a/c safe
    // requires comparing two overlapping constraints, not a single number.
    const grid = [
        [num(1), num(1), num(1)],
        [hidden(), hidden(), hidden()],
    ];
    assert.deepEqual(coords(solve(grid)), ["1,0", "1,2"]);
    // b IS provably a mine, but only by building on a/c being safe — a chained
    // deduction. Only first-level hints are reported, so it must stay out.
    assert.deepEqual(solve(grid).mines, []);
});

test("a '3' beside a flag reduces to a '2' and overlaps a '1' to clear a cell", () => {
    // Bottom row: [flag][3][1][hidden].  Top row: four hidden cells.
    //   a b c d      <- (0,0)..(0,3)
    //   M 3 1 e      <- (1,0)..(1,3)
    // The flag reduces the 3 to "2 mines among {a,b,c}". The 1 covers {b,c,d,e}.
    // 2 - 1 == |{a}| forces a to be a mine and d, e to be safe — a deduction no
    // single number, nor a strict subset, can make on its own.
    const grid = [
        [hidden(), hidden(), hidden(), hidden()],
        [flag(), num(3), num(1), hidden()],
    ];
    assert.deepEqual(coords(solve(grid)), ["0,3", "1,3"]);
    // The explanation points at the two numbers involved: the 3 and the 1.
    for (const cell of solve(grid).safe) {
        assert.deepEqual(cell.references, [[1, 1], [1, 2]]);
    }
    // (0,0) is provably a mine — reported in mines, never in safe.
    const result = solve(grid);
    assert.ok(result.safe.every(({ row, col }) => !(row === 0 && col === 0)));
    assert.ok(result.mines.some(({ row, col }) => row === 0 && col === 0));
});

test("hints never lean on other hints — explanations stand on visible numbers alone", () => {
    // [0][1][1] over [a][b][x]: the solver used to chain here — the 0 proved a
    // and b safe, which internally shrank the middle 1 until it pinned x with an
    // explanation resting on those other hints. x is still found, but now via a
    // single overlap of two visible numbers (the 1 and the 0), so the
    // explanation is self-contained and both numbers highlight on hover.
    const grid = [
        [num(0), num(1), num(1)],
        [hidden(), hidden(), hidden()],
    ];
    const result = solve(grid);
    assert.deepEqual(coords(result), ["1,0", "1,1"]);
    assert.deepEqual(result.mines.map(({ row, col }) => `${row},${col}`), ["1,2"]);

    const mine = result.mines[0];
    assert.deepEqual(mine.references, [[0, 1], [0, 0]]);
    assert.ok(!mine.reason.includes("provably safe"),
        `explanation should not lean on other deductions: "${mine.reason}"`);
});

test("flagged cells are never reported as safe moves", () => {
    const grid = [[flag(), num(1), hidden()]];
    assert.ok(solve(grid).safe.every(({ row, col }) => !(row === 0 && col === 0)));
});

// Deterministic PRNG so the sweep is reproducible.
const makeRng = (seed) => {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
};

// Builds a consistent mid-game 4x4 board: random mines, correct numbers, a
// random subset of the safe cells revealed.
const makeBoard = (rng) => {
    const rows = 4, cols = 4;
    const mine = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (rng() < 0.22) mine[r][c] = true;
        }
    }
    const count = (r, c) => {
        let n = 0;
        for (let i = Math.max(r - 1, 0); i <= Math.min(r + 1, rows - 1); i++) {
            for (let j = Math.max(c - 1, 0); j <= Math.min(c + 1, cols - 1); j++) {
                if (!(i === r && j === c) && mine[i][j]) n++;
            }
        }
        return n;
    };
    return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
            const revealed = !mine[r][c] && rng() < 0.6;
            return { revealed, flagged: false, value: revealed ? count(r, c) : 0 };
        })
    );
};

// Enumerates every mine assignment to the hidden cells that satisfies all the
// revealed numbers, and returns the cells that are mine (or safe) in ALL of them.
const bruteTruth = (grid) => {
    const rows = grid.length, cols = grid[0].length;
    const unknown = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!grid[r][c].revealed && !grid[r][c].flagged) unknown.push([r, c]);
        }
    }
    const idx = new Map(unknown.map(([r, c], i) => [r * cols + c, i]));

    const constraints = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!grid[r][c].revealed) continue;
            const cells = [];
            let fixed = 0;
            for (let i = Math.max(r - 1, 0); i <= Math.min(r + 1, rows - 1); i++) {
                for (let j = Math.max(c - 1, 0); j <= Math.min(c + 1, cols - 1); j++) {
                    if (i === r && j === c) continue;
                    if (grid[i][j].flagged) { fixed++; continue; }
                    const k = idx.get(i * cols + j);
                    if (k !== undefined) cells.push(k);
                }
            }
            constraints.push({ cells, need: grid[r][c].value - fixed });
        }
    }

    const n = unknown.length;
    const alwaysMine = new Array(n).fill(true);
    const alwaysSafe = new Array(n).fill(true);
    let consistent = 0;
    for (let mask = 0; mask < (1 << n); mask++) {
        let ok = true;
        for (const con of constraints) {
            let m = 0;
            for (const k of con.cells) if (mask & (1 << k)) m++;
            if (m !== con.need) { ok = false; break; }
        }
        if (!ok) continue;
        consistent++;
        for (let k = 0; k < n; k++) {
            if (mask & (1 << k)) alwaysSafe[k] = false; else alwaysMine[k] = false;
        }
    }

    const trulySafe = new Set();
    const trulyMine = new Set();
    for (let k = 0; k < n; k++) {
        const [r, c] = unknown[k];
        if (alwaysSafe[k]) trulySafe.add(r * cols + c);
        if (alwaysMine[k]) trulyMine.add(r * cols + c);
    }
    return { trulySafe, trulyMine, consistent };
};

test("solver never reports a cell that isn't provable (randomised soundness sweep)", () => {
    const rng = makeRng(0xC0FFEE);
    for (let t = 0; t < 400; t++) {
        const grid = makeBoard(rng);
        const cols = grid[0].length;
        const { trulySafe, trulyMine, consistent } = bruteTruth(grid);
        if (consistent === 0) continue; // unreachable: the true layout is consistent

        const { safe, mines } = solve(grid);
        for (const { row, col } of safe) {
            assert.ok(trulySafe.has(row * cols + col), `board #${t}: (${row},${col}) reported safe but isn't provable`);
        }
        for (const { row, col } of mines) {
            assert.ok(trulyMine.has(row * cols + col), `board #${t}: (${row},${col}) reported mine but isn't provable`);
        }
    }
});
