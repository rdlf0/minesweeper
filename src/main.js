define(["require", "exports", "./board"], function (require, exports, board_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var board = new board_1.Board(5, 5);
    document.body.innerHTML = board.printBoard();
});
//# sourceMappingURL=main.js.map