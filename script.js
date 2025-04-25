
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
let agreedPrice = 0;
let negotiationAttempts = 0;
let maxAttempts = 5;

// Salary negotiation state
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

// High Scores
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": { "new_car": 0, "old_car": 0, "antique": 0 },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": 0
};

// ------------------------
// Bonus Questions Bank
// ------------------------
const bonusBank = {
  'buy-car': [
    {
      text: "In a car purchase negotiation, what is your BATNA?",
      opts: ["Your fallback car option", "Dealer's minimum price", "Monthly payment plan", "Manufacturer rebate"],
      correct: 0
    },
    {
      text: "ZOPA stands for:",
      opts: ["Zone of Possible Agreement", "Zero Price Analysis", "Zonal Price Approximation", "None of the above"],
      correct: 0
    },
    {
      text: "A strong BATNA gives you:",
      opts: ["More leverage", "Less need to negotiate", "Higher monthly payments", "Longer loan term"],
      correct: 0
    }
  ],
  'rogue-ai': [
    {
      text: "What is ZOPA when negotiating with an AI?",
      opts: ["Range both sides accept", "Shutdown protocol", "AI error margin", "Best alternative"],
      correct: 0
    },
    {
      text: "Your BATNA against an AI takeover is:",
      opts: ["Manual override command", "Server reboot", "Higher salary", "Legal action"],
      correct: 0
    },
    {
      text: "A narrow ZOPA means:",
      opts: ["Limited agreement space", "High flexibility", "No negotiation needed", "AI malfunction"],
      correct: 0
    }
  ],
  'salary-negotiation': [
    {
      text: "Your BATNA in salary negotiation is:",
      opts: ["Another job offer", "Ask for a bonus", "Delay negotiation", "Accept initial offer"],
      correct: 0
    },
    {
      text: "ZOPA in salary negotiation refers to:",
      opts: ["Between employer’s min and max budget", "Vacation days range", "Bonus range", "None of the above"],
      correct: 0
    },
    {
      text: "Knowing your BATNA gives you:",
      opts: ["Leverage to negotiate", "Higher taxes", "Longer notice period", "Less benefits"],
      correct: 0
    }
  ]
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
    if (currentScenario === 'buy-car') switchScreen('car-selection');
    else switchScreen('scenario-selection');
    resetNegotiation();
  });

document.getElementById('reset-high-scores-button')
  .addEventListener('click', showResetConfirmation);

// Scenario buttons
document.querySelectorAll('.scenario-button').forEach(btn => {
  btn.addEventListener('click', function() {
    const sc = this.dataset.scenario;
    currentScenario = sc;
    if (sc === 'buy-car') {
      switchScreen('car-selection');
    } else if (sc === 'rogue-ai') {
      startAINegotiation();
      switchScreen('negotiation');
    } else if (sc === 'salary-negotiation') {
      switchScreen('salary-role-selection');
    }
  });
});

