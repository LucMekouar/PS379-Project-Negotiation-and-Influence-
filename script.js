// script.js

// ----------------------------
// Global State
// ----------------------------
let currentScenario = null;
let currentCar = null;

let initialPrice = 0;
let minPrice = 0;
let negotiationAttempts = 0;
let maxAttempts = 5;

let salaryRole = "";
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

let aiState = { round: 0, demand: 100, minRequired: 60, lastDemand: 0 };

let bonusBaseScore = 0;
let bonusScenarioType = "";
let bonusFinalValue = 0;

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
// High Scores Store
// ----------------------------
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": { "new_car": 0, "old_car": 0, "antique": 0 },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": 0
};

// ----------------------------
// Cached DOM
// ----------------------------
const screens = {
  initial: document.getElementById('initial-screen'),
  scenarios: document.getElementById('scenario-selection'),
  carSelect: document.getElementById('car-selection'),
  salaryRole: document.getElementById('salary-role-selection'),
  negotiation: document.getElementById('negotiation'),
  bonus: document.getElementById('bonus-question'),
  congrats: document.getElementById('congratulations'),
  highScores: document.getElementById('high-scores')
};

const startBtn    = document.getElementById('start-button');
const scenarioBtns= document.querySelectorAll('.scenario-button');
const highBtn     = document.getElementById('high-scores-button');
const backBtns    = document.querySelectorAll('.back-button');
const carOpts     = document.querySelectorAll('.car-option');
const roleBtns    = document.querySelectorAll('.role-button');

const sellerDlg   = document.getElementById('seller-dialog');
const negImg      = document.getElementById('negotiation-car-image');
const offerIn     = document.getElementById('offer-input');

const bonusText   = document.getElementById('bonus-text');
const bonusOpts   = document.getElementById('bonus-options');
const bonusConf   = document.getElementById('bonus-confirm');

const congratsImg = document.getElementById('car-image');
const scoreEl     = document.getElementById('score-text');
const highText    = document.getElementById('high-scores-text');
const resetBtn    = document.getElementById('reset-high-scores-button');

// ----------------------------
// Helpers
// ----------------------------
function switchScreen(key) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[key].classList.remove('hidden');
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function showInputError(el, msg) {
  const orig = el.placeholder;
  el.placeholder = msg;
  el.style.borderColor = '#ff5252';
  setTimeout(() => {
    el.placeholder = orig;
    el.style.borderColor = 'var(--accent-color)';
  }, 2000);
}

function createConfetti() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'];
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

// Reset default Car/AI buttons
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
  const v = parseFloat(offerIn.value.replace(/,/g, ''));
  if (isNaN(v) || v <= 0) return showInputError(offerIn, 'Enter a valid number');
  if (currentScenario === 'buy-car') {
    negotiationAttempts++;
    handleCarOffer(v);
    offerIn.value = '';
  } else if (currentScenario === 'rogue-ai') {
    handleAIOffer(v);
    offerIn.value = '';
  } else {
    handleSalaryOffer();
  }
}

function onAcceptOffer() {
  if (currentScenario === 'salary-negotiation') return acceptSalaryOffer();
  const txt = this.textContent;
  const num = parseFloat(txt.replace(/[^0-9\.]/g, ''));
  if (!isNaN(num)) endCarOrAI(num);
}

// ----------------------------
// Navigation wiring
// ----------------------------
startBtn.addEventListener('click', () => switchScreen('scenarios'));
scenarioBtns.forEach(b => {
  b.addEventListener('click', () => {
    const scen = b.dataset.scenario;
    currentScenario = scen;
    if (scen === 'buy-car') {
      switchScreen('carSelect');
    } else if (scen === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    } else {
      switchScreen('salaryRole');
    }
  });
});
highBtn.addEventListener('click', () => {
  renderHighScores();
  switchScreen('highScores');
});
backBtns.forEach(b => {
  b.addEventListener('click', () => {
    const id = b.id;
    if (id === 'back-to-initial-from-scenarios') switchScreen('initial');
    else if (id === 'back-to-scenarios-from-high-scores') switchScreen('scenarios');
    else if (id === 'back-to-scenarios') switchScreen('scenarios');
    else if (id === 'back-to-scenarios-from-salary-role') switchScreen('scenarios');
    else if (id === 'back-to-car-selection') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetState();
    }
    else if (id === 'back-to-scenarios-from-congrats') {
      switchScreen('scenarios');
      resetState();
    }
    else if (id === 'back-to-car-selection-from-congrats') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetState();
    }
  });
});
resetBtn.addEventListener('click', showResetConfirmation);

