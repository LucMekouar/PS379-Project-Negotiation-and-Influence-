// ---- Global State ----
let currentScenario = null;
let selectedCar = null;
let selectedRole = null;
let partnerOffer = 0;
let partnerFinalOfferMade = false;
let partnerFinalValue = 0;
let incentiveBonus = 0;
let employerRemaining = 0;
let requestedIncentives = [];
let incentiveRequestsCount = 0;

// Load or initialize high scores
let highScores = JSON.parse(localStorage.getItem('highScores')) || {
  salary: 0,
  car: { new_car: 0, old_car: 0, antique: 0 }
};

// Car specifications
const carSpecs = {
  new_car:    { label: 'New Car',     image: 'new_car.png',    initial: 50000, min: 35000 },
  old_car:    { label: 'Old Car',     image: 'old_car.png',    initial: 10000, min: 8000  },
  antique:    { label: 'Antique Car', image: 'antique.png',     initial: 13000, min: 10000 }
};

// Scenario definitions
const scenarios = {
  salary: {
    name: 'Salary Negotiation',
    image: 'employer-interview_picture.png',
    questions: [
      { question: "What does the term '3D negotiation' refer to?", options: [
          "Using three separate negotiation tactics one after the other.",
          "Negotiating beyond the table by shaping deal design and setup.",
          "A negotiation involving three or more parties.",
          "A method focusing on three critical factors only."
        ], correct: 1 },
      { question: "System 1 vs System 2 thinking describes:", options: [
          "Competitive vs cooperative tactics.",
          "Intuitive (fast) vs analytical (slow) thinking.",
          "Having a backup negotiator.",
          "Making first vs second offers."
        ], correct: 1 },
      { question: "Leverage in negotiation is best defined as:", options: [
          "Strictly sticking to your initial position.",
          "Persuasive emotional appeals.",
          "The power one side has to influence outcome.",
          "Offering concessions only."
        ], correct: 2 },
      { question: "Anchoring bias means:", options: [
          "Refusing to move from the initial offer.",
          "The first offer sets a reference point.",
          "Focusing on one issue only.",
          "Building rapport first."
        ], correct: 1 },
      { question: "Interest-based bargaining focuses on:", options: [
          "Insisting demands.",
          "Underlying interests for win-win outcomes.",
          "Compromises without discussion.",
          "Hiding true goals."
        ], correct: 1 }
    ],
    roles: {
      high: { initial: 35000, max: 60000 },
      low:  { initial: 25000, max: 40000 }
    },
    incentivesData: [
      { name: 'Signing Bonus', value: 2000, cost: 3000 },
      { name: 'Flexible Hours', valuePercent: 10, costPercent: 7.5 },
      { name: 'Professional Development', value: 500, cost: 1000 },
      { name: 'Gym Membership', value: 150, cost: 100 },
      { name: 'Stock Options', value: 3000, cost: 5000 }
    ],
    maxIncentives: 4
  },
  car: {
    name: 'Car Price Negotiation',
    questions: [
      { question: "What is 3D negotiation?", options: [
          "Three tactics sequentially.",
          "Shaping deal design away from the table.",
          "Three or more parties.",
          "Three-factor method."
        ], correct: 1 },
      { question: "System 1 vs System 2:", options: [
          "Competitive vs cooperative.",
          "Intuitive vs analytical.",
          "Backup negotiator.",
          "Offer order."
        ], correct: 1 },
      { question: "Leverage is:", options: [
          "Sticking to demands.",
          "Emotional appeals.",
          "Influence power.",
          "Only concessions."
        ], correct: 2 },
      { question: "Anchoring bias:", options: [
          "Refuse to budge.",
          "First offer as reference.",
          "Single-issue focus.",
          "Build rapport."
        ], correct: 1 },
      { question: "Interest-based bargaining:", options: [
          "Insist demands.",
          "Win-win via interests.",
          "Compromise only.",
          "Hide goals."
        ], correct: 1 }
    ]
  }
};

