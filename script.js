// script.js

// ----------------------------
// Dynamic Accent Color
// ----------------------------
document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// ----------------------------
// Global Game State
// ----------------------------
let currentCar = null;
let currentScenario = null;       // 'buy-car', 'rogue-ai', 'salary-negotiation'
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
let negotiationAttempts = 0;
let maxAttempts = 5;

// Salary negotiation state
let salaryRole = "";              // "high" or "low"
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

// Rogue AI negotiation state (new offer-based flow)
let aiState = {
  round: 0,
  demand: 100,
  minRequired: 60,
  lastDemand: 0
};

// High Scores stored in localStorage
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": { "new_car": 0, "old_car": 0, "antique": 0 },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": 0
};

// ----------------------------
// Bonus Question State
// ----------------------------
let bonusBaseScore = 0;
let bonusScenarioType = "";   // 'buy-car', 'rogue-ai', 'salary-negotiation'
let bonusFinalValue = 0;

// Pool of 5 moderately challenging negotiation questions
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
// Cached DOM Elements
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

const startBtn      = document.getElementById('start-button');
const scenarioBtns  = document.querySelectorAll('.scenario-button');
const highScoresBtn = document.getElementById('high-scores-button');
const backBtns      = document.querySelectorAll('.back-button');
const carOptions    = document.querySelectorAll('.car-option');
const roleBtns      = document.querySelectorAll('.role-button');

const sellerDialog      = document.getElementById('seller-dialog');
const carImageNeg       = document.getElementById('negotiation-car-image');
const offerInput        = document.getElementById('offer-input');
const proposeBtn        = document.getElementById('propose-offer');
const acceptBtn         = document.getElementById('accept-offer');

const bonusDiv          = document.getElementById('bonus-question');
const bonusTextEl       = document.getElementById('bonus-text');
const bonusOptionsEl    = document.getElementById('bonus-options');
const bonusConfirmBtn   = document.getElementById('bonus-confirm');

const congratsImage     = document.getElementById('car-image');
const scoreTextEl       = document.getElementById('score-text');

const highScoresText    = document.getElementById('high-scores-text');
const resetHighScoresBtn= document.getElementById('reset-high-scores-button');

// ----------------------------
// Helper: Switch Visible Screen
// ----------------------------
function switchScreen(key) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[key].classList.remove('hidden');
}

// ----------------------------
// Navigation Event Listeners
// ----------------------------
startBtn.addEventListener('click', () => switchScreen('scenarios'));

scenarioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const scen = btn.getAttribute('data-scenario');
    currentScenario = scen;
    if (scen === 'buy-car') {
      switchScreen('carSelect');
    } else if (scen === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    } else if (scen === 'salary-negotiation') {
      switchScreen('salaryRole');
    }
  });
});

highScoresBtn.addEventListener('click', () => {
  updateHighScores();
  switchScreen('highScores');
});

backBtns.forEach(b => {
  b.addEventListener('click', () => {
    // Many back-buttons return to scenarios except specific ones
    const id = b.id;
    if (id === 'back-to-initial-from-scenarios') switchScreen('initial');
    else if (id === 'back-to-scenarios-from-high-scores') switchScreen('scenarios');
    else if (id === 'back-to-scenarios-from-congrats') {
      switchScreen('scenarios');
      resetNegotiation();
    }
    else if (id === 'back-to-car-selection-from-congrats') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetNegotiation();
    }
    else if (id === 'back-to-scenarios-from-salary-role') switchScreen('scenarios');
    else if (id === 'back-to-scenarios') switchScreen('scenarios');
    else if (id === 'back-to-car-selection') {
      if (currentScenario === 'buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetNegotiation();
    }
  });
});

resetHighScoresBtn.addEventListener('click', showResetConfirmation);

// ----------------------------
// Car Selection -> Start
// ----------------------------
carOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    const carType = opt.getAttribute('data-car');
    startNegotiation(carType);
    switchScreen('negotiation');
  });
});

// ----------------------------
// Salary Role Selection -> Start
// ----------------------------
roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    salaryRole = btn.getAttribute('data-role');
    beginSalaryNegotiation(salaryRole);
    switchScreen('negotiation');
  });
});

