// Pyramid Solitaire Game

class PyramidSolitaire {
    constructor() {
        this.deck = [];
        this.pyramid = [];
        this.stock = [];
        this.waste = [];
        this.removed = [];
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.selectedCard = null;
        this.draggedCard = null;
        this.draggedFrom = null;

        // Attach event listeners only once
        this.attachEventListeners();

        this.init();
    }

    init() {
        this.createDeck();
        this.shuffle();
        this.dealPyramid();
        this.renderGame();
        this.startTimer();
    }

    createDeck() {
        const suits = ['♥', '♦', '♣', '♠'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const numValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

        this.deck = [];
        for (let suit of suits) {
            for (let i = 0; i < values.length; i++) {
                this.deck.push({
                    suit: suit,
                    value: values[i],
                    numValue: numValues[i],
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            }
        }
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealPyramid() {
        this.pyramid = [];
        let cardIndex = 0;

        // Create 7 rows of pyramid
        for (let row = 0; row < 7; row++) {
            this.pyramid[row] = [];
            for (let col = 0; col <= row; col++) {
                this.pyramid[row][col] = {
                    ...this.deck[cardIndex],
                    row: row,
                    col: col,
                    covered: false
                };
                cardIndex++;
            }
        }

        // Mark covered cards
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col <= row; col++) {
                // Check if card is covered by cards in next row (both must exist)
                if (this.pyramid[row + 1][col] && this.pyramid[row + 1][col + 1]) {
                    this.pyramid[row][col].covered = true;
                }
            }
        }

        // Remaining cards go to stock
        this.stock = this.deck.slice(28);
        this.waste = [];
    }

    renderGame() {
        this.renderPyramid();
        this.renderStock();
        this.updateStats();
    }

    renderPyramid() {
        const pyramidEl = document.getElementById('pyramid');
        pyramidEl.innerHTML = '';

        for (let row = 0; row < 7; row++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'pyramid-row';

            // Position each row vertically with slight overlap
            rowEl.style.top = `${row * 55}px`;

            for (let col = 0; col <= row; col++) {
                const card = this.pyramid[row][col];
                if (card && !this.removed.includes(`${row}-${col}`)) {
                    const cardEl = this.createCardElement(card, row, col);
                    rowEl.appendChild(cardEl);
                }
            }
            pyramidEl.appendChild(rowEl);
        }
    }

    createCardElement(card, row, col) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color}`;

        // Mark court cards
        if (['J', 'Q', 'K'].includes(card.value)) {
            cardEl.classList.add('court');
        }

        if (card.covered) {
            cardEl.classList.add('covered');
        }
        cardEl.dataset.row = row;
        cardEl.dataset.col = col;

        // Create traditional card face
        const cardFace = this.createTraditionalCardFace(card);
        cardEl.innerHTML = `
            <div class="card-top">
                <div>${card.value}</div>
                <div>${card.suit}</div>
            </div>
            ${cardFace}
            <div class="card-bottom">
                <div>${card.value}</div>
                <div>${card.suit}</div>
            </div>
        `;

        if (!card.covered) {
            cardEl.addEventListener('click', () => this.selectCard(card, row, col));

            // Add drag-and-drop functionality
            cardEl.draggable = true;
            cardEl.style.cursor = 'grab';

            // Drag source events
            cardEl.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, card, row, col);
            });

            cardEl.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            // Drop target events
            cardEl.addEventListener('dragover', (e) => {
                this.handleDragOver(e);
            });

            cardEl.addEventListener('dragenter', (e) => {
                this.handleDragEnter(e, card);
            });

            cardEl.addEventListener('dragleave', (e) => {
                this.handleDragLeave(e);
            });

            cardEl.addEventListener('drop', (e) => {
                this.handleDrop(e, card, row, col);
            });
        }

        return cardEl;
    }

    handleDragStart(e, card, row, col) {
        if (card.covered) return; // Can't drag covered cards

        this.draggedCard = card;
        this.draggedFrom = { row, col };
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `${row}-${col}`);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');

        // Remove all drop-target highlights
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    }

    handleDragOver(e) {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e, card) {
        if (!this.draggedCard || card.covered) return;

        // Don't highlight if dragging onto itself
        if (this.draggedCard === card) return;

        e.target.classList.add('drop-target');
    }

    handleDragLeave(e) {
        e.target.classList.remove('drop-target');
    }

    handleDrop(e, targetCard, targetRow, targetCol) {
        e.preventDefault();
        e.stopPropagation();

        const targetEl = e.currentTarget;
        targetEl.classList.remove('drop-target');

        if (!this.draggedCard || targetCard.covered) return;

        // Don't allow dropping on itself
        if (this.draggedCard === targetCard) return;

        const draggedValue = this.draggedCard.numValue;
        const targetValue = targetCard.numValue;

        // Check if pair sums to 13
        if (draggedValue + targetValue === 13) {
            // Valid pair! Add flash animation
            targetEl.classList.add('valid-pair');

            // Find and flash the dragged card element
            const draggedEl = document.querySelector(`[data-row="${this.draggedFrom.row}"][data-col="${this.draggedFrom.col}"]`);
            if (draggedEl) {
                draggedEl.classList.add('valid-pair');
            }

            // Remove both cards after animation
            setTimeout(() => {
                // Remove dragged card
                if (this.draggedFrom.row === -1) {
                    // From waste pile
                    this.waste.pop();
                } else {
                    // From pyramid
                    this.removeCard(`${this.draggedFrom.row}-${this.draggedFrom.col}`);
                }

                // Remove target card
                if (targetRow === -1) {
                    // Target is waste pile
                    this.waste.pop();
                } else {
                    // Target is pyramid
                    this.removeCard(`${targetRow}-${targetCol}`);
                }

                this.moves++;
                this.renderGame();
                this.draggedCard = null;
                this.draggedFrom = null;
            }, 400); // Match animation duration
        } else {
            // Invalid pair - shake animation
            targetEl.classList.add('invalid-drop');
            setTimeout(() => {
                targetEl.classList.remove('invalid-drop');
            }, 300);

            this.draggedCard = null;
            this.draggedFrom = null;
        }
    }

    createTraditionalCardFace(card) {
        const suit = card.suit;
        const value = card.value;

        // Court cards (J, Q, K) - use custom images
        if (value === 'K') {
            let imageName = '';
            if (suit === '♣') imageName = 'king-clubs.png';
            else if (suit === '♠') imageName = 'king-spades.png';
            else if (suit === '♥') imageName = 'king-hearts.png';
            else if (suit === '♦') imageName = 'king-diamonds.png';
            return `<div class="card-face court-card-image">
                <img src="../${imageName}" alt="King of ${suit}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`;
        } else if (value === 'Q') {
            let imageName = '';
            if (suit === '♣') imageName = 'queen-clubs.png';
            else if (suit === '♠') imageName = 'queen-spades.png';
            else if (suit === '♥') imageName = 'queen-hearts.png';
            else if (suit === '♦') imageName = 'queen-diamonds.png';
            return `<div class="card-face court-card-image">
                <img src="../${imageName}" alt="Queen of ${suit}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`;
        } else if (value === 'J') {
            // Use custom Jack card images based on suit
            let imageName = '';
            if (suit === '♣') imageName = 'jack-clubs.png';
            else if (suit === '♠') imageName = 'jack-spades.png';
            else if (suit === '♥') imageName = 'jack-hearts.png';
            else if (suit === '♦') imageName = 'jack-diamonds.png';

            return `<div class="card-face court-card-image">
                <img src="../${imageName}" alt="Jack of ${suit}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`;
        }