// DOM Elements
const scenarioSelectionDiv = document.getElementById('scenarioSelection');
const carSelectionDiv      = document.getElementById('carSelection');
const roleSelectionDiv     = document.getElementById('roleSelection');
const negotiationDiv       = document.getElementById('negotiationInterface');
const dialogueDiv          = document.getElementById('dialogue');
const titleEl              = document.getElementById('scenarioTitle');
const imgEl                = document.getElementById('negotiationImage');
const offerInput           = document.getElementById('offerInput');
const negotiateBtn         = document.getElementById('negotiateButton');
const requestCompBtn       = document.getElementById('requestCompBtn');
const acceptBtn            = document.getElementById('acceptButton');
const compOptionsDiv       = document.getElementById('compensationOptions');
const bonusOverlay         = document.getElementById('bonusOverlay');
const bonusQuestionText    = document.getElementById('bonusQuestionText');
const bonusOptionsDiv      = document.getElementById('bonusOptions');
const bonusFeedback        = document.getElementById('bonusFeedback');
const closeBonusBtn        = document.getElementById('closeBonusBtn');
const highScoreScreenDiv   = document.getElementById('highScoreScreen');
const highScoreListDiv     = document.getElementById('highScoreList');

// Buttons
document.getElementById('salaryScenarioBtn').onclick = showRoleSelection;
document.getElementById('carScenarioBtn').onclick    = showCarSelection;
document.getElementById('viewHighScoresBtn').onclick = showHighScores;
document.getElementById('backFromCarSelect').onclick = () => swapScreen(carSelectionDiv, scenarioSelectionDiv);
document.getElementById('backFromRoleSelect').onclick= () => swapScreen(roleSelectionDiv, scenarioSelectionDiv);
document.getElementById('backFromHighScoresBtn').onclick = () => swapScreen(highScoreScreenDiv, scenarioSelectionDiv);

// Car options
Array.from(document.querySelectorAll('.car-option')).forEach(el => {
  el.onclick = () => { selectedCar = el.dataset.car; startCarNegotiation(); };
});
// Role options
Array.from(document.querySelectorAll('.role-btn')).forEach(el => {
  el.onclick = () => { selectedRole = el.dataset.role; startSalaryNegotiation(); };
});

// Negotiation actions
negotiateBtn.onclick = () => {
  if (currentScenario === 'salary' && offerInput.style.display === 'none') {
    // reveal input the first time
    offerInput.style.display = 'inline-block';
    offerInput.placeholder = 'Propose your salary in £';
    negotiateBtn.textContent = 'Submit Offer';
    return;
  }
  processUserOffer();
};
requestCompBtn.onclick = () => requestCompensation();
acceptBtn.onclick = () => {
  displayMessage(`You accept £${partnerOffer}`);
  endNegotiation(true, partnerOffer);
};

closeBonusBtn.onclick = () => {
  bonusOverlay.classList.add('hidden');
  negotiationDiv.classList.add('hidden');
  swapScreen(negotiationDiv, scenarioSelectionDiv);
};

// Show/Hide helper
function swapScreen(hideEl, showEl) {
  hideEl.classList.add('hidden');
  showEl.classList.remove('hidden');
}

// Display a dialogue message
function displayMessage(text) {
  const p = document.createElement('p');
  p.textContent = text;
  dialogueDiv.appendChild(p);
  dialogueDiv.scrollTop = dialogueDiv.scrollHeight;
}

// Start Car Negotiation
function startCarNegotiation() {
  currentScenario = 'car';
  scenarioSelectionDiv.classList.add('hidden');
  carSelectionDiv.classList.add('hidden');
  negotiationDiv.classList.remove('hidden');

  const spec = carSpecs[selectedCar];
  partnerOffer = spec.initial;
  partnerFinalOfferMade = false;
  incentiveBonus = 0;
  dialogueDiv.innerHTML = '';
  titleEl.textContent = scenarios.car.name;
  imgEl.src = spec.image;
  offerInput.style.display = 'inline-block';
  offerInput.value = '';
  offerInput.placeholder = 'Enter your car offer in £';
  negotiateBtn.textContent = 'Submit Offer';
  requestCompBtn.style.display = 'none';
  compOptionsDiv.classList.add('hidden');

  displayMessage(`${scenarios.car.name} - Asking price: £${partnerOffer}`);
}

