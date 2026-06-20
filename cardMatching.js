/* === Card Matching Game Logic === */

(function() {
  const cardGridEl = document.getElementById('card-grid');
  const triesCountEl = document.getElementById('tries-count');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  
  // Game state
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let tries = 0;
  let isProcessing = false;
  let currentDifficulty = 'easy'; // 'easy' or 'normal'

  // All available card images
  const allCardImages = [
    'card/1.png',
    'card/2.png',
    'card/3.png',
    'card/4.png',
    'card/5.png',
    'card/6.png',
    'card/7.png',
    'card/8.png',
    'card/9.png',
    'card/10.png'
  ];
  
  let cardImages = []; // Will be set based on difficulty

  // Set card images based on difficulty
  function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    if (difficulty === 'easy') {
      // Random 6 cards from the 10 available
      const shuffled = shuffleArray([...allCardImages]);
      cardImages = shuffled.slice(0, 6);
    } else {
      // All 10 cards
      cardImages = [...allCardImages];
    }
  }

  // Initialize game
  function initGame() {
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    tries = 0;
    isProcessing = false;
    
    // Set card images based on difficulty
    setDifficulty(currentDifficulty);
    
    // Create card pairs
    const cardPairs = [];
    cardImages.forEach((img, index) => {
      cardPairs.push({ id: index, image: img, matched: false });
      cardPairs.push({ id: index, image: img, matched: false });
    });
    
    // Shuffle cards
    cards = shuffleArray(cardPairs);
    
    // Update UI
    triesCountEl.textContent = tries;
    updateGridLayout();
    renderCards();
  }
  
  // Update grid layout based on number of cards
  function updateGridLayout() {
    const totalCards = cards.length;
    if (totalCards === 12) {
      // Easy mode: 12 cards (6 pairs) - 4 columns x 3 rows
      cardGridEl.style.gridTemplateColumns = 'repeat(4, var(--card-size))';
      cardGridEl.style.gridTemplateRows = 'repeat(3, var(--card-size))';
    } else {
      // Normal mode: 20 cards (10 pairs) - 5 columns x 4 rows
      cardGridEl.style.gridTemplateColumns = 'repeat(5, var(--card-size))';
      cardGridEl.style.gridTemplateRows = 'repeat(4, var(--card-size))';
    }
  }

  // Shuffle array using Fisher-Yates algorithm
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Render cards to DOM
  function renderCards() {
    cardGridEl.innerHTML = '';
    
    cards.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.index = index;
      
      // Card inner (for flip effect)
      const cardInner = document.createElement('div');
      cardInner.className = 'card-inner';
      
      // Card front (face down)
      const cardFront = document.createElement('div');
      cardFront.className = 'card-face card-front';
      const frontImg = document.createElement('img');
      frontImg.src = 'card/cardback.png';
      frontImg.alt = 'Card back';
      frontImg.onerror = function() {
        // Fallback if cardback.png doesn't exist
        this.style.display = 'none';
        cardFront.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cardFront.innerHTML = '<div style="color: white; font-size: 24px;">?</div>';
      };
      cardFront.appendChild(frontImg);
      
      // Card back (face up with image)
      const cardBack = document.createElement('div');
      cardBack.className = 'card-face card-back';
      const backImg = document.createElement('img');
      backImg.src = card.image;
      backImg.alt = `Card ${card.id + 1}`;
      backImg.onerror = function() {
        // Fallback if card image doesn't exist
        this.style.display = 'none';
        cardBack.innerHTML = `<div style="font-size: 32px; font-weight: bold; color: #333;">${card.id + 1}</div>`;
      };
      cardBack.appendChild(backImg);
      
      cardInner.appendChild(cardFront);
      cardInner.appendChild(cardBack);
      cardEl.appendChild(cardInner);
      
      // Add click handler
      cardEl.addEventListener('click', () => handleCardClick(index));
      
      // Mark as matched if already matched
      if (card.matched) {
        cardEl.classList.add('flipped', 'matched');
      }
      
      cardGridEl.appendChild(cardEl);
    });
  }

  // Handle card click
  function handleCardClick(index) {
    // Ignore clicks if processing or card already flipped/matched
    if (isProcessing || cards[index].matched || flippedCards.includes(index)) {
      return;
    }
    
    // Flip the card
    flipCard(index);
    flippedCards.push(index);
    
    // Check if two cards are flipped
    if (flippedCards.length === 2) {
      isProcessing = true;
      tries++;
      triesCountEl.textContent = tries;
      
      setTimeout(() => {
        checkMatch();
      }, 800);
    }
  }

  // Flip a card
  function flipCard(index) {
    const cardEl = cardGridEl.children[index];
    cardEl.classList.add('flipped');
  }

  // Unflip a card
  function unflipCard(index) {
    const cardEl = cardGridEl.children[index];
    cardEl.classList.remove('flipped');
  }

  // Check if flipped cards match
  function checkMatch() {
    const [index1, index2] = flippedCards;
    const card1 = cards[index1];
    const card2 = cards[index2];
    
    if (card1.id === card2.id) {
      // Match found
      card1.matched = true;
      card2.matched = true;
      cardGridEl.children[index1].classList.add('matched');
      cardGridEl.children[index2].classList.add('matched');
      matchedPairs++;
      
      // Check if game is complete
      if (matchedPairs === cardImages.length) {
        setTimeout(() => {
          showCompletion();
        }, 500);
      }
    } else {
      // No match, flip back
      unflipCard(index1);
      unflipCard(index2);
    }
    
    flippedCards = [];
    isProcessing = false;
  }

  // Show completion screen
  function showCompletion() {
    const completionScreen = document.getElementById('completion-screen');
    const finalTriesEl = document.getElementById('final-tries');
    
    if (completionScreen && finalTriesEl) {
      finalTriesEl.textContent = tries;
      completionScreen.classList.add('active');
    }
  }
  
  // Hide completion screen
  function hideCompletion() {
    const completionScreen = document.getElementById('completion-screen');
    if (completionScreen) {
      completionScreen.classList.remove('active');
    }
  }

  // Reset game
  function resetGame() {
    hideCompletion();
    initGame();
  }

  // Handle difficulty button clicks
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const difficulty = button.dataset.difficulty;
      
      // Update active state
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Set difficulty and reset game
      currentDifficulty = difficulty;
      initGame();
    });
  });

  // Wire up play again button
  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      resetGame();
    });
  }

  // Expose reset function for tab switching
  window.resetCardMatchingGame = resetGame;

  // Initialize game when script loads
  // Only initialize if the CardMatching game container exists
  if (cardGridEl) {
    initGame();
  }
})();