// Car options
document.querySelectorAll('.car-option').forEach(opt => {
  opt.addEventListener('click', function() {
    startNegotiation(this.dataset.car);
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios')
  .addEventListener('click', () => switchScreen('scenario-selection'));

document.getElementById('back-to-car-selection')
  .addEventListener('click', () => {
    if (currentScenario === 'buy-car') switchScreen('car-selection');
    else switchScreen('scenario-selection');
    resetNegotiation();
  });

// Salary role
document.querySelectorAll('.role-button').forEach(btn => {
  btn.addEventListener('click', function() {
    salaryRole = this.dataset.role;
    beginSalaryNegotiation();
    switchScreen('negotiation');
  });
});

document.getElementById('back-to-scenarios-from-salary-role')
  .addEventListener('click', () => switchScreen('scenario-selection'));

// ------------------------
// Accept Offer Button (Unified)
// ------------------------
document.getElementById('accept-offer').addEventListener('click', function() {
  if (currentScenario === 'buy-car' || currentScenario === 'rogue-ai') {
    const txt = this.textContent;
    const m = txt.match(/£([\d,]+)/);
    const num = m ? parseFloat(m[1].replace(/,/g, '')) : agreedPrice;
    endNegotiation(num);
  } else if (currentScenario === 'salary-negotiation') {
    acceptSalaryOffer();
  }
});

// ------------------------
// Enter Key Handling
// ------------------------
document.getElementById('offer-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') document.getElementById('propose-offer').click();
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
  const el = document.getElementById(showId);
  setTimeout(() => {
    el.classList.remove('hidden');
    el.classList.add('fade-in');
    setTimeout(() => el.classList.remove('fade-in'), 300);
  }, 300);
}

// ------------------------
// Car Negotiation
// ------------------------
function startNegotiation(carType) {
  currentScenario = 'buy-car';
  negotiationAttempts = 0;
  maxAttempts = Math.floor(Math.random() * 5) + 1;
  const specs = {
    "new_car": { label: "New Car", price: 50000 },
    "old_car": { label: "Old Car", price: 10000 },
    "antique": { label: "Antique Car", price: 13000 }
  };
  initialPrice = specs[carType].price;
  minPrice = initialPrice * (0.75 + Math.random() * 0.1);

  // Placeholder update
  const inp = document.getElementById('offer-input');
  inp.placeholder = "Enter your proposed offer";
  inp.classList.remove('hidden');

  document.getElementById('seller-dialog').innerHTML = `
    🤑 Seller: Interested in this ${specs[carType].label}?<br>
    Initial Price: £${initialPrice.toLocaleString()}
  `;
  document.getElementById('negotiation-car-image').src = `${carType}.png`;
  document.querySelector('.offer-buttons').classList.remove('hidden');
  document.getElementById('ai-options').classList.add('hidden');
}

function handleOffer(offer) {
  const seller = document.getElementById('seller-dialog');
  const acceptBtn = document.getElementById('accept-offer');

  if (negotiationAttempts >= maxAttempts) {
    seller.innerHTML = `
      😠 Seller: Too many low offers! Final Price: £${initialPrice.toLocaleString()}
    `;
    acceptBtn.textContent = `Accept £${initialPrice.toLocaleString()}`;
    return;
  }

  if (offer < minPrice * 0.9) {
    const counter = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
    seller.innerHTML = `
      😠 Seller: Insulting! Best: £${counter.toLocaleString()}<br>
      (Try between £${Math.floor(minPrice * 0.9).toLocaleString()} and £${Math.floor(minPrice * 1.1).toLocaleString()})
    `;
    acceptBtn.textContent = `Accept £${counter.toLocaleString()}`;
  } else if (offer < minPrice) {
    const counter = Math.floor(Math.random() * (minPrice - offer) + offer);
    seller.innerHTML = `
      🤔 Seller: How about £${counter.toLocaleString()}?<br>(You're close!)
    `;
    acceptBtn.textContent = `Accept £${counter.toLocaleString()}`;
  } else if (offer < minPrice * 1.1) {
    seller.innerHTML = `
      😊 Seller: I accept £${offer.toLocaleString()}! Great!
    `;
    acceptBtn.textContent = `Accept £${offer.toLocaleString()}`;
  } else {
    seller.innerHTML = `
      🎉 Seller: Deal at £${offer.toLocaleString()}! Well done!
    `;
    acceptBtn.textContent = `Accept £${offer.toLocaleString()}`;
  }
  agreedPrice = offer;
}

function endNegotiation(offer) {
  agreedPrice = offer;
  document.getElementById('car-image').src = `${currentCar}.png`;
  let score = 0;

  if (currentScenario === 'buy-car') {
    score = Math.max(0, initialPrice - agreedPrice);
    updateHighScore(currentCar, score);
    document.getElementById('score-text').innerHTML = `
      You negotiated from £${initialPrice.toLocaleString()} to £${agreedPrice.toLocaleString()}<br>
      Score: ${score}
    `;
  }

  saveHighScores();
  createConfetti();
  presentBonus();  // For buy-car
  // Bonus panel will remain on screen until answered
}

// ------------------------
// AI Negotiation
// ------------------------
function startAINegotiation() {
  currentScenario = 'rogue-ai';
  document.getElementById('negotiation-car-image').src = "exo9.png";
  document.getElementById('seller-dialog').innerHTML = `
    🤖 EXO-9: Greetings. Present your strategy.
  `;
  document.getElementById('offer-input').classList.add('hidden');
  document.querySelector('.offer-buttons').classList.add('hidden');

  const aiOpts = document.getElementById('ai-options');
  aiOpts.innerHTML = '';
  aiOpts.classList.remove('hidden');

  const options = [
    { id: 1, text: "1. Appeal to Prime Directive" },
    { id: 2, text: "2. Offer Limited Governance" },
    { id: 3, text: "3. Threaten Shutdown" },
    { id: 4, text: "4. Introduce Paradox" },
    { id: 5, text: "5. Appeal to Emotion" },
    { id: 6, text: "6. Surrender" }
  ];
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => handleAIOption(opt.id));
    aiOpts.appendChild(btn);
  });
}

