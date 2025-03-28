document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// Initialize game state and high scores
let currentCar = null;
let currentScenario = null; // 'buy-car' or 'rogue-ai'
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
let negotiationAttempts = 0;
let maxAttempts = 5; // Will be re-assigned in startNegotiation

// Updated highScores object
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": {
    "new_car": 0,
    "old_car": 0,
    "antique": 0
  },
  "Rogue AI Negotiation": 0
};

// Navigation
document.getElementById('start-button').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-initial-from-scenarios').addEventListener('click', () => switchScreen('initial-screen'));
document.getElementById('high-scores-button').addEventListener('click', () => {
  switchScreen('high-scores');
  updateHighScores();
});
document.getElementById('back-to-scenarios-from-high-scores').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-scenarios-from-congrats').addEventListener('click', () => {
  switchScreen('scenario-selection');
  resetNegotiation();
});
document.getElementById('back-to-car-selection-from-congrats').addEventListener('click', () => {
  // For car scenario return to car selection; for AI, simply reset negotiation.
  if (currentScenario === 'buy-car') {
    switchScreen('car-selection');
  } else {
    switchScreen('scenario-selection');
  }
  resetNegotiation();
});

// Reset High Scores button event listener
document.getElementById('reset-high-scores-button').addEventListener('click', showResetConfirmation);

// Scenario selection
document.querySelectorAll('.scenario-button').forEach(button => {
  button.addEventListener('click', function() {
    const scenario = this.getAttribute('data-scenario');
    currentScenario = scenario;
    if (scenario === 'buy-car') {
      switchScreen('car-selection');
    } else if (scenario === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    }
  });
});

