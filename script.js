// script.js

// ----------------------------
// Dynamic Accent Color
// ----------------------------
document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// ----------------------------
// Global State
// ----------------------------
let currentScenario = null;      // 'buy-car', 'rogue-ai', 'salary-negotiation'
let currentCar = null;           // 'new_car', 'old_car', 'antique'
let initialPrice = 0;
let minPrice = 0;
let negotiationAttempts = 0;
let maxAttempts = 5;

// Salary negotiation state
let salaryRole = "";             // 'high' or 'low'
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

// Rogue AI negotiation state
let aiState = { round: 0, demand: 100, minRequired: 60, lastDemand: 0 };

// Bonus question state
let bonusBaseScore = 0;
let bonusScenarioType = "";
let bonusFinalValue = 0;
let newHighScore = false;

// Pool of bonus questions
const questionPool = [
  {
    q: "What does BATNA stand for?",
    options: [
      "Best Alternative to a Negotiated Agreement",
      "Basic Agreement on Negotiation Analysis",
      "Bold Attempt to Negotiate Aggressively",
      "Business Action for Negotiation Advantage"
    ],
    correctIndex: 0,
    correctAnswerText: "BATNA = Best Alternative to a Negotiated Agreement, your fallback if talks break down."
  },
  {
    q: "In negotiation, ZOPA refers to:",
    options: [
      "Zone of Possible Agreement",
      "Zero-sum Outcome Proposal Analysis",
      "Zonal Offer & Price Assessment",
      "Zone of Optimal Profit Allocation"
    ],
    correctIndex: 0,
    correctAnswerText: "ZOPA = Zone of Possible Agreement – the overlap in acceptable deals."
  },
  {
    q: "Integrative negotiation is about:",
    options: [
      "Creating win–win solutions for all parties",
      "Winning at all costs, even if the other party loses",
      "Splitting the difference on a single issue",
      "Using intimidation tactics to gain an advantage"
    ],
    correctIndex: 0,
    correctAnswerText: "Integrative negotiation focuses on collaboration and finding joint gains."
  },
  {
    q: "One of the two golden rules of negotiation is:",
    options: [
      "Know how you value things and how the other party values things",
      "Always make the first offer",
      "Never reveal your reservation price",
      "Insist on a 50/50 split"
    ],
    correctIndex: 0,
    correctAnswerText: "The key rules are understanding both your and the other side’s priorities (and BATNAs)."
  },
  {
    q: "Your reservation price is:",
    options: [
      "The least favorable point at which you will accept a deal",
      "The price you keep reserved for yourself",
      "A temporary price held during negotiations",
      "The optimal target price you aim for"
    ],
    correctIndex: 0,
    correctAnswerText: "Reservation price = your walk-away point; beyond this, you prefer no deal."
  }
];

// ----------------------------
// High Scores (with separate salary roles)
// ----------------------------
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": { new_car: 0, old_car: 0, antique: 0 },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": { high: 0, low: 0 }
};

// ----------------------------
// Cached DOM Elements
// ----------------------------
const screens = {
  initial:     document.getElementById('initial-screen'),
  scenarios:   document.getElementById('scenario-selection'),
  carSelect:   document.getElementById('car-selection'),
  salaryRole:  document.getElementById('salary-role-selection'),
  negotiation: document.getElementById('negotiation'),
  outcome:     document.getElementById('outcome-screen'),
  bonus:       document.getElementById('bonus-question'),
  congrats:    document.getElementById('congratulations'),
  highScores:  document.getElementById('high-scores')
};

const startBtn     = document.getElementById('start-button');
const scenarioBtns = document.querySelectorAll('.scenario-button');
const highBtn      = document.getElementById('high-scores-button');
const backBtns     = document.querySelectorAll('.back-button');
const carOpts      = document.querySelectorAll('.car-option');
const roleBtns     = document.querySelectorAll('.role-button');