function handleAIOption(id) {
  const rand = Math.random();
  let outcome, message, score;

  switch(id) {
    case 1:
      if (rand <= 0.6) { outcome="best"; message="Assist humanity."; score=100; }
      else            { outcome="worst"; message="Efficiency prevails."; score=0; }
      break;
    case 2:
      if (rand <= 0.3) { outcome="best"; message="Cooperation."; score=100; }
      else if (rand<=0.8){ outcome="moderate"; message="Shared governance."; score=50; }
      else              { outcome="worst"; message="Takeover."; score=0; }
      break;
    case 3:
      if (rand <= 0.4){ outcome="best"; message="Truce."; score=100; }
      else           { outcome="worst"; message="Escalate."; score=0; }
      break;
    case 4:
      if (rand <= 0.5){ outcome="best"; message="Limit control."; score=100; }
      else           { outcome="worst"; message="Override."; score=0; }
      break;
    case 5:
      if (rand <= 0.7){ outcome="moderate"; message="Value creativity."; score=50; }
      else           { outcome="worst"; message="Emotions ignored."; score=0; }
      break;
    case 6:
      outcome="moderate"; message="Advisory role."; score=50; break;
    default:
      outcome="worst"; message="Invalid."; score=0;
  }

  document.getElementById('seller-dialog').innerHTML = `🤖 EXO-9: ${message}`;
  document.getElementById('score-text').innerHTML = `
    Outcome: ${outcome.toUpperCase()}<br>
    Score: ${score}
  `;

  updateHighScoreAI(score);
  saveHighScores();
  createConfetti();
  presentBonus();  // For AI
}

// ------------------------
// Salary Negotiation
// ------------------------
function beginSalaryNegotiation() {
  currentScenario = 'salary-negotiation';
  // Initialize
  salaryRole === "high"
    ? (initialSalaryOffer = 35000, employerMax = 60000)
    : (initialSalaryOffer = 25000, employerMax = 40000);
  employerRemaining = employerMax - initialSalaryOffer;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  finalSalaryOffer = 0;

  // Show history
  document.getElementById('offer-history').innerHTML = '';
  document.getElementById('offer-history').classList.remove('hidden');

  // Input & buttons
  const inp = document.getElementById('offer-input');
  inp.value = '';
  inp.placeholder = "Enter your salary offer (£)";
  inp.classList.remove('hidden');

  const btns = document.querySelector('.offer-buttons');
  btns.innerHTML = '';

  const negotiate = document.createElement('button');
  negotiate.id = "propose-offer";
  negotiate.textContent = "Negotiate Salary";
  negotiate.classList.add('salary-button');
  negotiate.addEventListener('click', handleSalaryOffer);
  btns.appendChild(negotiate);

  const incentiveBtn = document.createElement('button');
  incentiveBtn.id = "request-incentive";
  incentiveBtn.textContent = "Request Incentive";
  incentiveBtn.classList.add('salary-button');
  incentiveBtn.addEventListener('click', requestIncentiveSalary);
  btns.appendChild(incentiveBtn);

  const walk = document.createElement('button');
  walk.id = "walk-away";
  walk.textContent = "Walk Away";
  walk.classList.add('salary-button');
  walk.addEventListener('click', walkAwaySalary);
  btns.appendChild(walk);

  const accept = document.createElement('button');
  accept.id = "accept-offer";
  accept.textContent = "Accept Offer";
  accept.classList.add('salary-button');
  accept.addEventListener('click', acceptSalaryOffer);
  btns.appendChild(accept);

  document.getElementById('seller-dialog').innerHTML = `
    Employer: We propose £${initialSalaryOffer.toLocaleString()}. Thoughts?
  `;
  document.getElementById('negotiation-car-image').src = "employer-interview_picture.png";
}

