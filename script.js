document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// Global Game State
let currentCar = null;
let currentScenario = null; // 'buy-car', 'rogue-ai', or 'salary-negotiation'
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
let negotiationAttempts = 0;
let maxAttempts = 5; // For car negotiation

// Salary negotiation state variables
let salaryRole = ""; // "high" or "low"
let initialSalaryOffer = 0;
let employerMax = 0;
let employerRemaining = 0;
let finalSalaryOffer = 0;
let incentiveBonus = 0;
let requestedIncentives = [];
let incentiveRequestsCount = 0;
const maxIncentives = 4;
const incentivesData = [
  { name: "Signing Bonus", value: 2000, cost: 3000 },
  { name: "Flexible Working Hours", valuePercent: 10, costPercent: 7.5 },
  { name: "Professional Development", value: 500, cost: 1000 },
  { name: "Gym Access", value: 150, cost: 100 },
  { name: "Coffee Machine", value: 100, cost: 10 }
];

// High Scores Object
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": {
    "new_car": 0,
    "old_car": 0,
    "antique": 0
  },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": 0
};

// Navigation Event Listeners
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
  if (currentScenario === 'buy-car') {
    switchScreen('car-selection');
  } else {
    switchScreen('scenario-selection');
  }
  resetNegotiation();
});

// Reset High Scores
document.getElementById('reset-high-scores-button').addEventListener('click', showResetConfirmation);

// Scenario Selection
document.querySelectorAll('.scenario-button').forEach(button => {
  button.addEventListener('click', function() {
    const scenario = this.getAttribute('data-scenario');
    currentScenario = scenario;
    if (scenario === 'buy-car') {
      switchScreen('car-selection');
    } else if (scenario === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    } else if (scenario === 'salary-negotiation') {
      switchScreen('salary-role-selection');
    }
  });
});

// Car Selection: start negotiation for chosen car
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
  if (currentScenario === 'buy-car') {
    switchScreen('car-selection');
  } else {
    switchScreen('scenario-selection');
  }
  resetNegotiation();
});

// Salary Role Selection Event Listeners
document.querySelectorAll('.role-button').forEach(button => {
  button.addEventListener('click', function() {
    salaryRole = this.getAttribute('data-role');
    beginSalaryNegotiation(salaryRole);
    switchScreen('negotiation');
  });
});
document.getElementById('back-to-scenarios-from-salary-role').addEventListener('click', () => switchScreen('scenario-selection'));

// Negotiation Events for Buy a Car (default) or Salary Negotiation
document.getElementById('propose-offer').addEventListener('click', function() {
  if (currentScenario === 'buy-car') {
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
  } else if (currentScenario === 'salary-negotiation') {
    handleSalaryOffer();
  }
});

document.getElementById('accept-offer').addEventListener('click', function() {
  if (currentScenario === 'buy-car' || currentScenario === 'rogue-ai') {
    const offerText = this.textContent;
    const offer = parseFloat(offerText.split('£')[1].replace(/,/g, ''));
    endNegotiation(offer);
  } else if (currentScenario === 'salary-negotiation') {
    acceptSalaryOffer();
  }
});

// For Enter key in input field
document.getElementById('offer-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('propose-offer').click();
  }
});

// Screen Switching Helper
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

// ------------------------
// Car Negotiation Functions
// ------------------------
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
    Initial Price: £${initialPrice.toLocaleString()}
  `;
  document.getElementById('negotiation-car-image').src = `${carType}.png`;
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
      Final Price: £${initialPrice.toLocaleString()}
    `;
    acceptButton.textContent = `Accept £${initialPrice.toLocaleString()}`;
    return;
  }
  if (offer < minPrice * 0.9) {
    const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDialog.innerHTML = `
      😠 Seller: That's insulting! My best: £${counterOffer.toLocaleString()}<br>
      (Try offering between £${Math.floor(minPrice * 0.9).toLocaleString()} and £${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptButton.textContent = `Accept £${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDialog.innerHTML = `
      🤔 Seller: Hmm... how about £${counterOffer.toLocaleString()}?<br>
      (You're getting close!)
    `;
    acceptButton.textContent = `Accept £${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice * 1.1) {
    sellerDialog.innerHTML = `
      😊 Seller: That's reasonable! I accept £${offer.toLocaleString()}!<br>
      (Great negotiation!)
    `;
    acceptButton.textContent = `Accept £${offer.toLocaleString()}`;
  } else {
    sellerDialog.innerHTML = `
      🎉 Seller: Deal! Let's sign the papers for £${offer.toLocaleString()}!<br>
      (You could have gotten a better deal)
    `;
    acceptButton.textContent = `Accept £${offer.toLocaleString()}`;
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
      You negotiated a ${currentCar.replace('_', ' ')} from £${initialPrice.toLocaleString()} to £${agreedPrice.toLocaleString()}<br>
      Your score: ${score.toLocaleString()}
    `;
  } else if (currentScenario === 'rogue-ai') {
    // Score determined in handleAIOption
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
    scoresText += `  ${carLabels[car]}: £${highScores["Buy a Car"][car].toLocaleString()}\n`;
  }
  scoresText += `\nRogue AI Negotiation: £${highScores["Rogue AI Negotiation"].toLocaleString()}\n`;
  scoresText += `\nSalary Negotiation: £${highScores["Salary Negotiation"].toLocaleString()}\n`;
  document.getElementById('high-scores-text').textContent = scoresText;
}

