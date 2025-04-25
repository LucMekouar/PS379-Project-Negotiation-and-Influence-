/**
 * Negotiation Master - Core Game Logic
 * Supports two scenarios (car and salary), bonus questions on negotiation theory,
 * compensation requests, and high-score tracking in localStorage.
 */

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
  antique:    { label: 'Antique Car',  image: 'antique.png',     initial: 13000, min: 10000 }
};

// Scenario definitions with bonus questions (including reservation & aspiration price)
const scenarios = {
  salary: {
    name: 'Salary Negotiation',
    avatar: 'seller.jpg',  // negotiator avatar
    image: 'employer-interview_picture.png',
    questions: [
      // negotiation theory questions
      { question: "What does '3D negotiation' refer to?", options: [
          "Sequential tactics.",
          "Shaping deal setup away from the table.",
          "Three parties at the table.",
          "Three critical factors."
        ], correct: 1 },
      { question: "System 1 vs System 2 thinking describes:", options: [
          "Competitive vs cooperative tactics.",
          "Fast, intuitive vs slow, analytical thinking.",
          "Backup negotiator strategies.",
          "Offer order dynamics."
        ], correct: 1 },
      { question: "What is a reservation price?", options: [
          "Your ideal target outcome.",
          "The lowest you're willing to accept before walking away.",
          "The first offer anchor.",
          "A bonus incentive."
        ], correct: 1 },
      { question: "What is an aspiration price?", options: [
          "The lowest acceptable limit.",
          "Your best alternative outside the deal.",
          "Your target or ideal negotiated outcome.",
          "A price suggested by the other party."
        ], correct: 2 },
      { question: "Anchoring bias means:", options: [
          "Never move from an initial offer.",
          "The first number sets the reference point.",
          "Focus on one issue only.",
          "Build rapport first."
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
    avatar: 'seller.jpg',
    questions: [
      { question: "What is 3D negotiation?", options: [
          "Three tactics sequentially.",
          "Shaping deal setup off-table.",
          "Three parties at once.",
          "Three-factor method."
        ], correct: 1 },
      { question: "System 1 vs System 2:", options: [
          "Competitive vs cooperative.",
          "Intuitive vs analytical thinking.",
          "Backup negotiator.",
          "Offer sequence."
        ], correct: 1 },
      { question: "Reservation price is:", options: [
          "Your ideal target.",
          "Your walk-away limit.",
          "First anchor set.",
          "A concession strategy."
        ], correct: 1 },
      { question: "Aspiration price means:", options: [
          "Lowest acceptable limit.",
          "Target outcome you aim for.",
          "Opponent's opening offer.",
          "Fallback alternative."
        ], correct: 1 },
      { question: "Anchoring bias:", options: [
          "Refuse to budge.",
          "First number sets the tone.",
          "Single-issue focus.",
          "Emotional leverage."
        ], correct: 1 }
    ]
  }
};

// DOM references
const scenarioSelectionDiv = document.getElementById('scenarioSelection');
const carSelectionDiv      = document.getElementById('carSelection');
const roleSelectionDiv     = document.getElementById('roleSelection');
const negotiationDiv       = document.getElementById('negotiationInterface');
const dialogueDiv          = document.getElementById('dialogue');
const titleEl              = document.getElementById('scenarioTitle');
const avatarEl             = document.getElementById('agentAvatar');
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

// Button bindings
document.getElementById('salaryScenarioBtn').onclick = () => swapScreen(scenarioSelectionDiv, roleSelectionDiv);
document.getElementById('carScenarioBtn').onclick    = () => swapScreen(scenarioSelectionDiv, carSelectionDiv);
document.getElementById('viewHighScoresBtn').onclick = showHighScores;
document.getElementById('backFromCarSelect').onclick = () => swapScreen(carSelectionDiv, scenarioSelectionDiv);
document.getElementById('backFromRoleSelect').onclick= () => swapScreen(roleSelectionDiv, scenarioSelectionDiv);
document.getElementById('backFromHighScoresBtn').onclick = () => swapScreen(highScoreScreenDiv, scenarioSelectionDiv);

// Car & role option selection
document.querySelectorAll('.car-option').forEach(el => el.onclick = () => { selectedCar = el.dataset.car; startCarNegotiation(); });
document.querySelectorAll('.role-btn').forEach(el => el.onclick = () => { selectedRole = el.dataset.role; startSalaryNegotiation(); });

// Negotiation actions
negotiateBtn.onclick   = () => {
  if (currentScenario === 'salary' && offerInput.style.display === 'none') {
    // reveal input on first click
    offerInput.style.display = 'inline-block';
    offerInput.placeholder = 'Propose your salary in £';
    negotiateBtn.textContent = 'Submit Offer';
  } else processUserOffer();
};
requestCompBtn.onclick = () => requestCompensation();
acceptBtn.onclick      = () => { displayMessage(`You accept £${partnerOffer}`); endNegotiation(true, partnerOffer); };
closeBonusBtn.onclick  = () => { bonusOverlay.classList.add('hidden'); swapScreen(negotiationDiv, scenarioSelectionDiv); };

// Screen swap helper
function swapScreen(hideEl, showEl) {
  hideEl.classList.add('hidden');
  showEl.classList.remove('hidden');
}

// Append dialogue message
function displayMessage(text) {
  const p = document.createElement('p');
  p.textContent = text;
  dialogueDiv.appendChild(p);
  dialogueDiv.scrollTop = dialogueDiv.scrollHeight;
}

// Start car negotiation
function startCarNegotiation() {
  currentScenario = 'car';
  swapScreen(carSelectionDiv, negotiationDiv);
  const spec = carSpecs[selectedCar];
  partnerOffer = spec.initial;
  partnerFinalOfferMade = false;
  incentiveBonus = 0;
  dialogueDiv.innerHTML = '';
  titleEl.textContent = scenarios.car.name;
  avatarEl.src = scenarios.car.avatar;
  imgEl.src = spec.image;
  offerInput.style.display = 'inline-block';
  offerInput.value = '';
  offerInput.placeholder = 'Enter your car offer in £';
  negotiateBtn.textContent = 'Submit Offer';
  requestCompBtn.style.display = 'none';
  compOptionsDiv.classList.add('hidden');
  displayMessage(`${scenarios.car.name} - Asking price: £${partnerOffer}`);
}

// Start salary negotiation
function startSalaryNegotiation() {
  currentScenario = 'salary';
  swapScreen(roleSelectionDiv, negotiationDiv);
  const roleData = scenarios.salary.roles[selectedRole];
  partnerOffer = roleData.initial;
  employerRemaining = roleData.max - roleData.initial;
  partnerFinalOfferMade = false;
  incentiveBonus = 0;
  requestedIncentives = [];
  incentiveRequestsCount = 0;
  dialogueDiv.innerHTML = '';
  titleEl.textContent = scenarios.salary.name;
  avatarEl.src = scenarios.salary.avatar;
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
  if (isNaN(val) || val <= 0) { alert('Enter a positive number'); return; }
  displayMessage(`You propose £${val}`);
  if (currentScenario === 'car') handleCarCounter(val);
  else handleSalaryCounter(val);
  offerInput.value = '';
}

// Car counter logic
function handleCarCounter(userOffer) {
  const spec = carSpecs[selectedCar];
  if (!partnerFinalOfferMade) {
    if (userOffer >= partnerOffer) return displayMessage(`Seller: Deal at £${userOffer}!`), endNegotiation(true, userOffer);
    const diff = partnerOffer - userOffer;
    if (diff <= partnerOffer * 0.05) return displayMessage(`Seller: Fine, £${userOffer}.`), endNegotiation(true, userOffer);
    let counter = partnerOffer - Math.round(diff/2);
    if (counter < spec.min) { counter = spec.min; partnerFinalOfferMade = true; partnerFinalValue = counter; displayMessage(`Seller: Can't go below £${counter}.`); }
    else displayMessage(`Seller: Counter £${counter}.`);
    partnerOffer = counter;
  } else {
    if (userOffer >= partnerFinalValue) return displayMessage(`Seller: Deal at £${userOffer}.`), endNegotiation(true, userOffer);
    displayMessage(`Seller: £${partnerFinalValue} was final. No deal.`);
    endNegotiation(false, null);
  }
}

// Salary counter logic
function handleSalaryCounter(userOffer) {
  const roleData = scenarios.salary.roles[selectedRole];
  if (!partnerFinalOfferMade) {
    if (userOffer <= partnerOffer) return displayMessage(`Employer: Accepted £${userOffer}.`), endNegotiation(true, userOffer);
    if (userOffer > roleData.max) { partnerFinalOfferMade = true; partnerFinalValue = roleData.max; partnerOffer = roleData.max; return displayMessage(`Employer: Can't exceed £${roleData.max}.`); }
    const diff = userOffer - partnerOffer;
    if (diff <= partnerOffer * 0.05) return displayMessage(`Employer: OK £${userOffer}.`), endNegotiation(true, userOffer);
    let counter = partnerOffer + Math.round(diff/2);
    if (counter >= roleData.max) { counter = roleData.max; partnerFinalOfferMade = true; partnerFinalValue = counter; displayMessage(`Employer: Top is £${counter}.`); }
    else displayMessage(`Employer: Counter £${counter}.`);
    partnerOffer = counter;
  } else {
    if (userOffer <= partnerFinalValue) return displayMessage(`Employer: Deal £${userOffer}.`), endNegotiation(true, userOffer);
    displayMessage(`Employer: £${partnerFinalValue} was final. No deal.`);
    endNegotiation(false, null);
  }
}

// Compensation request
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
        let cost = opt.costPercent ? Math.floor(partnerOffer*opt.costPercent/100) : opt.cost;
        let val  = opt.valuePercent ? Math.floor(partnerOffer*opt.valuePercent/100) : opt.value;
        if (r < 0.4 && employerRemaining >= cost) { incentiveBonus += val; employerRemaining -= cost; displayMessage(`Employer: ${opt.name} fully approved.`); }
        else if (r < 0.7 && employerRemaining >= cost/2) { incentiveBonus += Math.floor(val/2); employerRemaining -= Math.floor(cost/2); displayMessage(`Employer: ${opt.name} partially approved.`); }
        else displayMessage(`Employer: Cannot accommodate ${opt.name}.`);
        incentiveRequestsCount++;
        requestedIncentives.push(opt.name);
        compOptionsDiv.classList.add('hidden');
      };
      compOptionsDiv.appendChild(btn);
    }
  });
  compOptionsDiv.classList.remove('hidden');
}