        // Ace
        if (value === 'A') {
            return `<div class="card-face">${suit}</div>`;
        }

        // Number cards - show multiple suits in traditional arrangement
        const numValue = card.numValue;
        let suitPattern = '';

        // Create traditional pip arrangement patterns (MUCH larger for 100x140 cards)
        if (numValue === 2) {
            suitPattern = `<div style="font-size: 48px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 12px 0;">
                <div>${suit}</div>
                <div style="transform: rotate(180deg);">${suit}</div>
            </div>`;
        } else if (numValue === 3) {
            suitPattern = `<div style="font-size: 42px; display: flex; flex-direction: column; justify-content: space-around; height: 100%;">
                <div>${suit}</div>
                <div>${suit}</div>
                <div>${suit}</div>
            </div>`;
        } else if (numValue === 4) {
            suitPattern = `<div style="font-size: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; height: 100%; padding: 8px;">
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 5) {
            suitPattern = `<div style="font-size: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; height: 100%; align-items: center;">
                <div>${suit}</div><div>${suit}</div>
                <div style="grid-column: span 2; text-align: center;">${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 6) {
            suitPattern = `<div style="font-size: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; height: 100%; padding: 6px;">
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 7) {
            suitPattern = `<div style="font-size: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; height: 100%; padding: 4px;">
                <div>${suit}</div><div>${suit}</div>
                <div style="grid-column: span 2; text-align: center;">${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 8) {
            suitPattern = `<div style="font-size: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; height: 100%;">
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 9) {
            suitPattern = `<div style="font-size: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; height: 100%;">
                <div>${suit}</div><div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div><div>${suit}</div>
            </div>`;
        } else if (numValue === 10) {
            suitPattern = `<div style="font-size: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; height: 100%;">
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
                <div>${suit}</div><div>${suit}</div>
            </div>`;
        }

        return `<div class="card-face">${suitPattern}</div>`;
    }

    selectCard(card, row, col) {
        if (card.covered) return;

        const cardKey = `${row}-${col}`;
        const isWasteCard = row === -1 && col === -1;

        if (card.numValue === 13) {
            // King can be removed alone
            if (!isWasteCard) {
                this.removeCard(cardKey);
            } else {
                this.waste.pop();
                this.renderStock();
                this.moves++;
            }
            this.selectedCard = null;
            return;
        }

        if (!this.selectedCard) {
            // First card selected
            this.selectedCard = { card, key: cardKey, isWaste: isWasteCard };
            if (!isWasteCard) {
                const cardEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cardEl) cardEl.classList.add('selected');
            }
        } else {
            // Second card selected
            if (this.selectedCard.key === cardKey) {
                // Deselect same card
                if (!isWasteCard) {
                    const cardEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cardEl) cardEl.classList.remove('selected');
                }
                this.selectedCard = null;
            } else if (this.selectedCard.card.numValue + card.numValue === 13) {
                // Valid pair!
                if (!this.selectedCard.isWaste) {
                    this.removeCard(this.selectedCard.key);
                } else {
                    this.waste.pop();
                }
                if (!isWasteCard) {
                    this.removeCard(cardKey);
                } else {
                    this.waste.pop();
                }
                this.selectedCard = null;
                this.moves++;
                this.renderGame();
            } else {
                // Invalid pair
                const prevSelected = document.querySelector('.selected');
                if (prevSelected) prevSelected.classList.remove('selected');
                this.selectedCard = { card, key: cardKey, isWaste: isWasteCard };
                if (!isWasteCard) {
                    const cardEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cardEl) cardEl.classList.add('selected');
                }
            }
        }
    }

    removeCard(cardKey) {
        this.removed.push(cardKey);
        const [row, col] = cardKey.split('-').map(Number);

        // Uncover cards that were covered by this card
        if (row > 0) {
            // Check cards in previous row
            if (col > 0 && this.pyramid[row - 1][col - 1]) {
                const leftParent = this.pyramid[row - 1][col - 1];
                const leftParentCovered = this.isCardCovered(row - 1, col - 1);
                if (!leftParentCovered) {
                    this.pyramid[row - 1][col - 1].covered = false;
                }
            }
            if (this.pyramid[row - 1][col]) {
                const rightParent = this.pyramid[row - 1][col];
                const rightParentCovered = this.isCardCovered(row - 1, col);
                if (!rightParentCovered) {
                    this.pyramid[row - 1][col].covered = false;
                }
            }
        }

        this.renderGame();
        this.checkWin();
    }

    isCardCovered(row, col) {
        // Check if both covering cards are removed (both must be removed for card to be uncovered)
        const leftChild = `${row + 1}-${col}`;
        const rightChild = `${row + 1}-${col + 1}`;
        return !this.removed.includes(leftChild) && !this.removed.includes(rightChild);
    }

    renderStock() {
        const stockEl = document.getElementById('stock-pile');
        const wasteEl = document.getElementById('waste-pile');

        // Show card back if stock has cards, or reload icon if stock empty but waste has cards
        if (this.stock.length > 0) {
            stockEl.innerHTML = '<div class="card-back">🂠</div>';
        } else if (this.waste.length > 0) {
            stockEl.innerHTML = '<div class="reload-icon" title="Click to reload cards">♻️</div>';
        } else {
            stockEl.innerHTML = '';
        }

        if (this.waste.length > 0) {
            const topCard = this.waste[this.waste.length - 1];
            const cardFace = this.createTraditionalCardFace(topCard);
            const courtClass = ['J', 'Q', 'K'].includes(topCard.value) ? 'court' : '';

            const cardEl = document.createElement('div');
            cardEl.className = `card ${topCard.color} ${courtClass}`;
            cardEl.draggable = true;
            cardEl.style.cursor = 'grab';
            cardEl.innerHTML = `
                <div class="card-top">
                    <div>${topCard.value}</div>
                    <div>${topCard.suit}</div>
                </div>
                ${cardFace}
                <div class="card-bottom">
                    <div>${topCard.value}</div>
                    <div>${topCard.suit}</div>
                </div>
            `;

            // Add click handler
            cardEl.addEventListener('click', () => this.selectCard(topCard, -1, -1));

            // Drag source events
            cardEl.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, topCard, -1, -1);
            });

            cardEl.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            // Drop target events
            cardEl.addEventListener('dragover', (e) => {
                this.handleDragOver(e);
            });

            cardEl.addEventListener('dragenter', (e) => {
                this.handleDragEnter(e, topCard);
            });

            cardEl.addEventListener('dragleave', (e) => {
                this.handleDragLeave(e);
            });

            cardEl.addEventListener('drop', (e) => {
                this.handleDrop(e, topCard, -1, -1);
            });

            wasteEl.innerHTML = '';
            wasteEl.appendChild(cardEl);
        } else {
            wasteEl.innerHTML = '';
        }
    }

    drawFromStock() {
        if (this.stock.length > 0) {
            // Draw a card from stock to waste
            const card = this.stock.pop();
            this.waste.push(card);
            this.renderStock();
        } else if (this.waste.length > 0) {
            // Stock is empty but waste has cards - recycle waste back to stock
            while (this.waste.length > 0) {
                const card = this.waste.pop();
                this.stock.unshift(card); // Add to beginning of stock
            }
            this.renderStock();
        }
        // If both stock and waste are empty, do nothing
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('cards-left').textContent = 28 - this.removed.length;
    }

    checkWin() {
        if (this.removed.length === 28) {
            this.stopTimer();
            setTimeout(() => {
                document.getElementById('final-moves').textContent = this.moves;
                document.getElementById('final-time').textContent = document.getElementById('timer').textContent;
                document.getElementById('win-modal').classList.add('active');
            }, 500);
        }
    }

    reset() {
        this.stopTimer();
        this.createDeck();
        this.shuffle();
        this.dealPyramid();
        this.removed = [];
        this.moves = 0;
        this.timer = 0;
        this.selectedCard = null;
        this.renderGame();
        this.startTimer();
    }

    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.reset());
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            this.reset();
        });
        document.getElementById('stock-pile').addEventListener('click', () => this.drawFromStock());
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new PyramidSolitaire();
});