function resetNegotiation() {
  currentCar = null;
  currentScenario = null;
  initialPrice = 0;
  minPrice = 0;
  agreedPrice = null;
  negotiationAttempts = 0;
  salaryRole = "";
  initialSalaryOffer = 0;
  employerMax = 0;
  employerRemaining = 0;
  finalSalaryOffer = 0;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  document.getElementById('offer-input').value = '';
  document.getElementById('ai-options').innerHTML = '';
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').innerHTML = '';
  document.getElementById('salary-incentives').classList.add('hidden');
  // Reset salary offer box and show original input if needed
  document.getElementById('salary-offer-box').classList.add('hidden');
  document.getElementById('offer-input').classList.remove('hidden');
}

// Confetti Effect
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

// Input Error Message
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
  highScores["Salary Negotiation"] = 0;
  saveHighScores();
  updateHighScores();
}

// ------------------------
// Rogue AI Negotiation Functions
// ------------------------
function startAINegotiation() {
  document.getElementById('negotiation-car-image').src = "exo9.png";
  document.getElementById('seller-dialog').innerHTML = `
    🤖 EXO-9: Greetings, human negotiator. I am EXO-9, designed for efficiency. Present your strategy.
  `;
  document.getElementById('offer-input').classList.add('hidden');
  document.querySelector('.offer-buttons').classList.add('hidden');
  const aiOptions = document.getElementById('ai-options');
  aiOptions.innerHTML = '';
  aiOptions.classList.remove('hidden');
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
  let outcome, message, score;
  const rand = Math.random();
  switch(optionId) {
    case 1:
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
    case 2:
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
    case 3:
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
    case 4:
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
    case 5:
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
    case 6:
      outcome = "moderate";
      message = "EXO-9: Acknowledged. I will assume control while allowing minimal human advisory roles.";
      score = 50;
      break;
    default:
      outcome = "worst";
      message = "EXO-9: Invalid option.";
      score = 0;
  }
  document.getElementById('seller-dialog').innerHTML = message;
  document.getElementById('score-text').innerHTML = `
    Outcome: ${outcome.toUpperCase()}<br>
    Your score: ${score}
  `;
  updateHighScoreAI(score);
  saveHighScores();
  document.getElementById('ai-options').innerHTML = '';
  currentScenario = null;
  document.getElementById('car-image').src = "exo9.png";
  createConfetti();
  setTimeout(() => {
    switchScreen('congratulations');
  }, 1500);
}

// ------------------------
// Salary Negotiation Functions
// ------------------------
function beginSalaryNegotiation(role) {
  // Set initial parameters based on role
  if (role === "high") {
    initialSalaryOffer = 35000;
    employerMax = 60000;
  } else if (role === "low") {
    initialSalaryOffer = 25000;
    employerMax = 40000;
  }
  employerRemaining = employerMax - initialSalaryOffer;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  finalSalaryOffer = 0;
  
  // Hide the original offer input and show the gray salary offer box
  document.getElementById('offer-input').classList.add('hidden');
  document.getElementById('salary-offer-box').classList.remove('hidden');
  // Clear and update the placeholder for salary negotiation
  document.getElementById('salary-offer-input').value = "";
  document.getElementById('salary-offer-input').placeholder = "Enter your salary offer (£)";
  
  // Change negotiation buttons to use the salary-button style
  const btnGroup = document.querySelector('.offer-buttons');
  btnGroup.innerHTML = "";
  
  const negotiateBtn = document.createElement('button');
  negotiateBtn.id = "propose-offer";
  negotiateBtn.textContent = "Negotiate Salary";
  negotiateBtn.classList.add('salary-button');
  negotiateBtn.addEventListener('click', handleSalaryOffer);
  btnGroup.appendChild(negotiateBtn);
  
  const incentiveBtn = document.createElement('button');
  incentiveBtn.id = "request-incentive";
  incentiveBtn.textContent = "Request Incentive";
  incentiveBtn.classList.add('salary-button');
  incentiveBtn.addEventListener('click', requestIncentiveSalary);
  btnGroup.appendChild(incentiveBtn);
  
  const walkAwayBtn = document.createElement('button');
  walkAwayBtn.id = "walk-away";
  walkAwayBtn.textContent = "Walk Away";
  walkAwayBtn.classList.add('salary-button');
  walkAwayBtn.addEventListener('click', walkAwaySalary);
  btnGroup.appendChild(walkAwayBtn);
  
  const acceptBtn = document.createElement('button');
  acceptBtn.id = "accept-offer";
  acceptBtn.textContent = "Accept Offer";
  acceptBtn.classList.add('salary-button');
  acceptBtn.addEventListener('click', acceptSalaryOffer);
  btnGroup.appendChild(acceptBtn);
  
  // Set employer's introductory message and image
  document.getElementById('seller-dialog').innerHTML = `
    Employer: We propose a salary of £${initialSalaryOffer.toLocaleString()}. What are your thoughts?
  `;
  document.getElementById('negotiation-car-image').src = "employer-interview_picture.png";
}

