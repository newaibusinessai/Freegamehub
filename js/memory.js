// Memory Game JavaScript

class MemoryGame {
    constructor() {
        this.cards = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒'];
        this.gameCards = [...this.cards, ...this.cards]; // Duplicate for pairs
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.canFlip = true;

        this.init();
    }

    init() {
        this.shuffle();
        this.createBoard();
        this.attachEventListeners();
    }

    shuffle() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.gameCards[i], this.gameCards[j]] = [this.gameCards[j], this.gameCards[i]];
        }
    }

    createBoard() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';

        this.gameCards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;

            card.innerHTML = `
                <div class="card-front">${symbol}</div>
                <div class="card-back">?</div>
            `;

            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
        });
    }

    flipCard(card) {
        // Prevent flipping if card is already flipped, matched, or we're checking a pair
        if (!this.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        // Start timer on first move
        if (this.moves === 0) {
            this.startTimer();
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMoves();
            this.checkMatch();
        }
    }

    checkMatch() {
        this.canFlip = false;
        const [card1, card2] = this.flippedCards;

        if (card1.dataset.symbol === card2.dataset.symbol) {
            // Match found!
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                this.updatePairs();
                this.flippedCards = [];
                this.canFlip = true;

                // Check for win
                if (this.matchedPairs === this.cards.length) {
                    this.win();
                }
            }, 500);
        } else {
            // No match - flip back
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.canFlip = true;
            }, 1000);
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

    updateMoves() {
        document.getElementById('moves').textContent = this.moves;
    }

    updateTimer() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updatePairs() {
        document.getElementById('pairs-found').textContent = this.matchedPairs;
    }

    win() {
        this.stopTimer();

        // Update modal with final stats
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-time').textContent = document.getElementById('timer').textContent;

        // Show win modal
        setTimeout(() => {
            document.getElementById('win-modal').classList.add('active');
        }, 500);
    }

    reset() {
        this.stopTimer();
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.canFlip = true;

        this.updateMoves();
        this.updateTimer();
        this.updatePairs();

        this.shuffle();
        this.createBoard();
    }

    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.reset());
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            this.reset();
        });

        // Close modal on click outside
        document.getElementById('win-modal').addEventListener('click', (e) => {
            if (e.target.id === 'win-modal') {
                document.getElementById('win-modal').classList.remove('active');
            }
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