// Start Salary Negotiation
function startSalaryNegotiation() {
  currentScenario = 'salary';
  scenarioSelectionDiv.classList.add('hidden');
  roleSelectionDiv.classList.add('hidden');
  negotiationDiv.classList.remove('hidden');

  const roleData = scenarios.salary.roles[selectedRole];
  partnerOffer = roleData.initial;
  employerRemaining = roleData.max - roleData.initial;
  partnerFinalOfferMade = false;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  dialogueDiv.innerHTML = '';
  titleEl.textContent = scenarios.salary.name;
  imgEl.src = scenarios.salary.image;

  offerInput.style.display = 'none';
  negotiateBtn.textContent = 'Negotiate Salary';
  requestCompBtn.style.display = 'inline-block';
  compOptionsDiv.classList.add('hidden');

  displayMessage(`${scenarios.salary.name} - Employer offers £${partnerOffer}`);
}

// Process user offer input
function processUserOffer() {
  const val = parseInt(offerInput.value);
  if (isNaN(val) || val <= 0) { alert('Enter a valid number'); return; }
  displayMessage(`You propose £${val}`);
  if (currentScenario === 'car') handleCarCounter(val);
  else if (currentScenario === 'salary') handleSalaryCounter(val);
  offerInput.value = '';
}

// Car counter logic
function handleCarCounter(userOffer) {
  const spec = carSpecs[selectedCar];
  const min = spec.min;
  if (!partnerFinalOfferMade) {
    if (userOffer >= partnerOffer) {
      displayMessage(`Seller: Deal at £${userOffer}!`);
      endNegotiation(true, userOffer);
      return;
    }
    const diff = partnerOffer - userOffer;
    if (diff <= partnerOffer * 0.05) {
      displayMessage(`Seller: Fine, £${userOffer}.`);
      endNegotiation(true, userOffer);
    } else {
      let counter = partnerOffer - Math.round(diff/2);
      if (counter < min) { counter = min; partnerFinalOfferMade = true; partnerFinalValue = counter; displayMessage(`Seller: Can't go below £${counter}.`); }
      else displayMessage(`Seller: Counter £${counter}.`);
      partnerOffer = counter;
    }
  } else {
    if (userOffer >= partnerFinalValue) {
      displayMessage(`Seller: Deal at £${userOffer}.`);
      endNegotiation(true, userOffer);
    } else {
      displayMessage(`Seller: £${partnerFinalValue} was final. No deal.`);
      endNegotiation(false, null);
    }
  }
}

// Salary counter logic
function handleSalaryCounter(userOffer) {
  const roleData = scenarios.salary.roles[selectedRole];
  const max = roleData.max;
  if (!partnerFinalOfferMade) {
    if (userOffer <= partnerOffer) {
      displayMessage(`Employer: Accepted £${userOffer}.`);
      endNegotiation(true, userOffer);
      return;
    }
    if (userOffer > max) {
      displayMessage(`Employer: Can't exceed £${max}.`);
      partnerFinalOfferMade = true; partnerFinalValue = max;
      partnerOffer = max;
      return;
    }
    const diff = userOffer - partnerOffer;
    if (diff <= partnerOffer * 0.05) {
      displayMessage(`Employer: OK £${userOffer}.`);
      endNegotiation(true, userOffer);
    } else {
      let counter = partnerOffer + Math.round(diff/2);
      if (counter >= max) { counter = max; partnerFinalOfferMade = true; partnerFinalValue = max; displayMessage(`Employer: Top is £${max}.`); }
      else displayMessage(`Employer: Counter £${counter}.`);
      partnerOffer = counter;
    }
  } else {
    if (userOffer <= partnerFinalValue) {
      displayMessage(`Employer: Deal £${userOffer}.`);
      endNegotiation(true, userOffer);
    } else {
      displayMessage(`Employer: £${partnerFinalValue} was final. No deal.`);
      endNegotiation(false, null);
    }
  }
}

