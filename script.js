document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// Improved screen switching: hide all screens, then show the target
function switchScreen(showId) {
  document.querySelectorAll('#game-container > div').forEach(el => {
    if (!el.classList.contains('hidden')) {
      el.classList.add('fade-out');
      setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('fade-out');
      }, 300);
    }
  });
  
  const showElement = document.getElementById(showId);
  setTimeout(() => {
    showElement.classList.remove('hidden');
    showElement.classList.add('fade-in');
    setTimeout(() => {
      showElement.classList.remove('fade-in');
    }, 300);
  }, 300);
}

// Initialize game state
let currentCar = null;
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
let negotiationAttempts = 0;
let maxAttempts = 5; // Will be re-assigned in startNegotiation

const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Business Merger": 0,
  "Salary Negotiation": 0,
  "Buy a Car": {
    "new_car": 0,
    "old_car": 0,
    "antique": 0
  }
};

// Event Listeners

// Navigation
document.getElementById('start-button').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-initial-from-scenarios').addEventListener('click', () => switchScreen('initial-screen'));
document.getElementById('high-scores-button').addEventListener('click', () => {
  switchScreen('high-scores');
  updateHighScores();
});
document.getElementById('reset-high-scores-button').addEventListener('click', () => highScores = {
  "Business Merger": 0,
  "Salary Negotiation": 0,
  "Buy a Car": {
    "new_car": 0,
    "old_car": 0,
    "antique": 0
  }
});
document.getElementById('back-to-scenarios-from-high-scores').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-scenarios-from-congrats').addEventListener('click', () => {
  switchScreen('scenario-selection');
  resetNegotiation();
});
document.getElementById('back-to-car-selection-from-congrats').addEventListener('click', () => {
  switchScreen('car-selection');
  resetNegotiation();
});

// Scenario selection
document.querySelectorAll('.scenario-button').forEach(button => {
  button.addEventListener('click', function() {
    const scenario = this.getAttribute('data-scenario');
    if (scenario === 'buy-car') {
      switchScreen('car-selection');
    } else {
      showTemporaryMessage('Scenario under construction! Coming soon!');
    }
  });
});

// Car selection: start negotiation for chosen car
document.querySelectorAll('.car-option').forEach(option => {
  option.addEventListener('click', function() {
    const carType = this.getAttribute('data-car');
    startNegotiation(carType);
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-car-selection').addEventListener('click', () => {
  switchScreen('car-selection');
  resetNegotiation();
});

// Negotiation events
document.getElementById('propose-offer').addEventListener('click', function() {
  const offerInput = document.getElementById('offer-input');
  const offer = parseFloat(offerInput.value.replace(/,/g, ''));

  if (isNaN(offer)) { 
    showInputError(offerInput, 'Please enter a valid number');
    return;
  }

  if (offer <= 0) {
    showInputError(offerInput, 'Offer must be positive');
    return;
  }

  negotiationAttempts++;
  handleOffer(offer);
  offerInput.value = '';
});

document.getElementById('accept-offer').addEventListener('click', function() {
  const offerText = this.textContent;
  const offer = parseFloat(offerText.split('$')[1].replace(/,/g, ''));
  endNegotiation(offer);
});

document.getElementById('offer-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('propose-offer').click();
  }
});

// Game Functions
function startNegotiation(carType) {
  currentCar = carType;
  negotiationAttempts = 0;
  
  // Randomly choose maxAttempts from 1 to 5 for this negotiation
  maxAttempts = Math.floor(Math.random() * 5) + 1;

  const carSpecs = {
    "new_car": { label: "New Car", price: 50000 },
    "old_car": { label: "Old Car", price: 10000 },
    "antique": { label: "Antique Car", price: 13000 }
  };

  initialPrice = carSpecs[carType].price;
  minPrice = initialPrice * (0.75 + Math.random() * 0.1); // Slight randomization

  // Update seller dialog
  document.getElementById('seller-dialog').innerHTML = `
    🤑 Seller: Welcome! Interested in this ${carSpecs[carType].label}?<br>
    Initial Price: $${initialPrice.toLocaleString()}
  `;
  // Remove the attempts counter text from view

  // Set the negotiation screen's car image
  document.getElementById('negotiation-car-image').src = `${carType}.png`;
}