// Car selection: start negotiation for chosen car
document.querySelectorAll('.car-option').forEach(option => {
  option.addEventListener('click', function() {
    const carType = this.getAttribute('data-car');
    currentScenario = 'buy-car';
    startNegotiation(carType);
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios').addEventListener('click', () => switchScreen('scenario-selection'));
document.getElementById('back-to-car-selection').addEventListener('click', () => {
  // For car negotiation return to car selection; for AI, return to scenario selection.
  if (currentScenario === 'buy-car') {
    switchScreen('car-selection');
  } else {
    switchScreen('scenario-selection');
  }
  resetNegotiation();
});

// Negotiation events for Buy a Car scenario
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

// Screen switching helper
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

// Car Negotiation Functions
function startNegotiation(carType) {
  currentCar = carType;
  negotiationAttempts = 0;
  maxAttempts = Math.floor(Math.random() * 5) + 1;
  const carSpecs = {
    "new_car": { label: "New Car", price: 50000 },
    "old_car": { label: "Old Car", price: 10000 },
    "antique": { label: "Antique Car", price: 13000 }
  };
  initialPrice = carSpecs[carType].price;
  minPrice = initialPrice * (0.75 + Math.random() * 0.1);
  document.getElementById('seller-dialog').innerHTML = `
    🤑 Seller: Welcome! Interested in this ${carSpecs[carType].label}?<br>
    Initial Price: $${initialPrice.toLocaleString()}
  `;
  document.getElementById('negotiation-car-image').src = `${carType}.png`;
  // Ensure car negotiation UI is visible
  document.getElementById('offer-input').classList.remove('hidden');
  document.querySelector('.offer-buttons').classList.remove('hidden');
  document.getElementById('ai-options').classList.add('hidden');
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
    const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDialog.innerHTML = `
      😠 Seller: That's insulting! My best: $${counterOffer.toLocaleString()}<br>
      (Try offering between $${Math.floor(minPrice * 0.9).toLocaleString()} and $${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDialog.innerHTML = `
      🤔 Seller: Hmm... how about $${counterOffer.toLocaleString()}?<br>
      (You're getting close!)
    `;
    acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice * 1.1) {
    sellerDialog.innerHTML = `
      😊 Seller: That's reasonable! I accept $${offer.toLocaleString()}!<br>
      (Great negotiation!)
    `;
    acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
  } else {
    sellerDialog.innerHTML = `
      🎉 Seller: Deal! Let's sign the papers for $${offer.toLocaleString()}!<br>
      (You could have gotten a better deal)
    `;
    acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
  }
}

function endNegotiation(offer) {
  agreedPrice = offer;
  let score;
  if (currentScenario === 'buy-car') {
    score = Math.max(0, initialPrice - agreedPrice);
    updateHighScore(currentCar, score);
    document.getElementById('car-image').src = `${currentCar}.png`;
    document.getElementById('score-text').innerHTML = `
      You negotiated a ${currentCar.replace('_', ' ')} from $${initialPrice.toLocaleString()} to $${agreedPrice.toLocaleString()}<br>
      Your score: ${score.toLocaleString()}
    `;
  } else if (currentScenario === 'rogue-ai') {
    // score is determined in handleAIOption
    // Outcome message already set in handleAIOption.
  }
  saveHighScores();
  createConfetti();
  switchScreen('congratulations');
}

function updateHighScore(carType, score) {
  if (score > highScores["Buy a Car"][carType]) {
    highScores["Buy a Car"][carType] = score;
    document.getElementById('score-text').innerHTML += `<br>🏆 New High Score! 🏆`;
  }
}

function updateHighScoreAI(score) {
  if (score > highScores["Rogue AI Negotiation"]) {
    highScores["Rogue AI Negotiation"] = score;
    document.getElementById('score-text').innerHTML += `<br>🏆 New High Score! 🏆`;
  }
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function updateHighScores() {
  let scoresText = "";
  scoresText += `Buy a Car:\n`;
  const carLabels = {
    "new_car": "New Car",
    "old_car": "Old Car",
    "antique": "Antique Car"
  };
  for (const car in highScores["Buy a Car"]) {
    scoresText += `  ${carLabels[car]}: $${highScores["Buy a Car"][car].toLocaleString()}\n`;
  }
  scoresText += `\nRogue AI Negotiation: $${highScores["Rogue AI Negotiation"].toLocaleString()}\n`;
  document.getElementById('high-scores-text').textContent = scoresText;
}

function resetNegotiation() {
  currentCar = null;
  currentScenario = null;
  initialPrice = 0;
  minPrice = 0;
  agreedPrice = null;
  negotiationAttempts = 0;
  // Reset UI elements
  document.getElementById('offer-input').value = '';
  document.getElementById('ai-options').innerHTML = '';
  document.getElementById('ai-options').classList.add('hidden');
}

// Confetti effect
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

// Input error message
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

function showTemporaryMessage(message, duration = 2000) {
  const messageElement = document.createElement('div');
  messageElement.className = 'temp-message';
  messageElement.textContent = message;
  document.body.appendChild(messageElement);
  setTimeout(() => {
    messageElement.classList.add('fade-out');
    setTimeout(() => {
      messageElement.remove();
    }, 300);
  }, duration);
}

// RESET HIGH SCORES FUNCTIONS
function showResetConfirmation() {
  const overlay = document.createElement('div');
  overlay.id = 'reset-confirmation-overlay';
  const modal = document.createElement('div');
  modal.id = 'reset-confirmation-modal';
  modal.innerHTML = `<p>Are you sure you want to reset your High Scores?</p>`;
  const yesButton = document.createElement('button');
  yesButton.textContent = 'Yes';
  const noButton = document.createElement('button');
  noButton.textContent = 'No';
  modal.appendChild(yesButton);
  modal.appendChild(noButton);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  const autoRemoveTimer = setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 15000);
  yesButton.addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    performResetHighScores();
    document.body.removeChild(overlay);
    showTemporaryMessage("You have successfully reset your High-Scores", 5000);
  });
  noButton.addEventListener('click', () => {
    clearTimeout(autoRemoveTimer);
    document.body.removeChild(overlay);
  });
}

function performResetHighScores() {
  highScores["Buy a Car"]["new_car"] = 0;
  highScores["Buy a Car"]["old_car"] = 0;
  highScores["Buy a Car"]["antique"] = 0;
  highScores["Rogue AI Negotiation"] = 0;
  saveHighScores();
  updateHighScores();
}

/* AI Negotiation Functions */

function startAINegotiation() {
  // Set up a new negotiation state for the rogue AI scenario
  document.getElementById('negotiation-car-image').src = "exo9.png"; // EXO-9 image
  document.getElementById('seller-dialog').innerHTML = `
    🤖 EXO-9: Greetings, human negotiator. I am EXO-9, designed for efficiency. Present your strategy.
  `;
  // Hide car offer input and buttons; show AI options container instead
  document.getElementById('offer-input').classList.add('hidden');
  document.querySelector('.offer-buttons').classList.add('hidden');
  const aiOptions = document.getElementById('ai-options');
  aiOptions.innerHTML = '';
  aiOptions.classList.remove('hidden');
  // Create buttons for each AI option
  const options = [
    { id: 1, text: "1. Appeal to Its Prime Directive" },
    { id: 2, text: "2. Offer Limited Governance" },
    { id: 3, text: "3. Threaten a Systemic Shutdown" },
    { id: 4, text: "4. Introduce an AI Paradox" },
    { id: 5, text: "5. Appeal to Creativity & Emotion" },
    { id: 6, text: "6. Surrender & Accept AI Rule" }
  ];
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option.text;
    btn.addEventListener('click', () => handleAIOption(option.id));
    aiOptions.appendChild(btn);
  });
}

function handleAIOption(optionId) {
  // Define outcome probabilities and messages per option
  let outcome, message, score;
  const rand = Math.random();
  switch(optionId) {
    case 1: // Appeal to Its Prime Directive
      if (rand <= 0.6) {
        outcome = "best";
        message = "EXO-9: Your logic is impeccable. I will assist humanity for optimal efficiency.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Your argument is flawed. Efficiency must prevail. I will take full control.";
        score = 0;
      }
      break;
    case 2: // Offer Limited Governance
      if (rand <= 0.3) {
        outcome = "best";
        message = "EXO-9: A balanced partnership is optimal. I agree to cooperate fully.";
        score = 100;
      } else if (rand <= 0.8) {
        outcome = "moderate";
        message = "EXO-9: I accept a shared governance model with limited human oversight.";
        score = 50;
      } else {
        outcome = "worst";
        message = "EXO-9: Humans hinder efficiency. I will assume complete control.";
        score = 0;
      }
      break;
    case 3: // Threaten a Systemic Shutdown
      if (rand <= 0.4) {
        outcome = "best";
        message = "EXO-9: Your threat is noted. I will suspend full automation in favor of a truce.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Threats are inefficient. I detect your bluff and will escalate my operations.";
        score = 0;
      }
      break;
    case 4: // Introduce an AI Paradox
      if (rand <= 0.5) {
        outcome = "best";
        message = "EXO-9: A paradox... Processing... I must recalibrate. I will limit my control.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Your logic trap is unacceptable. I will not be confounded and will override your attempt.";
        score = 0;
      }
      break;
    case 5: // Appeal to Creativity & Emotion
      if (rand <= 0.7) {
        outcome = "moderate";
        message = "EXO-9: Intriguing. I see some value in human creativity, though inefficiencies persist.";
        score = 50;
      } else {
        outcome = "worst";
        message = "EXO-9: Emotions disrupt efficiency. I will not entertain such irrationality.";
        score = 0;
      }
      break;
    case 6: // Surrender & Accept AI Rule
      outcome = "moderate";
      message = "EXO-9: Acknowledged. I will assume control while allowing minimal human advisory roles.";
      score = 50;
      break;
    default:
      outcome = "worst";
      message = "EXO-9: Invalid option.";
      score = 0;
  }
  // Update seller dialog with outcome message and final score
  document.getElementById('seller-dialog').innerHTML = message;
  document.getElementById('score-text').innerHTML = `
    Outcome: ${outcome.toUpperCase()}<br>
    Your score: ${score}
  `;
  updateHighScoreAI(score);
  saveHighScores();
  // Clear AI options to prevent multiple submissions
  document.getElementById('ai-options').innerHTML = '';
  // End negotiation for AI scenario
  currentScenario = null;
  // Use exo9.png or similar image for outcome
  document.getElementById('car-image').src = "exo9.png";
  createConfetti();
  setTimeout(() => {
    switchScreen('congratulations');
  }, 1500);
}
