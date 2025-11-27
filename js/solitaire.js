// Klondike Solitaire Game

class KlondikeSolitaire {
    constructor() {
        this.deck = [];
        this.tableau = [[], [], [], [], [], [], []]; // 7 piles
        this.foundations = [[], [], [], []]; // 4 foundation piles (not suit-specific initially)
        this.stock = [];
        this.waste = [];
        this.selectedCard = null;
        this.selectedFrom = null;
        this.moves = 0;
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.moveHistory = [];
        this.drawMode = 1; // 1 or 3 cards

        // Attach event listeners only once
        this.attachEventListeners();

        // Initialize the game
        this.init();
    }

    init() {
        this.createDeck();
        this.shuffle();
        this.dealTableau();
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
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black',
                    faceUp: false
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

    dealTableau() {
        let cardIndex = 0;

        // Deal cards to tableau (1, 2, 3, 4, 5, 6, 7 cards)
        for (let pile = 0; pile < 7; pile++) {
            for (let card = 0; card <= pile; card++) {
                const currentCard = this.deck[cardIndex];
                // Last card in each pile is face-up
                currentCard.faceUp = (card === pile);
                this.tableau[pile].push(currentCard);
                cardIndex++;
            }
        }

        // Remaining cards go to stock
        this.stock = this.deck.slice(cardIndex);
    }

    renderGame() {
        this.renderTableau();
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.updateStats();
    }

    renderTableau() {
        for (let pileIndex = 0; pileIndex < 7; pileIndex++) {
            const pileEl = document.querySelector(`[data-pile="${pileIndex}"]`);
            pileEl.innerHTML = '';

            const pile = this.tableau[pileIndex];

            // Calculate proper offset considering face-down cards are stacked tighter
            let cumulativeOffset = 0;
            pile.forEach((card, cardIndex) => {
                const cardEl = this.createCardElement(card, pileIndex, cardIndex);

                // Use tighter spacing for face-down cards
                if (cardIndex > 0) {
                    const prevCard = pile[cardIndex - 1];
                    if (!prevCard.faceUp) {
                        cumulativeOffset += 32; // Tighter for face-down (scaled for 130px cards)
                    } else {
                        cumulativeOffset += 45; // More spacing for face-up (scaled for 130px cards)
                    }
                }

                cardEl.style.top = `${cumulativeOffset}px`;
                pileEl.appendChild(cardEl);
            });
        }
    }

    renderStock() {
        const stockEl = document.getElementById('stock');
        stockEl.innerHTML = '';

        if (this.stock.length > 0) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card face-down';
            stockEl.appendChild(cardBack);
        }
    }

    renderWaste() {
        const wasteEl = document.getElementById('waste');
        wasteEl.innerHTML = '';

        if (this.waste.length > 0) {
            // In Turn 3 mode, show the last 3 cards with offset
            const cardsToShow = this.drawMode === 3 ? Math.min(3, this.waste.length) : 1;
            const startIndex = this.waste.length - cardsToShow;

            for (let i = 0; i < cardsToShow; i++) {
                const card = this.waste[startIndex + i];
                const cardEl = this.createCardElement(card, 'waste', startIndex + i);
                cardEl.style.position = 'absolute';
                cardEl.style.left = `${i * 32}px`; // Offset each card (scaled for 130px cards)
                cardEl.style.zIndex = i;
                wasteEl.appendChild(cardEl);
            }
        }
    }

    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const foundationEl = document.querySelector(`.foundation[data-index="${i}"]`);
            if (!foundationEl) continue; // Skip if element not found

            foundationEl.innerHTML = '';