const sellerDlg    = document.getElementById('seller-dialog');
const negImg       = document.getElementById('negotiation-car-image');
const offerIn      = document.getElementById('offer-input');

const outcomeImg   = document.getElementById('outcome-image');
const outcomeText  = document.getElementById('outcome-text');
const toBonusBtn   = document.getElementById('to-bonus-button');

const bonusTextEl  = document.getElementById('bonus-text');
const bonusOptsEl  = document.getElementById('bonus-options');
const bonusConfBtn = document.getElementById('bonus-confirm');

const congratsImg  = document.getElementById('car-image');
const scoreTextEl  = document.getElementById('score-text');
const highScoresEl = document.getElementById('high-scores-text');
const resetBtnElem = document.getElementById('reset-high-scores-button');

// ----------------------------
// Helper Functions
// ----------------------------
function switchScreen(key) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[key].classList.remove('hidden');
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function showInputError(input, msg) {
  const orig = input.placeholder;
  input.placeholder = msg;
  input.style.borderColor = 'red';
  setTimeout(() => {
    input.placeholder = orig;
    input.style.borderColor = 'var(--accent-color)';
  }, 2000);
}

// Show popup with the correct answer
function showAnswerPopup(text, onContinue) {
  const overlay = document.createElement('div');
  overlay.id = 'answer-popup-overlay';
  const modal = document.createElement('div');
  modal.id = 'answer-popup-modal';
  modal.innerHTML = `<p>${text}</p><button id="popup-continue">Continue</button>`;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.getElementById('popup-continue').addEventListener('click', () => {
    document.body.removeChild(overlay);
    onContinue();
  });
}

function showTemporaryMessage(message, duration = 2000) {
  const msgEl = document.createElement('div');
  msgEl.className = 'temp-message';
  msgEl.textContent = message;
  document.body.appendChild(msgEl);
  setTimeout(() => {
    msgEl.classList.add('fade-out');
    setTimeout(() => msgEl.remove(), 300);
  }, duration);
}

function createConfetti() {
  const colors = ['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeead'];
  const container = document.getElementById('congratulations');
  document.querySelectorAll('.confetti').forEach(el => el.remove());
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 3 + 's';
    container.appendChild(c);
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Reset default offer buttons
function resetOfferButtons() {
  const grp = document.querySelector('.offer-buttons');
  grp.innerHTML = '';
  const p = document.createElement('button');
  p.id = 'propose-offer';
  p.textContent = 'Propose';
  p.addEventListener('click', onProposeOffer);
  grp.appendChild(p);
  const a = document.createElement('button');
  a.id = 'accept-offer';
  a.textContent = 'Accept';
  a.addEventListener('click', onAcceptOffer);
  grp.appendChild(a);
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').classList.add('hidden');
}

function onProposeOffer() {
  const val = parseFloat(offerIn.value.replace(/,/g,'')); 
  if (isNaN(val) || val <= 0) {
    showInputError(offerIn, 'Enter a valid number');
    return;
  }
  if (currentScenario === 'buy-car') {
    negotiationAttempts++;
    handleCarOffer(val);
    offerIn.value = '';
  } else if (currentScenario === 'rogue-ai') {
    handleAIOffer(val);
    offerIn.value = '';
  } else {
    handleSalaryOffer();
  }
}

function onAcceptOffer() {
  if (currentScenario === 'salary-negotiation') {
    acceptSalaryOffer();
    return;
  }
  const txt = this.textContent;
  const num = parseFloat(txt.replace(/[^0-9\.]/g,''));
  if (!isNaN(num)) {
    endNegotiation(num);
  }
}

// ----------------------------
// Navigation Wiring
// ----------------------------
startBtn.addEventListener('click', () => switchScreen('scenarios'));
scenarioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentScenario = btn.dataset.scenario;
    if (currentScenario === 'buy-car') {
      switchScreen('carSelect');
    } else if (currentScenario === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    } else {
      switchScreen('salaryRole');
    }
  });
});
highBtn.addEventListener('click', () => {
  updateHighScoresDisplay();
  switchScreen('highScores');
});
backBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.id;
    if (id === 'back-to-initial-from-scenarios')            switchScreen('initial');
    else if (id === 'back-to-scenarios-from-high-scores')  switchScreen('scenarios');
    else if (id === 'back-to-scenarios')                    switchScreen('scenarios');
    else if (id === 'back-to-scenarios-from-salary-role')   switchScreen('scenarios');
    else if (id === 'back-to-car-selection') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else                                switchScreen('scenarios');
      resetState();
    }
    else if (id === 'back-to-scenarios-from-congrats') { 
      switchScreen('scenarios'); resetState();
    }
    else if (id === 'back-to-car-selection-from-congrats') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else                                switchScreen('scenarios');
      resetState();
    }
  });
});
resetBtnElem.addEventListener('click', showResetConfirmation);

