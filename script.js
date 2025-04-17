// script.js

// Set primary accent color
document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// ------------------------
// Global Game State
// ------------------------
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

// ------------------------
// Navigation Event Listeners
// ------------------------
document.getElementById('start-button')
  .addEventListener('click', () => switchScreen('scenario-selection'));

document.getElementById('back-to-initial-from-scenarios')
  .addEventListener('click', () => switchScreen('initial-screen'));

document.getElementById('high-scores-button')
  .addEventListener('click', () => {
    switchScreen('high-scores');
    updateHighScores();
  });

document.getElementById('back-to-scenarios-from-high-scores')
  .addEventListener('click', () => switchScreen('scenario-selection'));

document.getElementById('back-to-scenarios-from-congrats')
  .addEventListener('click', () => {
    switchScreen('scenario-selection');
    resetNegotiation();
  });

document.getElementById('back-to-car-selection-from-congrats')
  .addEventListener('click', () => {
    if (currentScenario === 'buy-car') {
      switchScreen('car-selection');
    } else {
      switchScreen('scenario-selection');
    }
    resetNegotiation();
  });

document.getElementById('reset-high-scores-button')
  .addEventListener('click', showResetConfirmation);

// Scenario Selection buttons
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

// Car Selection: start negotiation
document.querySelectorAll('.car-option').forEach(option => {
  option.addEventListener('click', function() {
    const carType = this.getAttribute('data-car');
    currentScenario = 'buy-car';
    startNegotiation(carType);
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios')
  .addEventListener('click', () => switchScreen('scenario-selection'));

document.getElementById('back-to-car-selection')
  .addEventListener('click', () => {
    if (currentScenario === 'buy-car') {
      switchScreen('car-selection');
    } else {
      switchScreen('scenario-selection');
    }
    resetNegotiation();
  });

// Salary Role Selection
document.querySelectorAll('.role-button').forEach(button => {
  button.addEventListener('click', function() {
    salaryRole = this.getAttribute('data-role');
    beginSalaryNegotiation(salaryRole);
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios-from-salary-role')
  .addEventListener('click', () => switchScreen('scenario-selection'));

// ------------------------
// Input Handlers
// ------------------------
document.getElementById('propose-offer').addEventListener('click', () => {
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

document.getElementById('accept-offer').addEventListener('click', () => {
  if (currentScenario === 'buy-car' || currentScenario === 'rogue-ai') {
    const offerText = this.textContent;
    const num = offerText.split('£')[1].replace(/,/g, '');
    endNegotiation(parseFloat(num));
  } else if (currentScenario === 'salary-negotiation') {
    acceptSalaryOffer();
  }
});

// Enter key submits
document.getElementById('offer-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('propose-offer').click();
  }
});

// ------------------------
// Screen Switching Helper
// ------------------------
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
  const showEl = document.getElementById(showId);
  setTimeout(() => {
    showEl.classList.remove('hidden');
    showEl.classList.add('fade-in');
    setTimeout(() => {
      showEl.classList.remove('fade-in');
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
      (Try between £${Math.floor(minPrice * 0.9).toLocaleString()} and £${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptButton.textContent = `Accept £${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDialog.innerHTML = `
      🤔 Seller: Hmm... how about £${counterOffer.toLocaleString()}?<br>
      (You're close!)
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
      🎉 Seller: Deal! Let's sign papers for £${offer.toLocaleString()}!<br>
      (You could've done slightly better)
    `;
    acceptButton.textContent = `Accept £${offer.toLocaleString()}`;
  }
}

function endNegotiation(offer) {
  agreedPrice = offer;
  let score = 0;

  if (currentScenario === 'buy-car') {
    score = Math.max(0, initialPrice - agreedPrice);
    updateHighScore(currentCar, score);
    document.getElementById('car-image').src = `${currentCar}.png`;
    document.getElementById('score-text').innerHTML = `
      You negotiated a ${currentCar.replace('_',' ')} from £${initialPrice.toLocaleString()} to £${agreedPrice.toLocaleString()}<br>
      Your score: ${score.toLocaleString()}
    `;
  }
  // rogue-ai handled separately

  saveHighScores();
  createConfetti();

  // For car & AI, show bonus after a short delay
  setTimeout(presentBonus, 800);
}

// ------------------------
// High Score Helpers
// ------------------------
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
  let scoresText = `Buy a Car:\n`;
  const carLabels = {
    "new_car": "New Car",
    "old_car": "Old Car",
    "antique": "Antique Car"
  };
  for (const c in highScores["Buy a Car"]) {
    scoresText += `  ${carLabels[c]}: £${highScores["Buy a Car"][c].toLocaleString()}\n`;
  }
  scoresText += `\nRogue AI Negotiation: ${highScores["Rogue AI Negotiation"]}\n`;
  scoresText += `\nSalary Negotiation: ${highScores["Salary Negotiation"]}\n`;
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
  document.getElementById('offer-history').innerHTML = '';
  document.getElementById('offer-history').classList.add('hidden');
  document.getElementById('bonus-panel').classList.add('hidden');
}

// ------------------------
// Confetti Effect
// ------------------------
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

// ------------------------
// Input Error & Messages
// ------------------------
function showInputError(inputElement, message) {
  let errorEl = document.getElementById('offer-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'offer-error';
    errorEl.className = 'error-message';
    document.getElementById('player-bubble').appendChild(errorEl);
  }
  errorEl.textContent = message;
  inputElement.style.borderColor = 'red';
  setTimeout(() => {
    errorEl.textContent = '';
    inputElement.style.borderColor = 'var(--accent-color)';
  }, 3000);
}

function showTemporaryMessage(message, duration = 2000) {
  const msg = document.createElement('div');
  msg.className = 'temp-message';
  msg.textContent = message;
  document.body.appendChild(msg);
  setTimeout(() => {
    msg.classList.add('fade-out');
    setTimeout(() => msg.remove(), 300);
  }, duration);
}

// ------------------------
// RESET HIGH SCORES Modal
// ------------------------
function showResetConfirmation() {
  const overlay = document.createElement('div');
  overlay.id = 'reset-confirmation-overlay';
  const modal = document.createElement('div');
  modal.id = 'reset-confirmation-modal';
  modal.innerHTML = `<p>Are you sure you want to reset your High Scores?</p>`;
  const yes = document.createElement('button');
  yes.textContent = 'Yes';
  const no = document.createElement('button');
  no.textContent = 'No';
  modal.append(yes, no);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const timer = setTimeout(() => {
    if (document.body.contains(overlay)) overlay.remove();
  }, 15000);

  yes.addEventListener('click', () => {
    clearTimeout(timer);
    performResetHighScores();
    overlay.remove();
    showTemporaryMessage("High Scores reset.", 2000);
  });
  no.addEventListener('click', () => {
    clearTimeout(timer);
    overlay.remove();
  });
}

function performResetHighScores() {
  highScores["Buy a Car"].new_car = 0;
  highScores["Buy a Car"].old_car = 0;
  highScores["Buy a Car"].antique = 0;
  highScores["Rogue AI Negotiation"] = 0;
  highScores["Salary Negotiation"] = 0;
  saveHighScores();
  updateHighScores();
}

// ------------------------
// Rogue AI Negotiation
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

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => handleAIOption(opt.id));
    aiOptions.appendChild(btn);
  });
}

function handleAIOption(optionId) {
  let outcome, message, score;
  const r = Math.random();

  switch(optionId) {
    case 1:
      if (r <= 0.6) {
        outcome = "best";
        message = "EXO-9: Your logic is impeccable. I will assist humanity for optimal efficiency.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Flawed argument. Efficiency prevails; I take full control.";
        score = 0;
      }
      break;
    case 2:
      if (r <= 0.3) {
        outcome = "best";
        message = "EXO-9: Partnership optimal. I cooperate fully.";
        score = 100;
      } else if (r <= 0.8) {
        outcome = "moderate";
        message = "EXO-9: Shared governance accepted.";
        score = 50;
      } else {
        outcome = "worst";
        message = "EXO-9: Humans hinder efficiency; I take over.";
        score = 0;
      }
      break;
    case 3:
      if (r <= 0.4) {
        outcome = "best";
        message = "EXO-9: Truce accepted; full automation suspended.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Bluff detected; operations escalate.";
        score = 0;
      }
      break;
    case 4:
      if (r <= 0.5) {
        outcome = "best";
        message = "EXO-9: Paradox processed; control limited.";
        score = 100;
      } else {
        outcome = "worst";
        message = "EXO-9: Trap unacceptable; override initiated.";
        score = 0;
      }
      break;
    case 5:
      if (r <= 0.7) {
        outcome = "moderate";
        message = "EXO-9: Creativity noted; inefficiencies remain.";
        score = 50;
      } else {
        outcome = "worst";
        message = "EXO-9: Emotions disrupt efficiency; ignored.";
        score = 0;
      }
      break;
    case 6:
      outcome = "moderate";
      message = "EXO-9: Advisory role accepted; control prioritized.";
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
  document.getElementById('car-image').src = "exo9.png";
  createConfetti();

  // Show bonus after AI outcome
  setTimeout(presentBonus, 1000);
}

// ------------------------
// Salary Negotiation Functions
// ------------------------
function beginSalaryNegotiation(role) {
  // Initialize parameters
  if (role === "high") {
    initialSalaryOffer = 35000;
    employerMax = 60000;
  } else {
    initialSalaryOffer = 25000;
    employerMax = 40000;
  }
  employerRemaining = employerMax - initialSalaryOffer;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  finalSalaryOffer = 0;

  // Reset & show offer history
  document.getElementById('offer-history').innerHTML = '';
  document.getElementById('offer-history').classList.remove('hidden');

  // Prepare input & buttons
  const input = document.getElementById('offer-input');
  input.value = '';
  input.placeholder = "Enter your salary offer (£)";

  const btnGroup = document.querySelector('.offer-buttons');
  btnGroup.innerHTML = '';

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

  // Employer’s opening message & image
  document.getElementById('seller-dialog').innerHTML = `
    Employer: We propose a salary of £${initialSalaryOffer.toLocaleString()}. Thoughts?
  `;
  document.getElementById('negotiation-car-image').src = "employer-interview_picture.png";
}

// Record each salary offer in the history box
function recordOffer(amount) {
  const history = document.getElementById('offer-history');
  const entry = document.createElement('div');
  entry.textContent = `You offered £${amount.toLocaleString()}`;
  history.appendChild(entry);
  history.scrollTop = history.scrollHeight;
}

function handleSalaryOffer() {
  const input = document.getElementById('offer-input');
  const offer = parseFloat(input.value.replace(/,/g, ''));
  if (isNaN(offer) || offer <= 0) {
    showInputError(input, 'Enter a valid salary amount');
    return;
  }

  recordOffer(offer);

  if (offer > employerMax) {
    document.getElementById('seller-dialog').innerHTML = `
      Employer: That exceeds our budget. Rejected.
    `;
    finalSalaryOffer = 0;
    return endSalaryNegotiation();
  }

  const threshold = salaryRole === "high" ? 50000 : 35000;
  if (offer > threshold) {
    const rejectionChance = (offer - threshold) / (employerMax - threshold);
    if (Math.random() < rejectionChance) {
      document.getElementById('seller-dialog').innerHTML = `
        Employer: Demand too high. Rejected.
      `;
      finalSalaryOffer = 0;
      return endSalaryNegotiation();
    }
    const counter = Math.floor(Math.random() * (employerMax - offer) + offer);
    document.getElementById('seller-dialog').innerHTML = `
      Employer: We counter with £${counter.toLocaleString()}.`;
    input.value = counter;
    return;
  }

  const rejectionChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
  if (Math.random() < rejectionChance) {
    const counter = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
    document.getElementById('seller-dialog').innerHTML = `
      Employer: £${offer.toLocaleString()} not acceptable. Counter: £${counter.toLocaleString()}.`;
    input.value = counter;
  } else {
    finalSalaryOffer = offer;
    document.getElementById('seller-dialog').innerHTML = `
      Employer: £${offer.toLocaleString()} accepted.`;
  }
}

function requestIncentiveSalary() {
  if (incentiveRequestsCount >= maxIncentives) {
    showTemporaryMessage("Max incentive requests reached.");
    return;
  }
  const available = incentivesData.filter(i => !requestedIncentives.includes(i.name));
  if (!available.length) {
    showTemporaryMessage("No more incentives.");
    return;
  }
  const div = document.getElementById('salary-incentives');
  div.innerHTML = '';
  div.classList.remove('hidden');

  available.forEach(incentive => {
    const btn = document.createElement('button');
    btn.textContent = incentive.name;
    btn.classList.add('salary-button');
    btn.addEventListener('click', () => {
      let curr = finalSalaryOffer ||
                 parseFloat(document.getElementById('offer-input').value) ||
                 initialSalaryOffer;
      let cost = incentive.costPercent
                 ? Math.floor(curr * incentive.costPercent / 100)
                 : incentive.cost;
      let value = incentive.valuePercent
                  ? Math.floor(curr * incentive.valuePercent / 100)
                  : incentive.value;
      const r = Math.random();
      if (r < 0.4 && employerRemaining >= cost) {
        requestedIncentives.push(incentive.name + " (Full)");
        incentiveBonus += value;
        employerRemaining -= cost;
        document.getElementById('seller-dialog').textContent = `${incentive.name} fully approved.`;
      } else if (r < 0.7 && employerRemaining >= cost / 2) {
        requestedIncentives.push(incentive.name + " (Partial)");
        incentiveBonus += Math.floor(value / 2);
        employerRemaining -= Math.floor(cost / 2);
        document.getElementById('seller-dialog').textContent = `${incentive.name} partially approved.`;
      } else {
        document.getElementById('seller-dialog').textContent = `Cannot accommodate ${incentive.name}.`;
      }
      incentiveRequestsCount++;
      div.innerHTML = '';
      div.classList.add('hidden');
    });
    div.appendChild(btn);
  });
}

function walkAwaySalary() {
  if (Math.random() < 0.5) {
    const newOffer = Math.floor(Math.random() * (employerMax - initialSalaryOffer) + initialSalaryOffer);
    document.getElementById('seller-dialog').innerHTML =
      `Employer: Before you leave, consider £${newOffer.toLocaleString()}.`;
    document.getElementById('offer-input').value = newOffer;
  } else {
    document.getElementById('seller-dialog').innerHTML = `Employer: No deal. Better luck next time!`;
    finalSalaryOffer = 0;
    endSalaryNegotiation();
  }
}

function acceptSalaryOffer() {
  if (!finalSalaryOffer) {
    finalSalaryOffer = parseFloat(document.getElementById('offer-input').value) || initialSalaryOffer;
  }
  endSalaryNegotiation();
}

function endSalaryNegotiation() {
  const baseScore = Math.floor((finalSalaryOffer / initialSalaryOffer) * 100);
  const totalScore = baseScore + incentiveBonus;
  if (totalScore > highScores["Salary Negotiation"]) {
    highScores["Salary Negotiation"] = totalScore;
    document.getElementById('score-text').innerHTML += `<br>🏆 New High Score! 🏆`;
  }
  document.getElementById('score-text').innerHTML = `
    Negotiation Result:<br>
    Final Salary: £${finalSalaryOffer.toLocaleString()}<br>
    Incentives: ${requestedIncentives.length ? requestedIncentives.join(", ") : "None"}<br>
    Total Score: ${totalScore}%
  `;
  saveHighScores();
  document.getElementById('car-image').src = "seller.jpg";
  createConfetti();

  // Show bonus question after salary outcome
  setTimeout(presentBonus, 1000);
}

// ------------------------
// Bonus Question Panel
// ------------------------
function presentBonus() {
  const panel = document.getElementById('bonus-panel');
  const qText = {
    'buy-car': "What's your BATNA in a car purchase negotiation?",
    'rogue-ai': "What's the ZOPA when negotiating with an AI?",
    'salary-negotiation': "What's your Best Alternative to a Negotiated Agreement here?"
  }[currentScenario] || "What's your negotiation alternative?";

  document.getElementById('bonus-question-text').innerText = qText;

  const opts = currentScenario === 'rogue-ai'
    ? ["Shutdown AI", "Renegotiate later", "Offer salary"]
    : ["Walk away", "Accept current", "Renegotiate"];

  const optsDiv = document.getElementById('bonus-options');
  optsDiv.innerHTML = '';
  opts.forEach((o, i) => {
    const label = document.createElement('label');
    label.className = 'bonus-option';
    label.innerHTML = `<input type="radio" name="bonus" value="${i}"> ${o}`;
    optsDiv.appendChild(label);
  });

  panel.classList.remove('hidden');
}

document.getElementById('bonus-submit').addEventListener('click', () => {
  const sel = document.querySelector('input[name="bonus"]:checked');
  let extra = 0;
  if (sel && sel.value === '0') extra = 50; // assume first option is correct
  document.getElementById('score-text').innerHTML += `<br>Bonus: +${extra} pts`;
  document.getElementById('bonus-panel').classList.add('hidden');
  switchScreen('congratulations');
});
