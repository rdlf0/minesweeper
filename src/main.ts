import { Board } from "./board";

// enum MODE {Beginner, Intermediate, Expert};

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

let rowsContainer = document.getElementById("rows-container");

let board = new Board(ROWS, COLS, MINES);
// board.enableDebug();
board.draw(rowsContainer);