// ----------------------------
// Car Negotiation
// ----------------------------
carOpts.forEach(o => {
  o.addEventListener('click', () => {
    startNegotiation(o.dataset.car);
    switchScreen('negotiation');
  });
});

function startNegotiation(carType) {
  resetOfferButtons();
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

  sellerDlg.innerHTML = `
    🤑 Seller: Interested in this ${carSpecs[carType].label}?<br>
    Initial Price: $${initialPrice.toLocaleString()}
  `;
  negImg.src = `${carType}.png`;
  offerIn.placeholder = "Enter your car offer (£)";

  // **Allow immediate acceptance** of the initial price:
  const acceptBtn = document.getElementById('accept-offer');
  acceptBtn.textContent = `Accept $${initialPrice.toLocaleString()}`;
}

function handleCarOffer(offer) {
  if (negotiationAttempts > maxAttempts) {
    sellerDlg.innerHTML = `
      😠 Seller: Too many low offers! Final Price: $${initialPrice.toLocaleString()}
    `;
    document.getElementById('accept-offer').textContent = `Accept $${initialPrice.toLocaleString()}`;
    return;
  }
  if (offer < minPrice * 0.9) {
    const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDlg.innerHTML = `
      😠 Seller: Insulting! My best: $${counterOffer.toLocaleString()}
    `;
    document.getElementById('accept-offer').textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDlg.innerHTML = `
      🤔 Seller: How about $${counterOffer.toLocaleString()}?
    `;
    document.getElementById('accept-offer').textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else {
    sellerDlg.innerHTML = `
      🎉 Seller: Deal at $${offer.toLocaleString()}!
    `;
    document.getElementById('accept-offer').textContent = `Accept $${offer.toLocaleString()}`;
  }
}

function endCarOrAI(finalOffer) {
  const range = initialPrice - minPrice;
  const gained = initialPrice - finalOffer;
  const pct = range > 0 ? Math.round((gained / range) * 100) : 0;

  bonusBaseScore = pct;
  bonusScenarioType = currentScenario;
  bonusFinalValue = finalOffer;
  saveHighScores();
  createConfetti();
  showBonusQuestion();
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
}

function handleAIOffer(offer) {
  if (aiState.round === 1) {
    if (offer >= aiState.demand) {
      sellerDlg.innerHTML = `🤖 Accepted ${offer} units.`;
      endCarOrAI(offer);
    } else if (offer < aiState.minRequired) {
      sellerDlg.innerHTML = `🤖 Insufficient. ≥${aiState.minRequired} required.`;
      aiState.round = 2;
    } else {
      aiState.lastDemand = Math.floor((aiState.demand + offer) / 2);
      sellerDlg.innerHTML = `🤖 I need ${aiState.lastDemand}.`;
      aiState.round = 2;
    }
  } else if (aiState.round === 2) {
    if (offer >= aiState.lastDemand) {
      sellerDlg.innerHTML = `🤖 Deal at ${offer}.`;
      endCarOrAI(offer);
    } else {
      const finalD = Math.floor((aiState.lastDemand + offer) / 2);
      sellerDlg.innerHTML = `🤖 Final demand: ${finalD}.`;
      aiState.lastDemand = finalD;
      aiState.round = 3;
    }
  } else {
    if (offer >= aiState.lastDemand) {
      sellerDlg.innerHTML = `🤖 Agreement at ${offer}.`;
      endCarOrAI(offer);
    } else {
      sellerDlg.innerHTML = `🤖 No agreement.`;
      endCarOrAI(offer);
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
  negotiationAttempts = 0;

  offerIn.placeholder = "Enter your salary offer (£)";
  const grp = document.querySelector('.offer-buttons');
  grp.innerHTML = "";

  // Negotiate button
  const negotiateBtn = document.createElement('button');
  negotiateBtn.textContent = "Negotiate Salary";
  negotiateBtn.classList.add('salary-button');
  negotiateBtn.addEventListener('click', onProposeOffer);
  grp.appendChild(negotiateBtn);

  // Request Incentive
  const incentiveBtn = document.createElement('button');
  incentiveBtn.textContent = "Request Incentive";
  incentiveBtn.classList.add('salary-button');
  incentiveBtn.addEventListener('click', requestIncentiveSalary);
  grp.appendChild(incentiveBtn);

  // Walk Away
  const walkAwayBtn = document.createElement('button');
  walkAwayBtn.textContent = "Walk Away";
  walkAwayBtn.classList.add('salary-button');
  walkAwayBtn.addEventListener('click', walkAwaySalary);
  grp.appendChild(walkAwayBtn);

  // Accept Offer
  const acceptBtn2 = document.createElement('button');
  acceptBtn2.textContent = "Accept Offer";
  acceptBtn2.classList.add('salary-button');
  acceptBtn2.addEventListener('click', acceptSalaryOffer);
  grp.appendChild(acceptBtn2);

  sellerDlg.innerHTML = `Employer: We propose £${initialSalaryOffer.toLocaleString()}. Your thoughts?`;
  negImg.src = "employer-interview_picture.png";
}

function handleSalaryOffer() {
  const offer = parseFloat(offerIn.value.replace(/,/g, '')) || 0;
  if (!offer) { showInputError(offerIn, 'Enter valid salary'); return; }

  // ... existing salary logic unchanged ...
}

function requestIncentiveSalary() {
  // ... existing incentive logic unchanged ...
}

function walkAwaySalary() {
  // ... existing walk-away logic unchanged ...
}

function acceptSalaryOffer() {
  finalSalaryOffer = parseFloat(offerIn.value.replace(/,/g, '')) || initialSalaryOffer;
  endSalaryNegotiation();
}

function endSalaryNegotiation() {
  const pct = initialSalaryOffer < employerMax
    ? Math.round(((finalSalaryOffer - initialSalaryOffer) / (employerMax - initialSalaryOffer)) * 100)
    : 0;

  bonusBaseScore = pct;
  bonusScenarioType = 'salary-negotiation';
  bonusFinalValue = finalSalaryOffer;
  saveHighScores();
  createConfetti();
  showBonusQuestion();
}

// ----------------------------
// Bonus Question Phase
// ----------------------------
function showBonusQuestion() {
  switchScreen('bonus');
  bonusOpts.innerHTML = '';
  bonusConf.classList.add('hidden');

  const q = questionPool[Math.floor(Math.random() * questionPool.length)];
  bonusText.textContent = q.q;

  q.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'option-btn';
    b.textContent = opt;
    b.addEventListener('click', () => {
      document.querySelectorAll('.option-btn').forEach(x => x.disabled = true);
      let finalScore = bonusBaseScore;
      if (i === q.correctIndex) {
        finalScore = Math.round(bonusBaseScore * 1.2);
        bonusText.textContent += `\n\n✅ Correct! ${q.correctAnswerText}\nFinal Score: ${finalScore}%`;
      } else {
        bonusText.textContent += `\n\n❌ Wrong. ${q.correctAnswerText}\nFinal Score: ${finalScore}%`;
      }

      // Update high-scores
      if (bonusScenarioType === 'buy-car') {
        if (finalScore > highScores["Buy a Car"][currentCar]) {
          highScores["Buy a Car"][currentCar] = finalScore;
        }
      } else if (bonusScenarioType === 'rogue-ai') {
        if (finalScore > highScores["Rogue AI Negotiation"]) {
          highScores["Rogue AI Negotiation"] = finalScore;
        }
      } else {
        if (finalScore > highScores["Salary Negotiation"]) {
          highScores["Salary Negotiation"] = finalScore;
        }
      }
      saveHighScores();

      scoreEl.textContent = `Your total score: ${finalScore}%`;
      if (bonusScenarioType === 'buy-car') congratsImg.src = `${currentCar}.png`;
      else if (bonusScenarioType === 'rogue-ai') congratsImg.src = "exo9.png";
      else congratsImg.src = "seller.jpg";

      bonusConf.classList.remove('hidden');
    });
    bonusOpts.appendChild(b);
  });
}
bonusConf.addEventListener('click', () => switchScreen('congrats'));

// ----------------------------
// High Scores & Reset
// ----------------------------
function renderHighScores() {
  let t = "Buy a Car:\n";
  const labels = { new_car: "New Car", old_car: "Old Car", antique: "Antique Car" };
  for (const c in highScores["Buy a Car"]) {
    t += `  ${labels[c]}: ${highScores["Buy a Car"][c]}%\n`;
  }
  t += `\nRogue AI Negotiation: ${highScores["Rogue AI Negotiation"]}%\n`;
  t += `\nSalary Negotiation: ${highScores["Salary Negotiation"]}%\n`;
  highText.textContent = t;
}

function showResetConfirmation() {
  // ... existing reset logic unchanged ...
}

// ----------------------------
// Reset Utility
// ----------------------------
function resetState() {
  currentCar = null;
  currentScenario = null;
  initialPrice = minPrice = 0;
  negotiationAttempts = 0;
  salaryRole = "";
  initialSalaryOffer = employerMax = 0;
  employerRemaining = 0;
  finalSalaryOffer = 0;
  incentiveBonus = 0;
  requestedIncentives = [];
  aiState = { round: 0, demand: 100, minRequired: 60, lastDemand: 0 };
  offerIn.value = '';
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').classList.add('hidden');
  resetOfferButtons();
}