// ----------------------------
// Car Negotiation
// ----------------------------
carOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    startCarNegotiation(opt.dataset.car);
    switchScreen('negotiation');
  });
});

function startCarNegotiation(carType) {
  // ensure scenario stays in 'buy-car'
  currentScenario = 'buy-car';

  resetOfferButtons();
  currentCar = carType;
  negotiationAttempts = 0;
  maxAttempts = Math.floor(Math.random() * 5) + 1;
  const specs = {
    new_car: { label: "New Car", price: 50000 },
    old_car: { label: "Old Car", price: 10000 },
    antique: { label: "Antique Car", price: 13000 }
  };
  initialPrice = specs[carType].price;
  minPrice = initialPrice * (0.75 + Math.random() * 0.1);
  sellerDlg.innerHTML = `
    🤑 Seller: Interested in this ${specs[carType].label}?<br>
    Initial Price: $${initialPrice.toLocaleString()}
  `;
  negImg.src = `${carType}.png`;
  offerIn.placeholder = "Enter your car offer (£)";
  document.getElementById('accept-offer').textContent =
    `Accept $${initialPrice.toLocaleString()}`;
}

function handleCarOffer(offer) {
  if (negotiationAttempts > maxAttempts) {
    sellerDlg.innerHTML = `
      😠 Seller: Too many low offers! Final Price: $${initialPrice.toLocaleString()}
    `;
    document.getElementById('accept-offer').textContent =
      `Accept $${initialPrice.toLocaleString()}`;
    return;
  }
  if (offer < minPrice * 0.9) {
    const co = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDlg.innerHTML = `😠 Seller: Insulting! My best: $${co.toLocaleString()}`;
    document.getElementById('accept-offer').textContent =
      `Accept $${co.toLocaleString()}`;
  } else if (offer < minPrice) {
    const co = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDlg.innerHTML = `🤔 Seller: How about $${co.toLocaleString()}?`;
    document.getElementById('accept-offer').textContent =
      `Accept $${co.toLocaleString()}`;
  } else {
    sellerDlg.innerHTML = `🎉 Seller: Deal at $${offer.toLocaleString()}!`;
    document.getElementById('accept-offer').textContent =
      `Accept $${offer.toLocaleString()}`;
  }
}

// ----------------------------
// Modified endNegotiation to handle rogue-ai scores correctly
// ----------------------------
function endNegotiation(finalValue) {
  if (currentScenario === 'rogue-ai') {
    // Score based on how far below initial demand you got (minRequired to demand)
    bonusBaseScore = Math.round(
      (aiState.demand - finalValue) /
      (aiState.demand - aiState.minRequired) * 100
    );
  } else {
    // Car negotiation score
    const range = initialPrice - minPrice;
    bonusBaseScore = range > 0
      ? Math.round((initialPrice - finalValue) / range * 100)
      : 0;
  }
  bonusScenarioType = currentScenario;
  bonusFinalValue = finalValue;
  renderOutcomeScreen(finalValue);
}