// End negotiation and schedule bonus question
function endNegotiation(success, dealValue) {
  displayMessage(success ? `*** Deal reached at £${dealValue} ***` : '*** Negotiation ended with no deal ***');
  updateHighScores(dealValue);
  setTimeout(showBonusQuestion, 800);
}

// High-score logic
function updateHighScores(dealValue) {
  if (currentScenario === 'car') {
    const sc = carSpecs[selectedCar].initial - dealValue;
    if (sc > highScores.car[selectedCar]) { highScores.car[selectedCar] = sc; displayMessage(`🏆 New high score: ${sc}`); }
  } else {
    const init = scenarios.salary.roles[selectedRole].initial;
    const total = dealValue + incentiveBonus;
    const pct = Math.floor((total / init)*100);
    if (pct > highScores.salary) { highScores.salary = pct; displayMessage(`🏆 New high score: ${pct}%`); }
  }
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Show high scores screen
function showHighScores() {
  swapScreen(scenarioSelectionDiv, highScoreScreenDiv);
  let html = '<h3>Car Negotiation</h3><ul>';
  for (let key in highScores.car) html += `<li>${carSpecs[key].label}: ${highScores.car[key]}</li>`;
  html += '</ul><h3>Salary Negotiation</h3><p>' + highScores.salary + '%</p>';
  highScoreListDiv.innerHTML = html;
}

// Bonus question overlay
function showBonusQuestion() {
  const qList = scenarios[currentScenario].questions;
  const q = qList[Math.floor(Math.random()*qList.length)];
  bonusQuestionText.textContent = q.question;
  bonusOptionsDiv.innerHTML = '';
  bonusFeedback.textContent = '';
  closeBonusBtn.classList.add('hidden');
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button'); btn.textContent = opt;
    btn.onclick = () => {
      Array.from(bonusOptionsDiv.children).forEach(b => b.disabled = true);
      bonusOptionsDiv.children[q.correct].classList.add('correct');
      if (idx === q.correct) bonusFeedback.textContent = `Correct! +10 pts. Answer: ${q.options[q.correct]}`;
      else { bonusOptionsDiv.children[idx].classList.add('incorrect'); bonusFeedback.textContent = `Wrong. Correct: ${q.options[q.correct]}`; }
      closeBonusBtn.classList.remove('hidden');
    };
    bonusOptionsDiv.appendChild(btn);
  });
  bonusOverlay.classList.remove('hidden');
}