            const pile = this.foundations[i];
            if (pile && pile.length > 0) {
                const topCard = pile[pile.length - 1];
                const cardEl = this.createCardElement(topCard, 'foundation', i);
                cardEl.style.position = 'relative';
                foundationEl.appendChild(cardEl);
            }
        }
    }

    createCardElement(card, location, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        if (!card.faceUp) {
            cardEl.classList.add('face-down');
        } else {
            // Add color class only for face-up cards
            cardEl.classList.add(card.color);

            // Mark court cards
            if (['J', 'Q', 'K'].includes(card.value)) {
                cardEl.classList.add('court');
            }

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
        }

        // Store card data
        cardEl.dataset.location = location;
        cardEl.dataset.index = index;

        // Add click listener for face-up cards (for double-click to auto-move)
        if (card.faceUp) {
            cardEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCardClick(card, location, index);
            });

            // Add drag-and-drop functionality
            cardEl.draggable = true;
            cardEl.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, card, location, index);
            });
            cardEl.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });
        }

        return cardEl;
    }

    createTraditionalCardFace(card) {
        const suit = card.suit;
        const value = card.value;

        // Court cards
        if (value === 'K') {
            // Use custom King card images based on suit
            let imageName = '';
            if (suit === '♣') imageName = 'king-clubs.png';
            else if (suit === '♠') imageName = 'king-spades.png';
            else if (suit === '♥') imageName = 'king-hearts.png';
            else if (suit === '♦') imageName = 'king-diamonds.png';

            return `<div class="card-face court-card-image">
                <img src="../${imageName}" alt="King of ${suit}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`;
        } else if (value === 'Q') {
            // Use custom Queen card images based on suit
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

        // Number cards - traditional pip arrangements (same as Pyramid Solitaire)
        const numValue = card.numValue;
        let suitPattern = '';

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

    handleCardClick(card, location, index) {
        if (!this.selectedCard) {
            // Select card
            this.selectCard(card, location, index);
        } else {
            // If clicking on the same card, deselect
            if (this.selectedCard === card) {
                document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
                this.selectedCard = null;
                this.selectedFrom = null;
                return;
            }

            // Try to move selected card to clicked location
            // If clicking a card in a tableau pile, move to that pile
            if (typeof location === 'number') {
                this.attemptMove(location, index);
            } else if (location === 'foundation') {
                this.attemptMove('foundation', index);
            }
        }
    }

    handleDragStart(e, card, location, index) {
        this.draggedCard = card;
        this.draggedFrom = { location, index };

        // Add a semi-transparent effect to the dragged card
        e.target.style.opacity = '0.5';

        // Store card data for the drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragEnd(e) {
        // Reset opacity
        e.target.style.opacity = '1';
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        // Add visual feedback when dragging over a valid drop zone
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        // Remove visual feedback
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, location, index) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Remove visual feedback
        e.currentTarget.classList.remove('drag-over');

        if (!this.draggedCard) return false;

        // Attempt the move
        if (typeof location === 'number') {
            // Dropping on tableau
            this.selectedCard = this.draggedCard;
            this.selectedFrom = this.draggedFrom;
            this.attemptMove(location, index);
        } else if (location === 'foundation') {
            // Dropping on foundation
            this.selectedCard = this.draggedCard;
            this.selectedFrom = this.draggedFrom;
            this.attemptMove('foundation', index);
        }

        // Clear drag data
        this.draggedCard = null;
        this.draggedFrom = null;

        return false;
    }

    selectCard(card, location, index) {
        // Deselect previous
        document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));

        this.selectedCard = card;
        this.selectedFrom = { location, index };

        // Highlight selected card
        const cardElements = document.querySelectorAll('.card');
        cardElements.forEach(el => {
            if (el.dataset.location === String(location) && el.dataset.index === String(index)) {
                el.classList.add('selected');
            }
        });
    }

    attemptMove(toLocation, toIndex) {
        const from = this.selectedFrom;
        const card = this.selectedCard;

        let validMove = false;
        let moveData = null;

        if (typeof toLocation === 'number') {
            // Moving to tableau
            moveData = this.moveToTableau(from, toLocation);
            validMove = moveData !== null;
        } else if (toLocation === 'foundation') {
            // Moving to foundation
            moveData = this.moveToFoundation(from, toIndex);
            validMove = moveData !== null;
        }

        if (validMove) {
            this.moves++;
            // Save move to history
            this.moveHistory.push(moveData);
            this.renderGame();
            this.checkWin();
        }

        // Deselect
        document.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
        this.selectedCard = null;
        this.selectedFrom = null;
    }

    moveToTableau(from, toPile) {
        const card = this.selectedCard;
        const targetPile = this.tableau[toPile];

        // Check if move is valid
        if (targetPile.length === 0) {
            // Empty pile - only Kings allowed
            if (card.numValue !== 13) {
                return null;
            }
        } else {
            const topCard = targetPile[targetPile.length - 1];
            // Must be opposite color and one rank lower
            if (card.color === topCard.color || card.numValue !== topCard.numValue - 1) {
                return null;
            }
        }

        // Create move data for undo
        const moveData = {
            type: 'tableau',
            from: { ...from },
            to: toPile,
            cards: [],
            flippedCard: null,
            scoreChange: 0
        };

        // Execute move
        if (typeof from.location === 'number') {
            // From tableau
            const fromPile = this.tableau[from.location];
            const cardsToMove = fromPile.slice(from.index);
            // Store deep copies of cards for undo (so face-up state changes don't affect undo data)
            moveData.cards = cardsToMove.map(c => ({ ...c }));
            // Store references to the actual cards being moved
            moveData.cardRefs = cardsToMove;
            this.tableau[from.location] = fromPile.slice(0, from.index);

            // Track if we flipped a card
            if (this.tableau[from.location].length > 0 && !this.tableau[from.location][this.tableau[from.location].length - 1].faceUp) {
                moveData.flippedCard = this.tableau[from.location].length - 1;
                this.tableau[from.location][this.tableau[from.location].length - 1].faceUp = true;
                this.score += 5;
                moveData.scoreChange = 5;
            }

            this.tableau[toPile].push(...cardsToMove);
        } else if (from.location === 'waste') {
            // From waste - store deep copy for undo data, reference for actual card
            moveData.cards = [{ ...card }];
            moveData.cardRefs = [card];
            // Remove card from waste at the specific index (not just pop from end)
            // In Turn 3 mode, only the top card should be moveable, which is at the end
            // But we need to ensure we're removing the right card
            const cardIndex = this.waste.indexOf(card);
            if (cardIndex !== -1) {
                this.waste.splice(cardIndex, 1);
            }
            this.tableau[toPile].push(card);
        }

        return moveData;
    }

    moveToFoundation(from, foundationIndex) {
        const card = this.selectedCard;
        const foundation = this.foundations[foundationIndex];

        // Check if valid move
        if (foundation.length === 0) {
            // Empty foundation - must be an Ace
            if (card.numValue !== 1) return null;
        } else {
            const topCard = foundation[foundation.length - 1];
            // Must be same suit and next in sequence
            if (card.suit !== topCard.suit || card.numValue !== topCard.numValue + 1) {
                return null;
            }
        }

        // Create move data for undo
        const moveData = {
            type: 'foundation',
            from: { ...from },
            to: foundationIndex,
            card: { ...card },  // Store copy for undo data
            cardRef: card,  // Store reference for removal
            flippedCard: null,
            scoreChange: 10
        };

        // Execute move - remove card from source
        if (typeof from.location === 'number') {
            // From tableau
            const fromPile = this.tableau[from.location];
            fromPile.pop();

            // Flip top card if exists
            if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
                moveData.flippedCard = fromPile.length - 1;
                fromPile[fromPile.length - 1].faceUp = true;
                this.score += 5;
                moveData.scoreChange += 5;
            }
        } else if (from.location === 'waste') {
            // From waste - remove the specific card
            const cardIndex = this.waste.indexOf(card);
            if (cardIndex !== -1) {
                this.waste.splice(cardIndex, 1);
            }
        } else if (from.location === 'foundation') {
            // From another foundation - remove the card from source foundation
            const sourceFoundation = this.foundations[from.index];
            sourceFoundation.pop();
            // No score change when moving between foundations
            moveData.scoreChange = 0;
        }

        foundation.push(card);

        // Only add score if not moving between foundations
        if (from.location !== 'foundation') {
            this.score += 10;
        }

        return moveData;
    }

    drawFromStock() {
        if (this.stock.length > 0) {
            // Draw cards based on draw mode
            const cardsToDraw = Math.min(this.drawMode, this.stock.length);
            for (let i = 0; i < cardsToDraw; i++) {
                const card = this.stock.pop();
                card.faceUp = true;
                this.waste.push(card);
            }
            this.renderGame();
        } else if (this.waste.length > 0) {
            // Recycle waste back to stock
            while (this.waste.length > 0) {
                const card = this.waste.pop();
                card.faceUp = false;
                this.stock.unshift(card);
            }
            this.renderGame();
        }
    }

    undo() {
        if (this.moveHistory.length === 0) {
            return;
        }

        const lastMove = this.moveHistory.pop();
        this.moves--;
        this.score -= lastMove.scoreChange;

        if (lastMove.type === 'tableau') {
            // Undo tableau move
            const toPile = this.tableau[lastMove.to];
            // Remove the cards that were moved (use cardRefs length)
            const numCardsToRemove = lastMove.cardRefs ? lastMove.cardRefs.length : lastMove.cards.length;
            toPile.splice(toPile.length - numCardsToRemove);

            if (typeof lastMove.from.location === 'number') {
                // Move back to tableau pile
                const fromPile = this.tableau[lastMove.from.location];

                // Unflip card if we flipped one during the move
                if (lastMove.flippedCard !== null) {
                    fromPile[lastMove.flippedCard].faceUp = false;
                }

                // Restore the original cards with their original face-up states (from copies)
                fromPile.push(...lastMove.cards);
            } else if (lastMove.from.location === 'waste') {
                // Move back to waste - restore the copied card data
                this.waste.push(...lastMove.cards);
            }
        } else if (lastMove.type === 'foundation') {
            // Undo foundation move
            const foundation = this.foundations[lastMove.to];
            foundation.pop();

            if (typeof lastMove.from.location === 'number') {
                // Move back to tableau pile
                const fromPile = this.tableau[lastMove.from.location];

                // Unflip card if we flipped one during the move
                if (lastMove.flippedCard !== null) {
                    fromPile[lastMove.flippedCard].faceUp = false;
                }

                // Restore the original card
                fromPile.push(lastMove.card);
            } else if (lastMove.from.location === 'waste') {
                // Move back to waste
                this.waste.push(lastMove.card);
            } else if (lastMove.from.location === 'foundation') {
                // Move back to source foundation
                const sourceFoundation = this.foundations[lastMove.from.index];
                sourceFoundation.push(lastMove.card);
            }
        }

        this.renderGame();
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
        document.getElementById('score').textContent = this.score;
    }

    checkWin() {
        // Check if all 4 foundations have 13 cards
        const allComplete = this.foundations.every(foundation => foundation.length === 13);

        if (allComplete) {
            this.stopTimer();
            setTimeout(() => {
                document.getElementById('final-moves').textContent = this.moves;
                document.getElementById('final-time').textContent = document.getElementById('timer').textContent;
                document.getElementById('final-score').textContent = this.score;
                document.getElementById('win-modal').classList.add('active');
            }, 500);
        }
    }

    setDrawMode(mode) {
        // Changing draw mode starts a new game
        this.drawMode = mode;
        this.reset();
    }

    reset() {
        this.stopTimer();
        this.deck = [];
        this.tableau = [[], [], [], [], [], [], []];
        this.foundations = [[], [], [], []]; // 4 foundation piles
        this.stock = [];
        this.waste = [];
        this.selectedCard = null;
        this.selectedFrom = null;
        this.moves = 0;
        this.score = 0;
        this.timer = 0;
        this.moveHistory = [];
        this.init();
    }

    attachEventListeners() {
        // New game button
        document.getElementById('new-game').addEventListener('click', () => this.reset());

        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            this.reset();
        });

        // Stock pile
        document.getElementById('stock').addEventListener('click', () => this.drawFromStock());

        // Undo button
        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });

        // Draw mode buttons
        document.getElementById('draw-1').addEventListener('click', () => {
            document.querySelectorAll('.draw-mode-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('draw-1').classList.add('active');
            this.setDrawMode(1);
        });

        document.getElementById('draw-3').addEventListener('click', () => {
            document.querySelectorAll('.draw-mode-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById('draw-3').classList.add('active');
            this.setDrawMode(3);
        });

        // Foundation pile clicks and drag-drop
        const foundations = document.querySelectorAll('.foundation');
        foundations.forEach(foundation => {
            foundation.addEventListener('click', (e) => {
                if (this.selectedCard) {
                    const index = parseInt(foundation.dataset.index);
                    this.attemptMove('foundation', index);
                }
            });

            // Add drag-and-drop listeners
            foundation.addEventListener('dragover', (e) => this.handleDragOver(e));
            foundation.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            foundation.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            foundation.addEventListener('drop', (e) => {
                const index = parseInt(foundation.dataset.index);
                this.handleDrop(e, 'foundation', index);
            });
        });

        // Tableau pile clicks and drag-drop (for empty piles)
        const tableauPiles = document.querySelectorAll('.tableau-pile');
        tableauPiles.forEach(pile => {
            pile.addEventListener('click', (e) => {
                if (this.selectedCard && e.target === pile) {
                    const pileIndex = parseInt(pile.dataset.pile);
                    this.attemptMove(pileIndex, 0);
                }
            });

            // Add drag-and-drop listeners
            pile.addEventListener('dragover', (e) => this.handleDragOver(e));
            pile.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            pile.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            pile.addEventListener('drop', (e) => {
                const pileIndex = parseInt(pile.dataset.pile);
                this.handleDrop(e, pileIndex, 0);
            });
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new KlondikeSolitaire();
});
