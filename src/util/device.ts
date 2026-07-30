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
export const LONG_PRESS_MS = 400;

/** A press that drifts further than this (in px) is a drag, not a hold. */
export const LONG_PRESS_MOVE_TOLERANCE = 10;

/** Buzzes the device. A no-op wherever the Vibration API is absent (iOS Safari, most
 * desktops), and silently dropped by Android when the phone is on silent or has system
 * touch feedback turned off — which is the only control players need over it. */
export function vibrate(pattern: number | number[]): void {
    navigator.vibrate?.(pattern);
}

/** Touch-primary devices — phones and tablets. Desktops and touchscreen laptops
 * report a fine primary pointer and are treated as regular desktops. */
export function isTouchDevice(): boolean {
    return window.matchMedia("(pointer: coarse)").matches;
}

/** The area the board gets on a touch device, in CSS pixels.
 *
 * Orientation-independent on purpose: the game is portrait-only, so the short
 * viewport side is always the board width. That keeps the derived mode stable when
 * the device is rotated. */
export function getDeviceBoardArea(): { width: number; height: number } {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    const longSide = Math.max(window.innerWidth, window.innerHeight);

    return {
        width: shortSide,
        height: longSide - MOBILE_CONTROLS_HEIGHT,
    };
}

/** Derives a board that fills the given area with cells close to TARGET_CELL_SIDE.
 *
 * Rounding (rather than flooring) picks the cell count closest to the target; the
 * mobile grid uses `1fr` tracks, so the board then fills the area exactly. */
export function computeDeviceMode(width: number, height: number, density: number): Mode {
    const cols = Math.max(MIN_COLS, Math.round(width / TARGET_CELL_SIDE));
    const rows = Math.max(MIN_ROWS, Math.round(height / TARGET_CELL_SIDE));

    const cells = rows * cols;
    const clampedDensity = Math.min(
        MAX_MINES_TO_CELLS_RATIO,
        Math.max(MIN_MINES_TO_CELLS_RATIO, density),
    );

    // Floor, so the result always passes urlTool's `mines <= cells * MAX_RATIO` check.
    const mines = Math.max(1, Math.floor(cells * clampedDensity));

    return { rows, cols, mines };
}