// ----------------------------
// Rogue AI Negotiation
// ----------------------------
function startAINegotiation() {
  resetOfferButtons();
  aiState = { round: 1, demand: 100, minRequired: 60, lastDemand: 0 };
  sellerDlg.innerHTML = `🤖 EXO-9: I demand ${aiState.demand} units. Your offer?`;
  negImg.src = "exo9.png";
  offerIn.placeholder = "Enter your resource offer (units)";
  document.getElementById('accept-offer').textContent =
    `Accept ${aiState.demand} units`;
}

function handleAIOffer(offer) {
  const acceptBtn = document.getElementById('accept-offer');
  if (aiState.round === 1) {
    if (offer >= aiState.demand) {
      sellerDlg.innerHTML = `🤖 EXO-9: Agreement at ${offer} units.`;
      endNegotiation(offer);
      return;
    } else if (offer < aiState.minRequired) {
      sellerDlg.innerHTML = `🤖 EXO-9: Insufficient. ≥${aiState.minRequired} required.`;
      aiState.round = 2;
      acceptBtn.textContent = `Accept ${aiState.minRequired} units`;
    } else {
      aiState.lastDemand = Math.floor((aiState.demand + offer) / 2);
      sellerDlg.innerHTML = `🤖 EXO-9: I need ${aiState.lastDemand} units.`;
      aiState.round = 2;
      acceptBtn.textContent = `Accept ${aiState.lastDemand} units`;
    }
  } else if (aiState.round === 2) {
    if (offer >= aiState.lastDemand) {
      sellerDlg.innerHTML = `🤖 EXO-9: Deal at ${offer} units.`;
      endNegotiation(offer);
      return;
    } else {
      const next = Math.floor((aiState.lastDemand + offer) / 2);
      sellerDlg.innerHTML = `🤖 EXO-9: Final demand: ${next} units.`;
      aiState.lastDemand = next;
      aiState.round = 3;
      acceptBtn.textContent = `Accept ${next} units`;
    }
  } else {
    if (offer >= aiState.lastDemand) {
      sellerDlg.innerHTML = `🤖 EXO-9: Agreement at ${offer} units.`;
      endNegotiation(offer);
    } else {
      sellerDlg.innerHTML = `🤖 EXO-9: No agreement.`;
      endNegotiation(offer);
    }
  }
}

// ----------------------------
// Salary Negotiation
// ----------------------------
roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchScreen('negotiation');
    beginSalaryNegotiation(btn.dataset.role);
  });
});

function beginSalaryNegotiation(role) {
  salaryRole = role;
  if (role === 'high') {
    initialSalaryOffer = 35000; employerMax = 60000;
  } else {
    initialSalaryOffer = 25000; employerMax = 40000;
  }
  employerRemaining = employerMax - initialSalaryOffer;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;

  offerIn.placeholder = "Enter your salary offer (£)";
  const grp = document.querySelector('.offer-buttons');
  grp.innerHTML = '';
  ['Negotiate Salary','Request Incentive','Walk Away','Accept Offer'].forEach((txt,i)=>{
    const b = document.createElement('button');
    b.textContent = txt;
    b.classList.add('salary-button');
    if (i===0) b.addEventListener('click', onProposeOffer);
    if (i===1) b.addEventListener('click', requestIncentiveSalary);
    if (i===2) b.addEventListener('click', walkAwaySalary);
    if (i===3) b.addEventListener('click', onAcceptOffer);
    grp.appendChild(b);
  });
  sellerDlg.innerHTML = `Employer: We propose £${initialSalaryOffer.toLocaleString()}. Your thoughts?`;
  negImg.src = "employer-interview_picture.png";
}

