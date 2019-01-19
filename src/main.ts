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

let boardContainer = document.getElementById("board");
let minesCounter = document.getElementById("mines-counter");

let board = new Board(ROWS, COLS, MINES, minesCounter);
// board.enableDebug();
board.draw(boardContainer);