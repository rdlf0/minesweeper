define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Board = /** @class */ (function () {
        function Board(rows, cols) {
            this.rows = rows;
            this.cols = cols;
        }
        Board.prototype.printBoard = function () {
            return "This board has " + this.rows + " rows and " + this.cols + " cols.";
        };
        return Board;
    }());
    exports.Board = Board;
});
//# sourceMappingURL=board.js.map