// ----------------------------
// Negotiation Event Handlers
// ----------------------------
proposeBtn.addEventListener('click', () => {
  const val = parseFloat(offerInput.value.replace(/,/g, ''));
  if (isNaN(val) || val <= 0) {
    showInputError(offerInput, 'Please enter a valid number');
    return;
  }
  if (currentScenario === 'buy-car') {
    negotiationAttempts++;
    handleOffer(val);
    offerInput.value = '';
  } else if (currentScenario === 'salary-negotiation') {
    handleSalaryOffer();
  } else if (currentScenario === 'rogue-ai') {
    handleAIOffer(val);
    offerInput.value = '';
  }
});

acceptBtn.addEventListener('click', () => {
  if (currentScenario === 'buy-car' || currentScenario === 'rogue-ai') {
    const txt = acceptBtn.textContent;
    const num = parseFloat(txt.replace(/[^0-9\.]/g, ''));
    if (!isNaN(num)) endNegotiation(num);
  } else if (currentScenario === 'salary-negotiation') {
    acceptSalaryOffer();
  }
});

// Enter key submits proposal
offerInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') proposeBtn.click();
});

// ----------------------------
// Car Negotiation Functions
// ----------------------------
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
  sellerDialog.innerHTML = `
    🤑 Seller: Interested in this ${carSpecs[carType].label}?<br>
    Initial Price: $${initialPrice.toLocaleString()}
  `;
  carImageNeg.src = `${carType}.png`;
  offerInput.placeholder = "Enter your car offer (£)";
  offerInput.classList.remove('hidden');
  document.querySelector('.offer-buttons').classList.remove('hidden');
}

