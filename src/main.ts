import { Board } from "./board";

const ROWS = 5;
const COLS = 5;
const MINES = 3;

let board = new Board(ROWS, COLS, MINES);

document.body.innerHTML = board.printBoard();