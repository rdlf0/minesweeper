/**
 * A pure, dependency-free Minesweeper solver.
 *
 * It operates on a read-only snapshot of the board's *visible* state (what a
 * player can see) and returns the cells that are provably safe to reveal and the
 * cells that are provably mines, each with a short human-readable explanation of
 * why. It never guesses: a cell is reported only when logic guarantees its state.
 *
 * Two deduction rules are applied, each judged against the *visible* board only
 * (revealed numbers and flags):
 *  1. Single-number — a revealed number whose mines are all flagged makes its
 *     remaining hidden neighbors safe (and, conversely, pins mines).
 *  2. Overlap — for two numbers A and B sharing hidden cells, if A needs exactly
 *     as many more mines than B as it has cells B lacks, then every cell unique
 *     to A is a mine and every cell unique to B is safe. This is the general form
 *     of the classic 1-2-1 / 1-1 patterns and the reduced-number cases (e.g. a
 *     "3" next to a flag behaves like a "2"); the subset rule is its special case.
 *
 * Deductions are deliberately NOT fed back for further rounds — only
 * "first-level" hints are reported. A chained conclusion rests on other hints,
 * so its explanation can't be verified by just looking at the board; everything
 * reported here is checkable directly against what the player can see.
 *
 * The caller chooses which set to surface (safe cells or mines); the DOM knows
 * nothing about this module.
 */

export interface CellView {
    revealed: boolean;
    flagged: boolean;
    /** Adjacent-mine count; only meaningful when `revealed` is true. */
    value: number;
}

export interface HintCell {
    row: number;
    col: number;
    reason: string;
    /**
     * The revealed number cells the explanation talks about, so the UI can
     * highlight them when the player inspects this hint.
     */
    references: Array<[number, number]>;
}

export interface SolveResult {
    /** Cells provably safe to reveal. */
    safe: HintCell[];
    /** Cells provably containing a mine. */
    mines: HintCell[];
}

type Coord = [number, number];

const UNKNOWN = 0;
const SAFE = 1;
const MINE = 2;

interface Constraint {
    row: number;
    col: number;
    value: number;
    cells: Coord[];
    mines: number;
}