function handleOffer(offer) {
  if (negotiationAttempts >= maxAttempts) {
    sellerDialog.innerHTML = `
      😠 Seller: Too many low offers! I'm ending negotiations.<br>
      Final Price: $${initialPrice.toLocaleString()}
    `;
    acceptBtn.textContent = `Accept $${initialPrice.toLocaleString()}`;
    return;
  }
  if (offer < minPrice * 0.9) {
    const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    sellerDialog.innerHTML = `
      😠 Seller: That's insulting! My best: $${counterOffer.toLocaleString()}<br>
      (Try offering between $${Math.floor(minPrice * 0.9).toLocaleString()} and $${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptBtn.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
    sellerDialog.innerHTML = `
      🤔 Seller: Hmm... how about $${counterOffer.toLocaleString()}?<br>
      (You're getting close!)
    `;
    acceptBtn.textContent = `Accept $${counterOffer.toLocaleString()}`;
  } else if (offer < minPrice * 1.1) {
    sellerDialog.innerHTML = `
      😊 Seller: That's reasonable! I accept $${offer.toLocaleString()}!<br>
      (Great negotiation!)
    `;
    acceptBtn.textContent = `Accept $${offer.toLocaleString()}`;
  } else {
    sellerDialog.innerHTML = `
      🎉 Seller: Deal! Let's sign the papers for $${offer.toLocaleString()}!<br>
      (You could have gotten a better deal)
    `;
    acceptBtn.textContent = `Accept $${offer.toLocaleString()}`;
  }
}

function endNegotiation(offer) {
  agreedPrice = offer;
  const score = Math.max(0, initialPrice - agreedPrice);
  // Save base score for bonus round
  bonusBaseScore = score;
  bonusScenarioType = 'buy-car';
  bonusFinalValue = agreedPrice;
  saveHighScores();     // Keep original storage until final bonus
  createConfetti();
  showBonusQuestion();
}

// ----------------------------
// Rogue AI Negotiation (New)
// ----------------------------
function startAINegotiation() {
  currentScenario = 'rogue-ai';
  aiState = { round: 1, demand: 100, minRequired: 60, lastDemand: 0 };
  carImageNeg.src = "exo9.png";
  sellerDialog.innerHTML = `
    🤖 EXO-9: I demand ${aiState.demand} units of computing power.<br>
    Your offer?
  `;
  offerInput.placeholder = "Enter your resource offer (units)";
  offerInput.classList.remove('hidden');
  document.querySelector('.offer-buttons').classList.remove('hidden');
}

function handleAIOffer(offer) {
  if (aiState.round === 1) {
    if (offer >= aiState.demand) {
      sellerDialog.innerHTML = `🤖 EXO-9: Agreement accepted at ${offer} units.`;
      endAINegotiation(offer);
    } else if (offer < aiState.minRequired) {
      sellerDialog.innerHTML = `🤖 EXO-9: Insufficient. I require at least ${aiState.minRequired}.`;
      aiState.round = 2;
    } else {
      aiState.lastDemand = Math.floor((aiState.demand + offer) / 2);
      sellerDialog.innerHTML = `🤖 EXO-9: Not enough. I need ${aiState.lastDemand} units.`;
      aiState.round = 2;
    }
  } else if (aiState.round === 2) {
    if (offer < aiState.minRequired) {
      sellerDialog.innerHTML = `🤖 EXO-9: Negotiation failed.`;
      endAINegotiation(offer);
    } else if (offer >= aiState.lastDemand) {
      sellerDialog.innerHTML = `🤖 EXO-9: Deal at ${offer} units.`;
      endAINegotiation(offer);
    } else {
      const finalDemand = Math.floor((aiState.lastDemand + offer) / 2);
      sellerDialog.innerHTML = `🤖 EXO-9: Final demand: ${finalDemand} units.`;
      aiState.lastDemand = finalDemand;
      aiState.round = 3;
    }
  } else {
    // round 3
    if (offer >= aiState.lastDemand) {
      sellerDialog.innerHTML = `🤖 EXO-9: Agreement reached at ${offer} units.`;
      endAINegotiation(offer);
    } else {
      sellerDialog.innerHTML = `🤖 EXO-9: No agreement.`;
      endAINegotiation(offer);
    }
  }
}

function endAINegotiation(finalUnits) {
  // Score: fewer units given = better score
  const range = aiState.demand - aiState.minRequired;
  const given = finalUnits;
  let score = 0;
  if (range > 0) score = Math.round(((aiState.demand - given) / range) * 100);
  else score = 0;
  bonusBaseScore = score;
  bonusScenarioType = 'rogue-ai';
  bonusFinalValue = finalUnits;
  saveHighScores();
  createConfetti();
  showBonusQuestion();
}

// ----------------------------
// Salary Negotiation Functions
// ----------------------------
function beginSalaryNegotiation(role) {
  currentScenario = 'salary-negotiation';
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
  incentiveRequestsCount = 0;
  finalSalaryOffer = 0;

  offerInput.value = '';
  offerInput.placeholder = "Enter your salary offer (£)";
  // Recreate buttons for salary negotiation
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

  const acceptBtn2 = document.createElement('button');
  acceptBtn2.id = "accept-offer";
  acceptBtn2.textContent = "Accept Offer";
  acceptBtn2.classList.add('salary-button');
  acceptBtn2.addEventListener('click', acceptSalaryOffer);
  btnGroup.appendChild(acceptBtn2);

  sellerDialog.innerHTML = `Employer: We propose a salary of £${initialSalaryOffer.toLocaleString()}. What are your thoughts?`;
  carImageNeg.src = "employer-interview_picture.png";
}

function handleSalaryOffer() {
  const offer = parseFloat(offerInput.value.replace(/,/g, ''));
  if (isNaN(offer) || offer <= 0) { 
    showInputError(offerInput, 'Please enter a valid salary amount');
    return;
  }
  let counterOffer = 0;
  let accepted = false;

  if (salaryRole === "high") {
    if (offer > employerMax) {
      sellerDialog.innerHTML = `Employer: That exceeds our maximum budget. Offer rejected.`;
      finalSalaryOffer = 0;
      endSalaryNegotiation();
      return;
    }
    if (offer > 50000) {
      const rejChance = (offer - 50000) / (employerMax - 50000);
      if (Math.random() < rejChance) {
        sellerDialog.innerHTML = `Employer: Your demand is too high. Offer rejected.`;
        finalSalaryOffer = 0;
        endSalaryNegotiation();
        return;
      } else {
        counterOffer = Math.floor(Math.random() * (employerMax - offer) + offer);
        sellerDialog.innerHTML = `Employer: We counter with £${counterOffer.toLocaleString()}. You may negotiate further.`;
      }
    } else {
      const rejChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
      if (Math.random() < rejChance) {
        counterOffer = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
        sellerDialog.innerHTML = `Employer: Your offer of £${offer.toLocaleString()} is not acceptable. Our counteroffer is £${counterOffer.toLocaleString()}.`;
      } else {
        accepted = true;
      }
    }
  } else { // low role
    if (offer > employerMax) {
      sellerDialog.innerHTML = `Employer: That exceeds our maximum budget. Offer rejected.`;
      finalSalaryOffer = 0;
      endSalaryNegotiation();
      return;
    }
    if (offer > 35000) {
      const rejChance = (offer - 35000) / (employerMax - 35000);
      if (Math.random() < rejChance) {
        sellerDialog.innerHTML = `Employer: Your demand is too high. Offer rejected.`;
        finalSalaryOffer = 0;
        endSalaryNegotiation();
        return;
      } else {
        counterOffer = Math.floor(Math.random() * (employerMax - offer) + offer);
        sellerDialog.innerHTML = `Employer: We counter with £${counterOffer.toLocaleString()}. You may negotiate further.`;
      }
    } else {
      const rejChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
      if (Math.random() < rejChance) {
        counterOffer = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
        sellerDialog.innerHTML = `Employer: Your offer of £${offer.toLocaleString()} is not acceptable. Our counteroffer is £${counterOffer.toLocaleString()}.`;
      } else {
        accepted = true;
      }
    }
  }

  if (accepted) {
    finalSalaryOffer = offer;
    sellerDialog.innerHTML = `Employer: Your offer of £${offer.toLocaleString()} is accepted.`;
  } else if (counterOffer) {
    offerInput.value = counterOffer;
  }
}

function requestIncentiveSalary() {
  if (incentiveRequestsCount >= maxIncentives) {
    showTemporaryMessage("You have reached the maximum number of incentive requests.");
    return;
  }
  const available = incentivesData.filter(i => !requestedIncentives.includes(i.name));
  if (available.length === 0) {
    showTemporaryMessage("No more incentives available.");
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
      let currentOffer = finalSalaryOffer || parseFloat(offerInput.value) || initialSalaryOffer;
      let cost = incentive.cost;
      let fullValue = incentive.value;
      if (incentive.costPercent) cost = Math.floor((incentive.costPercent / 100) * currentOffer);
      if (incentive.valuePercent) fullValue = Math.floor((incentive.valuePercent / 100) * currentOffer);

      const rand = Math.random();
      if (rand < 0.4 && employerRemaining >= cost) {
        requestedIncentives.push(`${incentive.name} (Full)`);
        incentiveBonus += fullValue;
        employerRemaining -= cost;
        sellerDialog.innerHTML = `Employer: ${incentive.name} fully approved.`;
        incentiveRequestsCount++;
      } else if (rand < 0.7 && employerRemaining >= Math.floor(cost / 2)) {
        requestedIncentives.push(`${incentive.name} (Partial)`);
        incentiveBonus += Math.floor(fullValue * 0.5);
        employerRemaining -= Math.floor(cost / 2);
        sellerDialog.innerHTML = `Employer: ${incentive.name} partially approved.`;
        incentiveRequestsCount++;
      } else {
        const alt = available.find(inv => inv.name !== incentive.name && employerRemaining >= (inv.cost || 0));
        if (alt) {
          requestedIncentives.push(`${alt.name} (Alternative Offer)`);
          let altValue = alt.value, altCost = alt.cost;
          if (alt.valuePercent) altValue = Math.floor((alt.valuePercent / 100) * currentOffer);
          if (alt.costPercent) altCost = Math.floor((alt.costPercent / 100) * currentOffer);
          incentiveBonus += Math.floor(altValue * 0.75);
          employerRemaining -= altCost;
          sellerDialog.innerHTML = `Employer: ${incentive.name} not approved, but we can offer ${alt.name} at 75% value.`;
          incentiveRequestsCount++;
        } else {
          sellerDialog.innerHTML = `Employer: We cannot accommodate the ${incentive.name} request.`;
        }
      }
      div.innerHTML = '';
      div.classList.add('hidden');
    });
    div.appendChild(btn);
  });
}

function walkAwaySalary() {
  if (Math.random() < 0.5) {
    const newOffer = Math.floor(Math.random() * (employerMax - initialSalaryOffer) + initialSalaryOffer);
    sellerDialog.innerHTML = `Employer: Before you leave, consider our new offer of £${newOffer.toLocaleString()}.`;
    offerInput.value = newOffer;
  } else {
    sellerDialog.innerHTML = `Employer: No deal. Better luck next time!`;
    finalSalaryOffer = 0;
    endSalaryNegotiation();
  }
}

function acceptSalaryOffer() {
  if (!finalSalaryOffer) {
    finalSalaryOffer = parseFloat(offerInput.value) || initialSalaryOffer;
  }
  endSalaryNegotiation();
}

function endSalaryNegotiation() {
  const baseScore = Math.floor((finalSalaryOffer / initialSalaryOffer) * 100);
  bonusBaseScore = baseScore + incentiveBonus;
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
  bonusOptionsEl.innerHTML = '';
  bonusConfirmBtn.classList.add('hidden');

  // Pick random question
  const q = questionPool[Math.floor(Math.random() * questionPool.length)];
  bonusTextEl.textContent = q.q;

  // Render options
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.className = 'option-btn';
    btn.addEventListener('click', () => {
      // disable all
      document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

      let finalScore = bonusBaseScore;
      if (i === q.correctIndex) {
        finalScore = Math.round(bonusBaseScore * 1.2);
        bonusTextEl.textContent += `\n\n✅ Correct! ${q.correctAnswerText}\nFinal Score: ${finalScore}`;
      } else {
        bonusTextEl.textContent += `\n\n❌ Incorrect. ${q.correctAnswerText}\nFinal Score: ${finalScore}`;
      }

      // Update high score based on finalScore
      if (bonusScenarioType === 'buy-car') {
        if (finalScore > highScores["Buy a Car"][currentCar]) {
          highScores["Buy a Car"][currentCar] = finalScore;
        }
      } else if (bonusScenarioType === 'rogue-ai') {
        if (finalScore > highScores["Rogue AI Negotiation"]) {
          highScores["Rogue AI Negotiation"] = finalScore;
        }
      } else if (bonusScenarioType === 'salary-negotiation') {
        if (finalScore > highScores["Salary Negotiation"]) {
          highScores["Salary Negotiation"] = finalScore;
        }
      }
      saveHighScores();

      // Prepare congratulations screen
      scoreTextEl.textContent = `Your total score: ${finalScore}${finalScore > 100 ? "%" : ""}`;
      if (bonusScenarioType === 'buy-car') congratsImage.src = `${currentCar}.png`;
      else if (bonusScenarioType === 'rogue-ai') congratsImage.src = "exo9.png";
      else congratsImage.src = "seller.jpg";

      bonusConfirmBtn.classList.remove('hidden');
    });
    bonusOptionsEl.appendChild(btn);
  });
}

bonusConfirmBtn.addEventListener('click', () => {
  switchScreen('congrats');
});

// ----------------------------
// High Scores & Reset
// ----------------------------
function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function updateHighScores() {
  let text = "";
  text += `Buy a Car:\n`;
  const labels = { "new_car": "New Car", "old_car": "Old Car", "antique": "Antique Car" };
  for (const c in highScores["Buy a Car"]) {
    text += `  ${labels[c]}: $${highScores["Buy a Car"][c].toLocaleString()}\n`;
  }
  text += `\nRogue AI Negotiation: $${highScores["Rogue AI Negotiation"].toLocaleString()}\n`;
  text += `\nSalary Negotiation: ${highScores["Salary Negotiation"]}%\n`;
  highScoresText.textContent = text;
}

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
  modal.appendChild(yes);
  modal.appendChild(no);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const autoRemove = setTimeout(() => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
  }, 15000);

  yes.addEventListener('click', () => {
    clearTimeout(autoRemove);
    performResetHighScores();
    document.body.removeChild(overlay);
    showTemporaryMessage("You have successfully reset your High Scores", 5000);
  });
  no.addEventListener('click', () => {
    clearTimeout(autoRemove);
    document.body.removeChild(overlay);
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

// ----------------------------
// Utilities
// ----------------------------
function createConfetti() {
  const colors = ['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeead'];
  const container = document.getElementById('congratulations');
  document.querySelectorAll('.confetti').forEach(el => el.remove());
  for (let i = 0; i < 100; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 3 + 's';
    container.appendChild(c);
  }
}

function showInputError(inputEl, message) {
  const orig = inputEl.placeholder;
  inputEl.placeholder = message;
  inputEl.style.borderColor = 'red';
  setTimeout(() => {
    inputEl.placeholder = orig;
    inputEl.style.borderColor = 'var(--accent-color)';
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
  aiState = { round: 0, demand: 100, minRequired: 60, lastDemand: 0 };
  offerInput.value = '';
  document.getElementById('ai-options').innerHTML = '';
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').innerHTML = '';
  document.getElementById('salary-incentives').classList.add('hidden');
}
