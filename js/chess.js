// Simplified Chess Game with Basic AI
// Note: This is a simplified implementation. For production, consider using chess.js library

class ChessGame {
    constructor() {
        this.board = [];
        this.selectedPiece = null;
        this.turn = 'white';
        this.moves = 0;
        this.gameOver = false;

        this.initBoard();
        this.renderBoard();
        this.attachEventListeners();
    }

    initBoard() {
        // Initialize 8x8 board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Set up pieces (simplified setup)
        // Black pieces (top)
        const blackPieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
        for (let i = 0; i < 8; i++) {
            this.board[0][i] = { piece: blackPieces[i], color: 'black' };
            this.board[1][i] = { piece: '♟', color: 'black' };
        }

        // White pieces (bottom)
        const whitePieces = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = { piece: '♙', color: 'white' };
            this.board[7][i] = { piece: whitePieces[i], color: 'white' };
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('chess-board');
        boardEl.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'chess-square';

                // Checkerboard pattern
                if ((row + col) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }

                square.dataset.row = row;
                square.dataset.col = col;

                // Add piece if exists
                const piece = this.board[row][col];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = `chess-piece ${piece.color}`;
                    pieceEl.textContent = piece.piece;
                    pieceEl.dataset.row = row;
                    pieceEl.dataset.col = col;
                    square.appendChild(pieceEl);
                }

                square.addEventListener('click', (e) => this.handleSquareClick(row, col, e));
                boardEl.appendChild(square);
            }
        }

        this.updateStatus();
    }

    handleSquareClick(row, col, e) {
        if (this.gameOver) return;
        if (this.turn !== 'white') return; // Only allow white moves (player)

        const piece = this.board[row][col];

        if (this.selectedPiece) {
            // Attempt to move
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
                this.selectedPiece = null;
                document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                this.moves++;
                this.turn = 'black';
                this.renderBoard();

                // AI move after short delay
                setTimeout(() => this.makeAIMove(), 500);
            } else {
                // Deselect if clicking same piece or select new piece
                if (piece && piece.color === this.turn) {
                    this.selectedPiece = { row, col, piece };
                    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                    e.target.closest('.chess-square').classList.add('selected');
                } else {
                    this.selectedPiece = null;
                    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                }
            }
        } else if (piece && piece.color === this.turn) {
            // Select piece
            this.selectedPiece = { row, col, piece };
            e.target.closest('.chess-square').classList.add('selected');
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Simplified move validation
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];

        if (!piece) return false;
        if (target && target.color === piece.color) return false;

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        // Basic movement rules (simplified)
        const pieceType = piece.piece;

        // Pawn
        if (pieceType === '♙' || pieceType === '♟') {
            const direction = piece.color === 'white' ? -1 : 1;
            if (toCol === fromCol && !target) {
                if (toRow === fromRow + direction) return true;
                if ((piece.color === 'white' && fromRow === 6) || (piece.color === 'black' && fromRow === 1)) {
                    if (toRow === fromRow + 2 * direction && !this.board[fromRow + direction][fromCol]) return true;
                }
            }
            if (colDiff === 1 && toRow === fromRow + direction && target) return true;
        }

        // Knight
        if (pieceType === '♘' || pieceType === '♞') {
            if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) return true;
        }

        // Rook
        if (pieceType === '♖' || pieceType === '♜') {
            if (fromRow === toRow || fromCol === toCol) {
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // Bishop
        if (pieceType === '♗' || pieceType === '♝') {
            if (rowDiff === colDiff) {
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // Queen
        if (pieceType === '♕' || pieceType === '♛') {
            if (fromRow === toRow || fromCol === toCol || rowDiff === colDiff) {
                return this.isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // King
        if (pieceType === '♔' || pieceType === '♚') {
            if (rowDiff <= 1 && colDiff <= 1) return true;
        }

        return false;
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Check for pawn promotion
        if ((piece.piece === '♙' && toRow === 0) || (piece.piece === '♟' && toRow === 7)) {
            this.board[toRow][toCol] = { piece: piece.color === 'white' ? '♕' : '♛', color: piece.color };
        }

        // Check for checkmate (simplified - just check if king is captured)
        if (captured && (captured.piece === '♔' || captured.piece === '♚')) {
            this.gameOver = true;
            setTimeout(() => {
                alert(`${piece.color === 'white' ? 'White' : 'Black'} wins!`);
            }, 100);
        }
    }

    makeAIMove() {
        if (this.gameOver) return;

        // Simple AI: Find all valid moves and pick random
        const validMoves = [];

        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.board[fromRow][fromCol];
                if (piece && piece.color === 'black') {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                                validMoves.push({ fromRow, fromCol, toRow, toCol });
                            }
                        }
                    }
                }
            }
        }

        if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.movePiece(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
            this.moves++;
            this.turn = 'white';
            this.renderBoard();
        }
    }

    updateStatus() {
        document.getElementById('turn').textContent = this.turn;
        document.getElementById('moves').textContent = Math.floor(this.moves / 2);
    }

    reset() {
        this.board = [];
        this.selectedPiece = null;
        this.turn = 'white';
        this.moves = 0;
        this.gameOver = false;
        this.initBoard();
        this.renderBoard();
    }

    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.reset());
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