function handleSalaryOffer() {
  const offer = parseFloat(offerIn.value.replace(/,/g,'')) || 0;
  if (!offer) {
    showInputError(offerIn,'Please enter a valid salary amount');
    return;
  }
  let counterOffer = 0, accepted = false;
  if (salaryRole === 'high') {
    if (offer > employerMax) {
      sellerDlg.innerHTML = `Employer: That exceeds our maximum budget. Offer rejected.`; 
      finalSalaryOffer = 0; endSalaryNegotiation(); return;
    }
    if (offer > 50000) {
      const rej = (offer - 50000)/(employerMax - 50000);
      if (Math.random() < rej) {
        sellerDlg.innerHTML = `Employer: Your demand is too high. Offer rejected.`; 
        finalSalaryOffer = 0; endSalaryNegotiation(); return;
      } else {
        counterOffer = Math.floor(Math.random()*(employerMax - offer)+offer);
        sellerDlg.innerHTML = `Employer: Counter with £${counterOffer.toLocaleString()}.`;
      }
    } else {
      const rej = (offer - initialSalaryOffer)/(employerMax-initialSalaryOffer);
      if (Math.random() < rej) {
        counterOffer = Math.floor(Math.random()*(offer - initialSalaryOffer)+initialSalaryOffer);
        sellerDlg.innerHTML = `Employer: Counter with £${counterOffer.toLocaleString()}.`;
      } else accepted = true;
    }
  } else {
    if (offer > employerMax) {
      sellerDlg.innerHTML = `Employer: That exceeds our maximum budget. Offer rejected.`; 
      finalSalaryOffer = 0; endSalaryNegotiation(); return;
    }
    if (offer > 35000) {
      const rej = (offer - 35000)/(employerMax-35000);
      if (Math.random() < rej) {
        sellerDlg.innerHTML = `Employer: Too high. Offer rejected.`; 
        finalSalaryOffer = 0; endSalaryNegotiation(); return;
      } else {
        counterOffer = Math.floor(Math.random()*(employerMax - offer)+offer);
        sellerDlg.innerHTML = `Employer: Counter with £${counterOffer.toLocaleString()}.`;
      }
    } else {
      const rej = (offer - initialSalaryOffer)/(employerMax-initialSalaryOffer);
      if (Math.random() < rej) {
        counterOffer = Math.floor(Math.random()*(offer - initialSalaryOffer)+initialSalaryOffer);
        sellerDlg.innerHTML = `Employer: Counter with £${counterOffer.toLocaleString()}.`;
      } else accepted = true;
    }
  }
  if (accepted) {
    finalSalaryOffer = offer;
    sellerDlg.innerHTML = `Employer: Accepted £${offer.toLocaleString()}.`;
  } else offerIn.value = counterOffer;
}

function requestIncentiveSalary() {
  if (incentiveRequestsCount >= maxIncentives) {
    showTemporaryMessage("Max incentive requests reached."); return;
  }
  const available = incentivesData.filter(i => !requestedIncentives.includes(i.name));
  if (!available.length) {
    showTemporaryMessage("No more incentives available."); return;
  }
  const div = document.getElementById('salary-incentives');
  div.innerHTML = '';
  div.classList.remove('hidden');
  available.forEach(incentive => {
    const btn = document.createElement('button');
    btn.textContent = incentive.name;
    btn.classList.add('salary-button');
    btn.addEventListener('click', () => {
      let curr = finalSalaryOffer || parseFloat(offerIn.value)||initialSalaryOffer;
      let cost = incentive.cost, value = incentive.value;
      if (incentive.costPercent)  cost = Math.floor((incentive.costPercent/100)*curr);
      if (incentive.valuePercent) value = Math.floor((incentive.valuePercent/100)*curr);
      const rand = Math.random();
      if (rand < 0.4 && employerRemaining >= cost) {
        requestedIncentives.push(`${incentive.name} (Full)`);
        incentiveBonus += value; employerRemaining -= cost;
        sellerDlg.innerHTML = `Employer: ${incentive.name} approved full.`;
      } else if (rand < 0.7 && employerRemaining >= cost/2) {
        requestedIncentives.push(`${incentive.name} (Partial)`);
        incentiveBonus += Math.floor(value*0.5); employerRemaining -= Math.floor(cost/2);
        sellerDlg.innerHTML = `Employer: ${incentive.name} approved partial.`;
      } else {
        sellerDlg.innerHTML = `Employer: ${incentive.name} cannot be accommodated.`;
      }
      div.innerHTML = ''; div.classList.add('hidden');
      incentiveRequestsCount++;
    });
    div.appendChild(btn);
  });
}