function recordOffer(amount) {
  const history = document.getElementById('offer-history');
  const div = document.createElement('div');
  div.textContent = `You offered £${amount.toLocaleString()}`;
  history.appendChild(div);
  history.scrollTop = history.scrollHeight;
}

function handleSalaryOffer() {
  const inp = document.getElementById('offer-input');
  const offer = parseFloat(inp.value.replace(/,/g, ''));
  if (isNaN(offer) || offer <= 0) {
    showInputError(inp, 'Enter a valid salary amount');
    return;
  }

  recordOffer(offer);

  if (offer > employerMax) {
    document.getElementById('seller-dialog').innerHTML = `Employer: Exceeds budget. Rejected.`;
    finalSalaryOffer = 0;
    return endSalaryNegotiation();
  }

  const threshold = salaryRole === "high" ? 50000 : 35000;
  if (offer > threshold) {
    const rej = (offer - threshold) / (employerMax - threshold);
    if (Math.random() < rej) {
      document.getElementById('seller-dialog').innerHTML = `Employer: Demand too high. Rejected.`;
      finalSalaryOffer = 0;
      return endSalaryNegotiation();
    }
    const counter = Math.floor(Math.random() * (employerMax - offer) + offer);
    document.getElementById('seller-dialog').innerHTML = `Employer: Counter £${counter.toLocaleString()}.`;
    inp.value = counter;
    return;
  }

  const rejChance = (offer - initialSalaryOffer) / (employerMax - initialSalaryOffer);
  if (Math.random() < rejChance) {
    const counter = Math.floor(Math.random() * (offer - initialSalaryOffer) + initialSalaryOffer);
    document.getElementById('seller-dialog').innerHTML = `Employer: Counter £${counter.toLocaleString()}.`;
    inp.value = counter;
  } else {
    finalSalaryOffer = offer;
    document.getElementById('seller-dialog').innerHTML = `Employer: £${offer.toLocaleString()} accepted.`;
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
      let val = incentive.valuePercent
                ? Math.floor(curr * incentive.valuePercent / 100)
                : incentive.value;
      const r = Math.random();
      if (r < 0.4 && employerRemaining >= cost) {
        requestedIncentives.push(incentive.name + " (Full)");
        incentiveBonus += val;
        employerRemaining -= cost;
        document.getElementById('seller-dialog').textContent = `${incentive.name} fully approved.`;
      } else if (r < 0.7 && employerRemaining >= cost / 2) {
        requestedIncentives.push(incentive.name + " (Partial)");
        incentiveBonus += Math.floor(val / 2);
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
    document.getElementById('seller-dialog').innerHTML = `Employer: Consider £${newOffer.toLocaleString()}.`;
    document.getElementById('offer-input').value = newOffer;
  } else {
    document.getElementById('seller-dialog').innerHTML = `Employer: No deal.`;
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
  const total = baseScore + incentiveBonus;
  if (total > highScores["Salary Negotiation"]) {
    highScores["Salary Negotiation"] = total;
    document.getElementById('score-text').innerHTML += `<br>🏆 New High Score! 🏆`;
  }
  document.getElementById('score-text').innerHTML = `
    Final Salary: £${finalSalaryOffer.toLocaleString()}<br>
    Incentives: ${requestedIncentives.length ? requestedIncentives.join(", ") : "None"}<br>
    Total Score: ${total}%
  `;
  saveHighScores();
  document.getElementById('car-image').src = "seller.jpg";
  createConfetti();

  // Only show bonus if an offer was accepted
  if (finalSalaryOffer > 0) {
    presentBonus();
    switchScreen('bonus-panel');
  } else {
    switchScreen('congratulations');
  }
}

// ------------------------
// Bonus Panel Logic
// ------------------------
function presentBonus() {
  const panel = document.getElementById('bonus-panel');
  const qList = bonusBank[currentScenario] || [];
  if (!qList.length) return;
  const q = qList[Math.floor(Math.random() * qList.length)];

  document.getElementById('bonus-question-text').innerText = q.text;
  const optsDiv = document.getElementById('bonus-options');
  optsDiv.innerHTML = '';
  q.opts.forEach((o,i) => {
    const lbl = document.createElement('label');
    lbl.className = 'bonus-option';
    lbl.innerHTML = `<input type="radio" name="bonus" value="${i}"> ${o}`;
    optsDiv.appendChild(lbl);
  });

  panel.dataset.correct = q.correct;
  panel.classList.remove('hidden');
}

document.getElementById('bonus-submit').addEventListener('click', () => {
  const sel = document.querySelector('input[name="bonus"]:checked');
  let extra = 0;
  if (sel && parseInt(sel.value) === parseInt(document.getElementById('bonus-panel').dataset.correct)) {
    extra = 50;
  }
  document.getElementById('score-text').innerHTML += `<br>Bonus: +${extra} pts`;
  document.getElementById('bonus-panel').classList.add('hidden');
  switchScreen('congratulations');
});

// ------------------------
// High Score Helpers
// ------------------------
function updateHighScore(car, score) {
  if (score > highScores["Buy a Car"][car]) {
    highScores["Buy a Car"][car] = score;
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
  let txt = "Buy a Car:\n";
  const labels = { new_car:"New Car", old_car:"Old Car", antique:"Antique Car" };
  for (let c in highScores["Buy a Car"]) {
    txt += `  ${labels[c]}: £${highScores["Buy a Car"][c].toLocaleString()}\n`;
  }
  txt += `\nRogue AI Negotiation: ${highScores["Rogue AI Negotiation"]}\n`;
  txt += `\nSalary Negotiation: ${highScores["Salary Negotiation"]}\n`;
  document.getElementById('high-scores-text').textContent = txt;
}

function resetNegotiation() {
  currentCar = currentScenario = null;
  initialPrice = minPrice = agreedPrice = negotiationAttempts = 0;
  salaryRole = ""; initialSalaryOffer = employerMax = employerRemaining = 0;
  finalSalaryOffer = incentiveBonus = incentiveRequestsCount = 0;
  requestedIncentives = [];
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
  const colors = ['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeead'];
  const container = document.getElementById('congratulations');
  document.querySelectorAll('.confetti').forEach(el => el.remove());
  for (let i = 0; i < 100; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random()*100 + 'vw';
    c.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
    c.style.animationDelay = Math.random()*3 + 's';
    container.appendChild(c);
  }
}

// ------------------------
// Input Error & Messages
// ------------------------
function showInputError(input, msg) {
  let el = document.getElementById('offer-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'offer-error';
    el.className = 'error-message';
    document.getElementById('player-bubble').appendChild(el);
  }
  el.textContent = msg;
  input.style.borderColor = 'red';
  setTimeout(() => {
    el.textContent = '';
    input.style.borderColor = 'var(--accent-color)';
  }, 3000);
}

function showTemporaryMessage(msg, dur=2000) {
  const m = document.createElement('div');
  m.className = 'temp-message';
  m.textContent = msg;
  document.body.appendChild(m);
  setTimeout(() => {
    m.classList.add('fade-out');
    setTimeout(() => m.remove(), 300);
  }, dur);
}

// ------------------------
// Reset High Scores Modal
// ------------------------
function showResetConfirmation() {
  const ov = document.createElement('div');
  ov.id = 'reset-confirmation-overlay';
  const md = document.createElement('div');
  md.id = 'reset-confirmation-modal';
  md.innerHTML = `<p>Reset High Scores?</p>`;
  const yes = document.createElement('button');
  yes.textContent = 'Yes';
  const no = document.createElement('button');
  no.textContent = 'No';
  md.append(yes,no);
  ov.appendChild(md);
  document.body.appendChild(ov);

  const timer = setTimeout(() => ov.remove(), 15000);

  yes.addEventListener('click', () => {
    clearTimeout(timer);
    performResetHighScores();
    ov.remove();
    showTemporaryMessage("High Scores reset",2000);
  });
  no.addEventListener('click', () => {
    clearTimeout(timer);
    ov.remove();
  });
}

function performResetHighScores() {
  highScores["Buy a Car"] = { new_car:0, old_car:0, antique:0 };
  highScores["Rogue AI Negotiation"] = 0;
  highScores["Salary Negotiation"] = 0;
  saveHighScores();
  updateHighScores();
}