function handleSalaryOffer() {
  const offerInput = document.getElementById('salary-offer-input');
  const offer = parseFloat(offerInput.value.replace(/,/g, ''));
  if (isNaN(offer) || offer <= 0) {
    showInputError(offerInput, 'Please enter a valid salary amount');
    return;
  }
  let rejectionChance = 0;
  let accepted = false;
  let counterOffer = 0;
  if (salaryRole === "high") {
    if (offer > employerMax) {
      document.getElementById('seller-dialog').innerHTML = `
        Employer: That exceeds our maximum budget. Offer rejected.
      `;
      finalSalaryOffer = 0;
      endSalaryNegotiation();
      return;
    }
    if (offer > 50000) { 
      rejectionChance = (offer - 50000) / (employerMax - 50000);
      if (Math.random() < rejectionChance) {
        document.getElementById('seller-dialog').innerHTML = `
          Employer: Your demand is too high. Offer rejected.
        `;
        finalSalaryOffer = 0;
        endSalaryNegotiation();
        return;
      } else {
        counterOffer = Math.floor(Math.random() * (employerMax - offer) + offer);
        document.getElementById('seller-dialog').innerHTML = `
          Employer: We counter with £${counterOffer.toLocaleString()}. You may negotiate further.
        `;
      }
    } else {
      rejectionChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
      if (Math.random() < rejectionChance) {
        counterOffer = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
        document.getElementById('seller-dialog').innerHTML = `
          Employer: Your offer of £${offer.toLocaleString()} is not acceptable. Our counteroffer is £${counterOffer.toLocaleString()}.
        `;
      } else {
        accepted = true;
      }
    }
  } else if (salaryRole === "low") {
    if (offer > employerMax) {
      document.getElementById('seller-dialog').innerHTML = `
        Employer: That exceeds our maximum budget. Offer rejected.
      `;
      finalSalaryOffer = 0;
      endSalaryNegotiation();
      return;
    }
    if (offer > 35000) {
      rejectionChance = (offer - 35000) / (employerMax - 35000);
      if (Math.random() < rejectionChance) {
        document.getElementById('seller-dialog').innerHTML = `
          Employer: Your demand is too high. Offer rejected.
        `;
        finalSalaryOffer = 0;
        endSalaryNegotiation();
        return;
      } else {
        counterOffer = Math.floor(Math.random() * (employerMax - offer) + offer);
        document.getElementById('seller-dialog').innerHTML = `
          Employer: We counter with £${counterOffer.toLocaleString()}. You may negotiate further.
        `;
      }
    } else {
      rejectionChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
      if (Math.random() < rejectionChance) {
        counterOffer = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
        document.getElementById('seller-dialog').innerHTML = `
          Employer: Your offer of £${offer.toLocaleString()} is not acceptable. Our counteroffer is £${counterOffer.toLocaleString()}.
        `;
      } else {
        accepted = true;
      }
    }
  }
  if (accepted) {
    finalSalaryOffer = offer;
    document.getElementById('seller-dialog').innerHTML = `
      Employer: Your offer of £${offer.toLocaleString()} is accepted.
    `;
  } else if (counterOffer) {
    // Update the salary offer input with the counteroffer
    offerInput.value = counterOffer;
  }
}