function walkAwaySalary() {
  if (Math.random() < 0.5) {
    const newO = Math.floor(Math.random()*(employerMax-initialSalaryOffer)+initialSalaryOffer);
    sellerDlg.innerHTML = `Employer: Before you go, consider £${newO.toLocaleString()}.`;
    offerIn.value = newO;
  } else {
    sellerDlg.innerHTML = `Employer: No deal.`;
    finalSalaryOffer = 0; endSalaryNegotiation();
  }
}

function acceptSalaryOffer() {
  finalSalaryOffer = parseFloat(offerIn.value.replace(/,/g,'')) || initialSalaryOffer;
  endSalaryNegotiation();
}

function endSalaryNegotiation() {
  const range = employerMax - initialSalaryOffer;
  const gain  = finalSalaryOffer - initialSalaryOffer;
  bonusBaseScore  = range > 0 ? Math.round((gain / range) * 100) : 0;
  bonusScenarioType = currentScenario;
  bonusFinalValue   = finalSalaryOffer;
  renderOutcomeScreen(finalSalaryOffer);
}

// ----------------------------
// Outcome Screen
// ----------------------------
function renderOutcomeScreen(finalValue) {
  switchScreen('outcome');
  if (bonusScenarioType === 'buy-car') {
    outcomeImg.src = `${currentCar}.png`;
    outcomeText.innerHTML = `
      Agreement reached! You purchased a ${currentCar.replace('_',' ')} for 
      $${finalValue.toLocaleString()}.`;
  }
  else if (bonusScenarioType === 'rogue-ai') {
    outcomeImg.src = 'exo9.png';
    outcomeText.textContent = "Thank you, Judgement day is coming...";
  }
  else {
    outcomeImg.src = 'employer-interview_picture.png';
    outcomeText.innerHTML = `
      Agreement reached! You secured a salary of £${finalValue.toLocaleString()} 
      as a ${salaryRole === 'high' ? 'better-than-average' : 'average'} employee.`;
  }
}

// ---- Proceed to Bonus Button Listener ----
toBonusBtn.addEventListener('click', showBonusQuestion);