// Request compensation options
function requestCompensation() {
  if (incentiveRequestsCount >= scenarios.salary.maxIncentives) { alert('Max requests reached'); return; }
  compOptionsDiv.innerHTML = '';
  scenarios.salary.incentivesData.forEach(opt => {
    if (!requestedIncentives.includes(opt.name)) {
      const btn = document.createElement('button');
      btn.textContent = opt.name;
      btn.className = 'comp-option';
      btn.onclick = () => {
        const r = Math.random();
        let approved = '', val=0, cost=0;
        // compute cost & value
        if (opt.costPercent) cost = Math.floor(partnerOffer*opt.costPercent/100);
        else cost = opt.cost;
        if (opt.valuePercent) val = Math.floor(partnerOffer*opt.valuePercent/100);
        else val = opt.value;
        if (r < 0.4 && employerRemaining >= cost) { approved = 'fully approved'; incentiveBonus += val; employerRemaining -= cost; }
        else if (r < 0.7 && employerRemaining >= cost/2) { approved = 'partially approved'; incentiveBonus += Math.floor(val/2); employerRemaining -= Math.floor(cost/2); }
        else { approved = 'not approved'; }
        displayMessage(`Employer: ${opt.name} ${approved}.`);
        incentiveRequestsCount++;
        requestedIncentives.push(opt.name);
        compOptionsDiv.classList.add('hidden');
      };
      compOptionsDiv.appendChild(btn);
    }
  });
  compOptionsDiv.classList.remove('hidden');
}

// End negotiation & bonus
function endNegotiation(success, dealValue) {
  if (success) displayMessage(`*** Deal at £${dealValue} ***`);
  else displayMessage('*** No deal reached ***');
  updateHighScores(dealValue);
  setTimeout(showBonusQuestion, 800);
}

// Update high scores
function updateHighScores(dealValue) {
  if (currentScenario === 'car') {
    const spec = carSpecs[selectedCar];
    const sc = spec.initial - dealValue;
    if (sc > highScores.car[selectedCar]) {
      highScores.car[selectedCar] = sc;
      displayMessage('🏆 New high score: ' + sc);
    }
  } else if (currentScenario === 'salary') {
    const init = scenarios.salary.roles[selectedRole].initial;
    const total = dealValue + incentiveBonus;
    const pct = Math.floor((total / init)*100);
    if (pct > highScores.salary) {
      highScores.salary = pct;
      displayMessage('🏆 New high score: ' + pct + '%');
    }
  }
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Show high scores screen
function showHighScores() {
  scenarioSelectionDiv.classList.add('hidden');
  highScoreScreenDiv.classList.remove('hidden');
  let html = '<h3>Car Negotiation</h3><ul>';
  for (let key in highScores.car) html += `<li>${carSpecs[key].label}: ${highScores.car[key]}</li>`;
  html += '</ul><h3>Salary Negotiation</h3><p>' + highScores.salary + '%</p>';
  highScoreListDiv.innerHTML = html;
}

// Bonus question
function showBonusQuestion() {
  const qList = scenarios[currentScenario].questions;
  const q = qList[Math.floor(Math.random()*qList.length)];
  bonusQuestionText.textContent = q.question;
  bonusOptionsDiv.innerHTML = '';
  bonusFeedback.textContent = '';
  closeBonusBtn.classList.add('hidden');
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => {
      Array.from(bonusOptionsDiv.children).forEach(b=>b.disabled=true);
      bonusOptionsDiv.children[q.correct].classList.add('correct');
      if (idx === q.correct) {
        bonusFeedback.textContent = `Correct! +10 pts. Answer: ${q.options[q.correct]}`;
      } else {
        bonusOptionsDiv.children[idx].classList.add('incorrect');
        bonusFeedback.textContent = `Wrong. Correct: ${q.options[q.correct]}`;
      }
      closeBonusBtn.classList.remove('hidden');
    };
    bonusOptionsDiv.appendChild(btn);
  });
  bonusOverlay.classList.remove('hidden');
}