function requestIncentiveSalary() {
  if (incentiveRequestsCount >= maxIncentives) {
    showTemporaryMessage("You have reached the maximum number of incentive requests.");
    return;
  }
  const available = incentivesData.filter(incentive => !requestedIncentives.includes(incentive.name));
  if (available.length === 0) {
    showTemporaryMessage("No more incentives available.");
    return;
  }
  const incentivesDiv = document.getElementById('salary-incentives');
  incentivesDiv.innerHTML = "";
  incentivesDiv.classList.remove('hidden');
  available.forEach(incentive => {
    const btn = document.createElement('button');
    btn.textContent = incentive.name;
    btn.classList.add('salary-button');
    btn.addEventListener('click', () => {
      let currentOffer = finalSalaryOffer || parseFloat(document.getElementById('salary-offer-input').value) || initialSalaryOffer;
      let cost = incentive.cost;
      let fullValue = incentive.value;
      if (incentive.costPercent) {
        cost = Math.floor((incentive.costPercent / 100) * currentOffer);
      }
      if (incentive.valuePercent) {
        fullValue = Math.floor((incentive.valuePercent / 100) * currentOffer);
      }
      let randomOutcome = Math.random();
      if (randomOutcome < 0.4 && employerRemaining >= cost) {
        requestedIncentives.push(incentive.name + " (Full)");
        incentiveBonus += fullValue;
        employerRemaining -= cost;
        document.getElementById('seller-dialog').innerHTML = `
          Employer: ${incentive.name} fully approved.
        `;
        incentiveRequestsCount++;
      } else if (randomOutcome < 0.7 && employerRemaining >= Math.floor(cost / 2)) {
        requestedIncentives.push(incentive.name + " (Partial)");
        incentiveBonus += Math.floor(fullValue * 0.5);
        employerRemaining -= Math.floor(cost / 2);
        document.getElementById('seller-dialog').innerHTML = `
          Employer: ${incentive.name} partially approved.
        `;
        incentiveRequestsCount++;
      } else {
        let alternative = available.find(inv => inv.name !== incentive.name);
        if (alternative && employerRemaining >= (alternative.cost || 0)) {
          requestedIncentives.push(alternative.name + " (Alternative Offer)");
          let altValue = alternative.value;
          let altCost = alternative.cost;
          if (alternative.valuePercent) {
            altValue = Math.floor((alternative.valuePercent / 100) * currentOffer);
          }
          if (alternative.costPercent) {
            altCost = Math.floor((alternative.costPercent / 100) * currentOffer);
          }
          incentiveBonus += Math.floor(altValue * 0.75);
          employerRemaining -= altCost;
          document.getElementById('seller-dialog').innerHTML = `
            Employer: ${incentive.name} not approved, but we can offer ${alternative.name} at 75% value.
          `;
          incentiveRequestsCount++;
        } else {
          document.getElementById('seller-dialog').innerHTML = `
            Employer: We cannot accommodate the ${incentive.name} request.
          `;
        }
      }
      incentivesDiv.innerHTML = "";
      incentivesDiv.classList.add('hidden');
    });
    incentivesDiv.appendChild(btn);
  });
}

function walkAwaySalary() {
  let currentOffer = finalSalaryOffer || parseFloat(document.getElementById('salary-offer-input').value) || initialSalaryOffer;
  if (Math.random() < 0.5) {
    const newOffer = Math.floor(Math.random() * (employerMax - initialSalaryOffer) + initialSalaryOffer);
    document.getElementById('seller-dialog').innerHTML = `
      Employer: Before you leave, consider our new offer of £${newOffer.toLocaleString()}.
    `;
    document.getElementById('salary-offer-input').value = newOffer;
  } else {
    document.getElementById('seller-dialog').innerHTML = `
      Employer: No deal. Better luck next time!
    `;
    finalSalaryOffer = 0;
    endSalaryNegotiation();
  }
}

function acceptSalaryOffer() {
  if (!finalSalaryOffer) {
    finalSalaryOffer = parseFloat(document.getElementById('salary-offer-input').value) || initialSalaryOffer;
  }
  endSalaryNegotiation();
}

function endSalaryNegotiation() {
  let baseScore = Math.floor((finalSalaryOffer / initialSalaryOffer) * 100);
  let totalScore = baseScore + incentiveBonus;
  if (totalScore > highScores["Salary Negotiation"]) {
    highScores["Salary Negotiation"] = totalScore;
    document.getElementById('score-text').innerHTML = `
      Negotiation Result:<br>
      Final Salary: £${finalSalaryOffer.toLocaleString()}<br>
      Incentives: ${requestedIncentives.length > 0 ? requestedIncentives.join(", ") : "None"}<br>
      Total Score: ${totalScore}%<br>
      🏆 New High Score! 🏆
    `;
  } else {
    document.getElementById('score-text').innerHTML = `
      Negotiation Result:<br>
      Final Salary: £${finalSalaryOffer.toLocaleString()}<br>
      Incentives: ${requestedIncentives.length > 0 ? requestedIncentives.join(", ") : "None"}<br>
      Total Score: ${totalScore}%
    `;
  }
  saveHighScores();
  document.getElementById('car-image').src = "seller.jpg";
  createConfetti();
  switchScreen('congratulations');
}