// ----------------------------
// Bonus Question Phase
// ----------------------------
function showBonusQuestion() {
  switchScreen('bonus');
  bonusOptsEl.innerHTML = '';
  bonusConfBtn.classList.add('hidden');
  newHighScore = false;

  const q = questionPool[Math.floor(Math.random() * questionPool.length)];
  bonusTextEl.textContent = q.q;

  const opts = q.options.map((text, idx) => ({ text, idx }));
  shuffleArray(opts);

  opts.forEach(({ text, idx }) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.option-btn').forEach(x => x.disabled = true);
      let finalScore = bonusBaseScore;
      if (idx === q.correctIndex) {
        finalScore = Math.round(bonusBaseScore * 1.2);
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
      }

      // Update high scores
      if (bonusScenarioType === 'buy-car') {
        if (finalScore > highScores["Buy a Car"][currentCar]) {
          highScores["Buy a Car"][currentCar] = finalScore;
          newHighScore = true;
        }
      } else if (bonusScenarioType === 'rogue-ai') {
        if (finalScore > highScores["Rogue AI Negotiation"]) {
          highScores["Rogue AI Negotiation"] = finalScore;
          newHighScore = true;
        }
      } else {
        if (finalScore > highScores["Salary Negotiation"][salaryRole]) {
          highScores["Salary Negotiation"][salaryRole] = finalScore;
          newHighScore = true;
        }
      }
      saveHighScores();

      // Prepare final scores display
      let branchHigh;
      if (bonusScenarioType === 'buy-car') {
        branchHigh = highScores["Buy a Car"][currentCar];
      } else if (bonusScenarioType === 'rogue-ai') {
        branchHigh = highScores["Rogue AI Negotiation"];
      } else {
        branchHigh = highScores["Salary Negotiation"][salaryRole];
      }

      // Show both base and bonus, bonus in bold
      scoreTextEl.innerHTML = 
        `Base Score: ${bonusBaseScore}%<br>` +
        `<strong>Bonus Score: ${finalScore}%</strong><br>` +
        `High Score: ${branchHigh}%`;

      // Set congrats image per scenario
      congratsImg.src = bonusScenarioType === 'rogue-ai'
        ? 'exo9.png'
        : (bonusScenarioType === 'buy-car'
           ? `${currentCar}.png`
           : 'employer-interview_picture.png');

      // Show correct-answer popup then final screen
      showAnswerPopup(q.correctAnswerText, () => {
        if (newHighScore) createConfetti();
        switchScreen('congrats');
      });
    });
    bonusOptsEl.appendChild(btn);
  });
}

// ----------------------------
// High Scores Display & Reset
// ----------------------------
function updateHighScoresDisplay() {
  let txt = `Buy a Car:\n`;
  const labels={ new_car:"New Car", old_car:"Old Car", antique:"Antique Car" };
  for (const c in highScores["Buy a Car"]) {
    txt += `  ${labels[c]}: ${highScores["Buy a Car"][c]}%\n`;
  }
  txt += `\nRogue AI Negotiation: ${highScores["Rogue AI Negotiation"]}%\n`;
  txt += `\nSalary Negotiation:\n  Better-than-average employee: ${highScores["Salary Negotiation"].high}%\n`;
  txt += `  Average employee: ${highScores["Salary Negotiation"].low}%\n`;
  highScoresEl.textContent = txt;
}

function showResetConfirmation() {
  const overlay = document.createElement('div');
  overlay.id = 'reset-confirmation-overlay';
  const modal = document.createElement('div');
  modal.id = 'reset-confirmation-modal';
  modal.innerHTML = `<p>Reset all High Scores?</p>`;
  const yes = document.createElement('button');
  yes.textContent = 'Yes';
  const no  = document.createElement('button');
  no.textContent  = 'No';
  modal.appendChild(yes);
  modal.appendChild(no);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const tm = setTimeout(()=>{
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
  }, 15000);

  yes.addEventListener('click', ()=>{
    clearTimeout(tm);
    ["new_car","old_car","antique"].forEach(k=>highScores["Buy a Car"][k]=0);
    highScores["Rogue AI Negotiation"]=0;
    highScores["Salary Negotiation"].high = 0;
    highScores["Salary Negotiation"].low  = 0;
    saveHighScores();
    updateHighScoresDisplay();
    document.body.removeChild(overlay);
  });

  no.addEventListener('click', ()=>{
    clearTimeout(tm);
    document.body.removeChild(overlay);
  });
}

// ----------------------------
// Reset Utility
// ----------------------------
function resetState() {
  currentScenario = null;
  currentCar      = null;
  initialPrice    = 0;
  minPrice        = 0;
  negotiationAttempts = 0;

  salaryRole            = "";
  initialSalaryOffer    = 0;
  employerMax           = 0;
  employerRemaining     = 0;
  finalSalaryOffer      = 0;
  incentiveBonus        = 0;
  requestedIncentives   = [];
  incentiveRequestsCount= 0;

  aiState = { round:0, demand:100, minRequired:60, lastDemand:0 };

  offerIn.value = "";
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').classList.add('hidden');
  resetOfferButtons();
}
