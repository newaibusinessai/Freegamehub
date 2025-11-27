// Minesweeper Game JavaScript

class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.currentDifficulty = 'medium';
        this.grid = [];
        this.revealedCells = 0;
        this.flaggedCells = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.firstClick = true;

        this.init();
    }

    init() {
        this.setupDifficultyButtons();
        this.newGame();
    }

    setupDifficultyButtons() {
        const buttons = document.querySelectorAll('[data-difficulty]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Update button styles
                buttons.forEach(b => b.classList.remove('btn-primary'));
                buttons.forEach(b => b.classList.add('btn-secondary'));
                e.target.classList.remove('btn-secondary');
                e.target.classList.add('btn-primary');

                this.currentDifficulty = e.target.dataset.difficulty;
                this.newGame();
            });
        });

        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('game-modal').classList.remove('active');
            this.newGame();
        });
    }

    newGame() {
        this.stopTimer();
        this.gameOver = false;
        this.gameWon = false;
        this.revealedCells = 0;
        this.flaggedCells = 0;
        this.timer = 0;
        this.firstClick = true;

        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;

        this.updateMinesDisplay();
        this.updateTimer();
        this.updateStatus('😊');

        this.createGrid();
        this.renderGrid();
    }

    createGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            // Don't place mine on first click or adjacent cells
            const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;

            if (!this.grid[row][col].mine && !isExcluded) {
                this.grid[row][col].mine = true;
                minesPlaced++;
            }
        }

        this.calculateNeighborMines();
    }

    calculateNeighborMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col].mine) {
                    let count = 0;
                    this.getNeighbors(row, col).forEach(([r, c]) => {
                        if (this.grid[r][c].mine) count++;
                    });
                    this.grid[row][col].neighborMines = count;
                }
            }
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && !(r === row && c === col)) {
                    neighbors.push([r, c]);
                }
            }
        }
        return neighbors;
    }

    renderGrid() {
        const gridElement = document.getElementById('minesweeper-grid');
        gridElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${this.cols}, 28px)`;
        gridElement.style.gridTemplateRows = `repeat(${this.rows}, 28px)`;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                cell.addEventListener('click', (e) => this.handleLeftClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });

                gridElement.appendChild(cell);
            }
        }
    }

    handleLeftClick(row, col) {
        if (this.gameOver || this.gameWon) return;

        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged) return;

        // Place mines on first click
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        this.revealCell(row, col);
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.gameWon) return;

        const cell = this.grid[row][col];
        if (cell.revealed) return;

        cell.flagged = !cell.flagged;
        this.flaggedCells += cell.flagged ? 1 : -1;
        this.updateMinesDisplay();
        this.updateCellDisplay(row, col);

        this.checkWin();
    }

    revealCell(row, col) {
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;
        this.revealedCells++;
        this.updateCellDisplay(row, col);

        if (cell.mine) {
            this.gameOver = true;
            this.updateStatus('😵');
            this.revealAllMines();
            this.endGame(false);
            return;
        }

        // If no neighboring mines, reveal all neighbors (flood fill)
        if (cell.neighborMines === 0) {
            this.getNeighbors(row, col).forEach(([r, c]) => {
                this.revealCell(r, c);
            });
        }

        this.checkWin();
    }

    updateCellDisplay(row, col) {
        const cell = this.grid[row][col];
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

        cellElement.className = 'mine-cell';

        if (cell.flagged) {
            cellElement.classList.add('flagged');
        } else if (cell.revealed) {
            cellElement.classList.add('revealed');
            if (cell.mine) {
                cellElement.classList.add('mine');
            } else if (cell.neighborMines > 0) {
                cellElement.textContent = cell.neighborMines;
                cellElement.classList.add(`num-${cell.neighborMines}`);
            }
        }
    }

    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.grid[row][col];
                if (cell.mine) {
                    cell.revealed = true;
                    this.updateCellDisplay(row, col);
                }
            }
        }
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const cellsToReveal = totalCells - this.totalMines;

        if (this.revealedCells === cellsToReveal) {
            this.gameWon = true;
            this.updateStatus('😎');
            this.endGame(true);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.timer;
    }

    updateMinesDisplay() {
        const remaining = this.totalMines - this.flaggedCells;
        document.getElementById('mines-left').textContent = remaining;
    }

    updateStatus(emoji) {
        document.getElementById('status').textContent = emoji;
    }

    endGame(won) {
        this.stopTimer();

        const modal = document.getElementById('game-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const finalTime = document.getElementById('final-time');

        if (won) {
            title.textContent = '🎉 Congratulations!';
            message.textContent = 'You found all the mines and won the game!';
        } else {
            title.textContent = '💥 Game Over';
            message.textContent = 'You hit a mine! Better luck next time.';
        }

        finalTime.textContent = this.timer;

        setTimeout(() => {
            modal.classList.add('active');
        }, 500);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
