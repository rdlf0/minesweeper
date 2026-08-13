import {
    Mode,
    MIN_ROWS,
    MIN_COLS,
    MIN_MINES_TO_CELLS_RATIO,
    MAX_MINES_TO_CELLS_RATIO,
} from "../config.js";

/** Cell size a finger can comfortably hit, in CSS pixels. */
export const TARGET_CELL_SIDE = 40;

/** Height of the controls bar on touch devices. Must match the `#controls` height
 * in the `@media (pointer: coarse)` block of `styles.css`. */
export const MOBILE_CONTROLS_HEIGHT = 56;

/** How long a press must be held before it flags. */
export const LONG_PRESS_MS = 250;

/** A press that drifts further than this (in px) is a drag, not a hold. */
export const LONG_PRESS_MOVE_TOLERANCE = 10;

/** Buzzes the device. A no-op wherever the Vibration API is absent (iOS Safari, most
 * desktops), and silently dropped by Android when the phone is on silent or has system
 * touch feedback turned off — which is the only control players need over it. */
export function vibrate(pattern: number | number[]): void {
    navigator.vibrate?.(pattern);
}

/** The one `matchMedia` call behind `isTouchDevice`. Building a MediaQueryList means
 * parsing the query and registering a live listener with the browser, and `Cell` asks
 * once per cell — several hundred times for a single board — so the list is built once
 * and only `.matches` is read after that. Still live, so a DevTools device-mode toggle
 * is picked up without a reload. */
let coarsePointer: MediaQueryList | undefined;

/** Touch-primary devices — phones and tablets. Desktops and touchscreen laptops
 * report a fine primary pointer and are treated as regular desktops. */
export function isTouchDevice(): boolean {
    coarsePointer ??= window.matchMedia("(pointer: coarse)");

    return coarsePointer.matches;
}

/** Blocks pinch-to-zoom on touch devices.
 *
 * Three layers, because no single one holds everywhere. The viewport meta in
 * `index.html` and the `touch-action` rules in `styles.css` cover Android; iOS Safari
 * ignores `user-scalable=no` outright and runs page zoom above the element's
 * `touch-action`, so its WebKit-only `gesture*` events are the hook that actually
 * works there. The `touchmove` guard is the fallback for older WebKit that fires
 * neither — it only bites once a second finger is down, which is what keeps one-finger
 * gestures (settings scrolling, and the pull-to-refresh an installed PWA depends on for
 * reloading) working.
 *
 * All four listeners must be non-passive; a passive listener cannot preventDefault. */
export function preventPinchZoom(): void {
    if (!isTouchDevice()) {
        return;
    }

    ["gesturestart", "gesturechange", "gestureend"].forEach(type => {
        document.addEventListener(type, e => e.preventDefault(), { passive: false });
    });

    document.addEventListener("touchmove", e => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
}

/** The area the board gets on a touch device, in CSS pixels.
 *
 * Orientation-independent on purpose: the game is portrait-only, so the short
 * viewport side is always the board width. That keeps the derived mode stable when
 * the device is rotated.
 *
 * Measured off `documentElement`, not `window.innerWidth/innerHeight`. The two are
 * different viewports: the root's client box is the initial containing block, which is
 * what the `position: fixed; inset: 0` on touch `main` resolves against, while
 * `innerHeight` follows the dynamic viewport. In a standalone PWA those diverge after a
 * reload — `innerHeight` over-reported, so this subtracted the controls bar from a
 * height that had never allowed for it and returned a board area a full row too tall. */
export function getDeviceBoardArea(): { width: number; height: number } {
    const root = document.documentElement;
    const shortSide = Math.min(root.clientWidth, root.clientHeight);
    const longSide = Math.max(root.clientWidth, root.clientHeight);

    return {
        width: shortSide,
        height: longSide - MOBILE_CONTROLS_HEIGHT,
    };
}

/** The grid a given area yields: cells as close to TARGET_CELL_SIDE as whole rows and
 * columns allow.
 *
 * Rounding (rather than flooring) picks the cell count closest to the target; the
 * mobile grid uses `1fr` tracks, so the board then fills the area exactly.
 *
 * Split out of `computeDeviceMode` so `fitsDeviceArea` can measure a shared board
 * against the very same grid the device board is built from — the two deciding
 * differently is the one bug worth designing out here. */
export function computeDeviceGrid(width: number, height: number): { rows: number; cols: number } {
    return {
        cols: Math.max(MIN_COLS, Math.round(width / TARGET_CELL_SIDE)),
        rows: Math.max(MIN_ROWS, Math.round(height / TARGET_CELL_SIDE)),
    };
}

/** Whether a board decoded from a shared hash can be played on this screen as-is.
 *
 * The rule is that its cells are never smaller than a device-derived board's, so
 * anything wider or taller than the grid the area yields is refused rather than
 * shrunk — a board is not worth playing if a finger can't hit a cell. */
export function fitsDeviceArea(mode: Mode, width: number, height: number): boolean {
    const grid = computeDeviceGrid(width, height);

    return mode.cols <= grid.cols && mode.rows <= grid.rows;
}

/** Derives a board that fills the given area with cells close to TARGET_CELL_SIDE. */
export function computeDeviceMode(width: number, height: number, density: number): Mode {
    const { rows, cols } = computeDeviceGrid(width, height);

    const cells = rows * cols;
    const clampedDensity = Math.min(
        MAX_MINES_TO_CELLS_RATIO,
        Math.max(MIN_MINES_TO_CELLS_RATIO, density),
    );

    // Floor, so the result always passes urlTool's `mines <= cells * MAX_RATIO` check.
    const mines = Math.max(1, Math.floor(cells * clampedDensity));

    return { rows, cols, mines };
}
