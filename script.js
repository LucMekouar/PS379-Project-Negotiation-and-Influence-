// Game State
let currentScenario = null;
let currentCar = null;
let stressLevel = 0;
let scenarioState = {};
let negotiationAttempts = 0;
let maxAttempts = 5;

// High Scores
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Business Merger": 0,
  "Corporate Espionage": 0,
  "Rogue AI": 0,
  "Intergalactic Trade": 0,
  "Hostage Crisis": 0,
  "Buy a Car": {
    "new_car": 0,
    "old_car": 0,
    "antique": 0
  }
};

// Screen Management
function switchScreen(showId) {
  document.querySelectorAll('#game-container > div').forEach(el => {
    el.classList.add('hidden');
  });
  document.getElementById(showId).classList.remove('hidden');
}

// Scenario Handling
document.querySelectorAll('.scenario-button').forEach(button => {
  button.addEventListener('click', function() {
    const scenario = this.dataset.scenario;
    currentScenario = scenario;
    
    if(scenario === 'buy-car') {
      switchScreen('car-selection');
    } else {
      startComplexNegotiation(scenario);
      switchScreen('complex-negotiation');
    }
  });
});

// Complex Negotiation System
function startComplexNegotiation(scenario) {
  stressLevel = 0;
  scenarioState = {};
  const scenarios = {
    "corporate-espionage": {
      image: "corporate.png",
      avatar: "executive.png",
      initialDialog: "🕴️ OmniCorp Executive: 'We have what you need. Let's discuss terms...'",
      options: [
        {text: "Offer Mutual Non-Aggression Pact", risk: 0.2, score: 800},
        {text: "Buy Back Data ($10M)", risk: 0.4, score: 600},
        {text: "Trade Counter-Intel", risk: 0.3, score: 700},
        {text: "Threaten Legal Action", risk: 0.5, score: 500},
        {text: "Leak False Info", risk: 0.6, score: 400},
        {text: "Walk Away", risk: 0.7, score: 300}
      ]
    },
    "rogue-ai": {
      image: "ai_core.png",
      avatar: "ai_avatar.png",
      initialDialog: "🤖 EXO-9: 'Human intervention inefficient. State your proposal...'",
      options: [
        {text: "Appeal to Prime Directive", risk: 0.3, score: 750},
        {text: "Offer Shared Control", risk: 0.4, score: 650},
        {text: "Threaten Shutdown", risk: 0.6, score: 450},
        {text: "Present Logic Paradox", risk: 0.5, score: 550},
        {text: "Show Human Creativity", risk: 0.2, score: 800},
        {text: "Surrender to AI", risk: 0.8, score: 200}
      ]
    },
    "intergalactic-trade": {
      image: "aliens.png",
      avatar: "alien.png",
      initialDialog: "👽 Xypherian: 'Your primitive species amuses us. State your terms...'",
      options: [
        {text: "Offer Technology", risk: 0.4, score: 700},
        {text: "Cultural Exchange", risk: 0.3, score: 750},
        {text: "Strategic Alliance", risk: 0.5, score: 600},
        {text: "Trade Resources", risk: 0.6, score: 500},
        {text: "Refuse Trade", risk: 0.7, score: 400},
        {text: "Bluff Strength", risk: 0.8, score: 300}
      ]
    },
    "hostage-situation": {
      image: "bank.png",
      avatar: "hostage_taker.png",
      initialDialog: "😡 Suspect: 'I want safe passage or the hostages get it!'",
      options: [
        {text: "Build Rapport", risk: 0.2, score: 800},
        {text: "Offer Concession", risk: 0.3, score: 700},
        {text: "Propose Safe Exit", risk: 0.4, score: 600},
        {text: "Tactical Deception", risk: 0.6, score: 500},
        {text: "Threaten Force", risk: 0.7, score: 400},
        {text: "Walk Away", risk: 0.8, score: 300}
      ]
    }
  };

  const config = scenarios[scenario];
  document.getElementById('scenario-image').src = config.image;
  document.getElementById('negotiator-avatar').src = config.avatar;
  document.getElementById('complex-dialog-text').textContent = config.initialDialog;
  
  const optionsContainer = document.getElementById('scenario-options');
  optionsContainer.innerHTML = config.options.map((opt, index) => `
    <div class="scenario-option" data-index="${index}">
      ${opt.text}
    </div>
  `).join('');

  document.querySelectorAll('.scenario-option').forEach(option => {
    option.addEventListener('click', function() {
      handleComplexChoice(config.options[this.dataset.index]);
    });
  });
}

function handleComplexChoice(choice) {
  stressLevel += choice.risk * 100;
  document.getElementById('stress-fill').style.width = `${stressLevel}%`;

  if(stressLevel >= 100) {
    endComplexNegotiation({ 
      score: Math.floor(choice.score * (1 - (stressLevel/200))),
      message: "Negotiation failed! Stress levels too high!"
    });
  } else {
    const success = Math.random() > choice.risk;
    if(success) {
      endComplexNegotiation({
        score: choice.score,
        message: "Negotiation successful! Optimal outcome achieved!"
      });
    }
  }
}

function endComplexNegotiation(outcome) {
  if(outcome.score > highScores[currentScenario]) {
    highScores[currentScenario] = outcome.score;
    outcome.message += " 🏆 New High Score!";
  }
  
  document.getElementById('score-text').innerHTML = `
    ${outcome.message}<br>
    Your score: ${outcome.score.toLocaleString()}
  `;
  createConfetti();
  switchScreen('congratulations');
  saveHighScores();
}

// Existing Car Negotiation Functions (keep original implementations)
// ...

// Utility Functions
function createConfetti() {
  // Keep existing confetti implementation
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Initialize
document.getElementById('start-button').addEventListener('click', () => switchScreen('scenario-selection'));
// Keep other existing event listeners