function handleOffer(offer) {
  const sellerDialog = document.getElementById('seller-dialog');
  const acceptButton = document.getElementById('accept-offer');

  if (negotiationAttempts >= maxAttempts) {
    sellerDialog.innerHTML = `
      😠 Seller: Too many low offers! I'm ending negotiations.<br>
      Final Price: $${initialPrice.toLocaleString()}
    `;
    acceptButton.textContent = `Accept $${initialPrice.toLocaleString()}`;
    return;
  }

  if (offer < minPrice * 0.9) {
    // Very low offer
    const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDialog.innerHTML = `
      😠 Seller: That's insulting! My best: $${counterOffer.toLocaleString()}<br>
      (Try offering between $${Math.floor(minPrice * 0.9).toLocaleString()} and $${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    // Low but reasonable
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDialog.innerHTML = `
      🤔 Seller: Hmm... how about $${counterOffer.toLocaleString()}?<br>
      (You're getting close!)
    `;
    acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice * 1.1) {
    // Good offer
    sellerDialog.innerHTML = `
      😊 Seller: That's reasonable! I accept $${offer.toLocaleString()}!<br>
      (Great negotiation!)
    `;
    acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
  } else {
    // Overpaying
    sellerDialog.innerHTML = `
      🎉 Seller: Deal! Let's sign the papers for $${offer.toLocaleString()}!<br>
      (You could have gotten a better deal)
    `;
    acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
  }
}

function endNegotiation(offer) {
  agreedPrice = offer;
  const score = Math.max(0, initialPrice - agreedPrice);

  updateHighScore(currentCar, score);
  saveHighScores();

  document.getElementById('car-image').src = `${currentCar}.png`;
  document.getElementById('score-text').innerHTML = `
    You negotiated a ${currentCar.replace('_', ' ')} from $${initialPrice.toLocaleString()} to $${agreedPrice.toLocaleString()}<br>
    Your score: ${score.toLocaleString()}
  `;
  createConfetti();
  switchScreen('congratulations');
}

function updateHighScore(carType, score) {
  if (score > highScores["Buy a Car"][carType]) {
    highScores["Buy a Car"][carType] = score;
    document.getElementById('score-text').innerHTML += `<br>🏆 New High Score! 🏆`;
  }
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function updateHighScores() {
  let scoresText = "";
  const carLabels = {
    "new_car": "New Car",
    "old_car": "Old Car",
    "antique": "Antique Car"
  };

  for (const scenario in highScores) {
    if (scenario === "Buy a Car") {
      scoresText += `${scenario}:\n`;
      for (const car in highScores[scenario]) {
        scoresText += `  ${carLabels[car]}: $${highScores[scenario][car].toLocaleString()}\n`;
      }
    } else {
      scoresText += `${scenario}: $${highScores[scenario].toLocaleString()}\n`;
    }
  }
  document.getElementById('high-scores-text').textContent = scoresText;
}

function resetNegotiation() {
  currentCar = null;
  initialPrice = 0;
  minPrice = 0;
  agreedPrice = null;
  negotiationAttempts = 0;
}

function createConfetti() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'];
  const container = document.getElementById('congratulations');
  document.querySelectorAll('.confetti').forEach(el => el.remove());
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 3 + 's';
    container.appendChild(confetti);
  }
}

function showInputError(inputElement, message) {
  let errorElement = document.getElementById('offer-error');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'offer-error';
    errorElement.className = 'error-message';
    document.getElementById('player-bubble').appendChild(errorElement);
  }
  errorElement.textContent = message;
  inputElement.style.borderColor = 'red';

  setTimeout(() => {
    errorElement.textContent = '';
    inputElement.style.borderColor = 'var(--accent-color)';
  }, 3000);
}

function showTemporaryMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'temp-message';
  messageElement.textContent = message;
  document.body.appendChild(messageElement);
  setTimeout(() => {
    messageElement.classList.add('fade-out');
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }, 2000);
}
