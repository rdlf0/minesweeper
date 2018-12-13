import { Board } from "./board";

// const MODE_BEGINNER = "beginner";
// const MODE_INTERMEDIATE = "intermediate";
// const MODE_EXPERT = "expert";

// Beginner
// const ROWS = 9;
// const COLS = 9;
// const MINES = 10;

// Intermediate
// const ROWS = 16;
// const COLS = 16;
// const MINES = 40;

// Expert
const ROWS = 16;
const COLS = 30;
const MINES = 99;

let board = new Board(ROWS, COLS, MINES);

document.body.innerHTML = board.printBoard();