export function solve(grid: CellView[][]): SolveResult {
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;

    const status: number[][] = grid.map(row => row.map(() => UNKNOWN));
    const reasons = new Map<number, string>();
    const references = new Map<number, Coord[]>();

    const key = (r: number, c: number): number => r * cols + c;

    const record = (r: number, c: number, reason: string, refs: Coord[]): void => {
        reasons.set(key(r, c), reason);
        references.set(key(r, c), refs);
    };

    const neighbors = (r: number, c: number): Coord[] => {
        const result: Coord[] = [];
        for (let i = Math.max(r - 1, 0); i <= Math.min(r + 1, rows - 1); i++) {
            for (let j = Math.max(c - 1, 0); j <= Math.min(c + 1, cols - 1); j++) {
                if (i === r && j === c) continue;
                result.push([i, j]);
            }
        }
        return result;
    };

    const markSafe = (r: number, c: number, reason: string, refs: Coord[]): boolean => {
        if (status[r][c] !== UNKNOWN) return false;
        status[r][c] = SAFE;
        record(r, c, reason, refs);
        return true;
    };

    const markMine = (r: number, c: number, reason: string, refs: Coord[]): boolean => {
        if (status[r][c] !== UNKNOWN) return false;
        status[r][c] = MINE;
        record(r, c, reason, refs);
        return true;
    };

    // A constraint is a revealed number reduced to its hidden, unflagged
    // neighbors, with flagged neighbors subtracted from the required count.
    // Only *visible* facts go in — deductions are never folded back, so every
    // constraint (and thus every explanation) is checkable on the board.
    const buildConstraints = (): Constraint[] => {
        const constraints: Constraint[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!grid[r][c].revealed) continue;
                let mines = grid[r][c].value;
                const cells: Coord[] = [];
                for (const [nr, nc] of neighbors(r, c)) {
                    if (grid[nr][nc].revealed) continue;
                    if (grid[nr][nc].flagged) {
                        mines--;
                    } else {
                        cells.push([nr, nc]);
                    }
                }
                if (cells.length > 0) {
                    constraints.push({ row: r, col: c, value: grid[r][c].value, cells, mines });
                }
            }
        }
        return constraints;
    };

    // A single pass over constraints built purely from the visible board. Each
    // deduction below stands on its own — none relies on another, so there is
    // no fixpoint iteration and no stale-snapshot hazard.
    const constraints = buildConstraints();

    // Single-number deduction.
    for (const con of constraints) {
        if (con.mines === 0) {
            const reason = con.value === 0
                ? "The highlighted 0 touches no mines at all, so this neighboring cell is safe."
                : `The highlighted ${con.value} already has all of its mines flagged, so this bordering cell can't be a mine.`;
            for (const [r, c] of con.cells) {
                markSafe(r, c, reason, [[con.row, con.col]]);
            }
        } else if (con.mines === con.cells.length) {
            const reason = con.cells.length === 1
                ? `The highlighted ${con.value} still needs 1 mine and this is its only hidden neighbor left, so it must be a mine.`
                : `The highlighted ${con.value} still needs ${con.mines} mines and has exactly ${con.cells.length} hidden neighbors left, so every one of them — including this cell — must be a mine.`;
            for (const [r, c] of con.cells) {
                markMine(r, c, reason, [[con.row, con.col]]);
            }
        }
    }

    // Overlap deduction. Iterating ordered pairs covers both directions, so
    // this subsumes the plain subset case (when `a` has no unique cells).
    // Every pair reasons from visible facts alone, so each firing is
    // independently sound regardless of what other pairs concluded.
    for (const a of constraints) {
        for (const b of constraints) {
            if (a === b) continue;

            const aOnly = subtract(a.cells, b.cells, cols);
            // The two numbers must actually share a cell to constrain each other.
            if (aOnly.length === a.cells.length) continue;

            // `a` needs exactly |aOnly| more mines than `b`, so those extra
            // mines can only sit in `a`'s unique cells — pinning them as mines
            // and forcing `b`'s unique cells safe.
            const surplus = a.mines - b.mines;
            if (surplus !== aOnly.length) continue;

            const bOnly = subtract(b.cells, a.cells, cols);

            // On hover the two referenced numbers are highlighted in distinct
            // colors (reference 0 = orange, 1 = purple), named in the wording so
            // the player can tell them apart. The explanations quote each number's
            // *remaining* mines (a.mines / b.mines), which can be lower than the
            // face value when some of its mines are flagged — quoting the face
            // value here would read as a contradiction when both match.
            // Keep the color words in sync with styles.css.
            const refs: Coord[] = [[a.row, a.col], [b.row, b.col]];

            let mineReason: string;
            let safeReason: string;
            if (b.mines === 0) {
                // The purple number is fully satisfied, so "needs only 0" would
                // sound absurd — say directly that its cells are all clear and
                // the orange number's mines must avoid them.
                const purple = b.value === 0
                    ? "the purple 0 touches no mines at all"
                    : `the purple ${b.value} already has ${b.value === 1 ? "its mine" : "all of its mines"} flagged`;
                mineReason = aOnly.length === 1
                    ? `While ${purple}, the orange ${a.value} still needs 1 mine — so it must be here, in the only cell the orange ${a.value} touches and the purple ${b.value} doesn't.`
                    : `While ${purple}, the orange ${a.value} still needs ${a.mines} mines — and they can only be in the cells the orange ${a.value} touches and the purple ${b.value} doesn't, like this one.`;
                safeReason = `Since ${purple}, every cell it touches — including this one — is safe.`;
            } else {
                const premise = `The orange ${a.value} still needs ${a.mines} ${plural(a.mines)} among the cells it touches while the purple ${b.value} needs only ${b.mines}, so the difference can only fall in the cells that just the orange ${a.value} touches`;
                mineReason = `${premise} — and this is one of them.`;
                safeReason = surplus === 0
                    ? `Every cell the orange ${a.value} touches is also touched by the purple ${b.value}, and both still need the same number of mines — so the purple ${b.value}'s other cells, including this one, are safe.`
                    : `${premise} — leaving this cell, touched only by the purple ${b.value}, safe.`;
            }

            for (const [r, c] of aOnly) {
                markMine(r, c, mineReason, refs);
            }
            for (const [r, c] of bOnly) {
                markSafe(r, c, safeReason, refs);
            }
        }
    }

    const safe: HintCell[] = [];
    const mines: HintCell[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (status[r][c] === UNKNOWN) continue;
            const cell: HintCell = {
                row: r,
                col: c,
                reason: reasons.get(key(r, c))!,
                references: references.get(key(r, c))! as Array<[number, number]>,
            };
            (status[r][c] === SAFE ? safe : mines).push(cell);
        }
    }
    return { safe, mines };
}

function subtract(b: Coord[], a: Coord[], cols: number): Coord[] {
    const aKeys = new Set(a.map(([r, c]) => r * cols + c));
    return b.filter(([r, c]) => !aKeys.has(r * cols + c));
}

function plural(n: number): string {
    return n === 1 ? "mine" : "mines";
}
