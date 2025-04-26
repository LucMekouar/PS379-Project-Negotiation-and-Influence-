// Game state variables and question pool
let currentScenario = null;
let scenarioState = {};  // to hold scenario-specific values (rounds, counters, etc.)
const questionPool = [
  {
    q: "What does BATNA refer to in negotiation?",
    options: [
      "Best Alternative to a Negotiated Agreement",
      "Basic Agreement on Negotiation Analysis",
      "Bold Attempt to Negotiate Aggressively",
      "Best Action taking No Agreement"
    ],
    correctIndex: 0,
    correctAnswerText: "BATNA stands for Best Alternative to a Negotiated Agreement, your fallback if negotiations fail."
  },
  {
    q: "In negotiation, the ZOPA is best described as:",
    options: [
      "The Zone of Possible Agreement, where parties' positions overlap",
      "The Zonal Offer and Price Agreement, a formal contract",
      "Zero-sum Outcome Proposal Analysis, a win-lose scenario",
      "Z-score of Agreements, measuring negotiation success"
    ],
    correctIndex: 0,
    correctAnswerText: "ZOPA means Zone of Possible Agreement – the range in which a deal can be made."
  },
  {
    q: "Integrative negotiation focuses on:",
    options: [
      "Creating win-win solutions by expanding the pie for all",
      "Winning at all costs, even if the other party loses",
      "Splitting the difference on a single issue",
      "Using intimidation tactics to gain an advantage"
    ],
    correctIndex: 0,
    correctAnswerText: "Integrative negotiation is about collaboration and finding win-win outcomes for all parties."
  },
  {
    q: "One of the two key rules of negotiation is:",
    options: [
      "Always be willing to walk away if terms are unacceptable",
      "Never make the first offer in a negotiation",
      "Disclose your bottom line early to build trust",
      "Always insist on your initial position"
    ],
    correctIndex: 0,
    correctAnswerText: "A key rule is to be ready to walk away if you can't get a satisfactory deal (another is to always ask for what you want)."
  },
  {
    q: "What is the 'reservation price' in a negotiation?",
    options: [
      "The least favorable point at which one will accept a deal",
      "The price set aside for future negotiations",
      "An agreed-upon price that's temporarily reserved",
      "The optimal price both parties aim to achieve"
    ],
    correctIndex: 0,
    correctAnswerText: "A reservation price is the lowest (or highest) price a party is willing to accept – beyond this point, they'd walk away."
  }
];

// DOM element references
const menuDiv = document.getElementById("menu");
const gameDiv = document.getElementById("game");
const scenarioTitle = document.getElementById("scenario-title");
const negotiatorImg = document.getElementById("negotiator-img");
const dialogueDiv = document.getElementById("dialogue");
const offerSection = document.getElementById("offer-section");
const offerInput = document.getElementById("offer-input");
const submitOfferBtn = document.getElementById("submit-offer");
const outcomeDiv = document.getElementById("outcome");
const bonusQuestionDiv = document.getElementById("bonus-question");
const questionText = document.getElementById("question-text");
const optionsList = document.getElementById("options-list");
const answerFeedback = document.getElementById("answer-feedback");
const continueBtn = document.getElementById("continue-btn");
const backBtn = document.getElementById("back-btn");

// Scenario configurations (titles, images, etc.)
const scenariosConfig = {
  car: {
    title: "Car Negotiation",
    img: "images/car_salesman.png",         // placeholder path for negotiator image
    imgAlt: "Car Salesman",
    placeholder: "Enter your car offer (£)",
    // Negotiation parameters
    initialAsk: 5000,
    minAcceptable: 4500
  },
  salary: {
    title: "Salary Negotiation",
    img: "images/boss.png",                // placeholder path for boss image
    imgAlt: "Hiring Manager",
    placeholder: "Enter your salary offer (£)",
    initialOffer: 50000,
    maxOffer: 60000
  },
  ai: {
    title: "Rogue AI Negotiation",
    img: "images/rogue_ai.png",            // placeholder path for AI image
    imgAlt: "Rogue AI",
    placeholder: "Enter your resource offer (units)",
    // Negotiation parameters
    demand: 100,
    minRequired: 60
  }
};

// Utility function: append a line to dialogue
function appendDialogue(speaker, text) {
  const p = document.createElement("p");
  p.textContent = text;
  if (speaker === "you") {
    p.classList.add("you");
    p.textContent = "You: " + text;
  } else if (speaker === "npc") {
    p.classList.add("npc");
    // Prepend role name (based on scenario)
    let role = "";
    if (currentScenario === "car") role = "Seller: ";
    if (currentScenario === "salary") role = "Manager: ";
    if (currentScenario === "ai") role = "AI: ";
    p.textContent = role + text;
  }
  dialogueDiv.appendChild(p);
  // Scroll dialogue to bottom if overflow (to see latest message)
  dialogueDiv.scrollTop = dialogueDiv.scrollHeight;
}

// Start a scenario
function startScenario(scenarioKey) {
  currentScenario = scenarioKey;
  // Setup UI for scenario
  scenarioTitle.textContent = scenariosConfig[scenarioKey].title;
  negotiatorImg.src = scenariosConfig[scenarioKey].img;
  negotiatorImg.alt = scenariosConfig[scenarioKey].imgAlt;
  offerInput.placeholder = scenariosConfig[scenarioKey].placeholder;
  // Show input section for all scenarios (in case it was hidden previously for AI in original code, ensure visible now)
  offerSection.style.display = "flex";
  submitOfferBtn.style.display = "inline-block";
  offerInput.value = "";  // clear any previous input
  outcomeDiv.textContent = "";
  bonusQuestionDiv.style.display = "none";
  answerFeedback.textContent = "";
  continueBtn.style.display = "none";
  // Show game container, hide menu
  menuDiv.style.display = "none";
  gameDiv.style.display = "block";
  dialogueDiv.innerHTML = "";  // clear previous dialogue

  // Initialize scenario-specific state
  if (scenarioKey === "car") {
    // Car negotiation initial state
    scenarioState.round = 1;
    scenarioState.sellerMin = scenariosConfig.car.minAcceptable;
    scenarioState.lastCounter = null;
    // Introduce scenario in dialogue
    appendDialogue("npc", `I'm asking £${scenariosConfig.car.initialAsk} for this car.`);
    appendDialogue("npc", "What's your offer?");
  } else if (scenarioKey === "salary") {
    scenarioState.round = 1;
    scenarioState.managerMax = scenariosConfig.salary.maxOffer;
    scenarioState.lastCounter = null;
    // Manager states initial offer
    appendDialogue("npc", `We can offer £${scenariosConfig.salary.initialOffer} to start.`);
    appendDialogue("npc", "What salary do you have in mind?");
  } else if (scenarioKey === "ai") {
    scenarioState.round = 1;
    scenarioState.minRequired = scenariosConfig.ai.minRequired;
    scenarioState.lastDemand = null;
    // AI states its demand
    appendDialogue("npc", `I demand ${scenariosConfig.ai.demand} units of computing power.`);
    appendDialogue("npc", "How much will you offer me?");
  }
}

// Finish negotiation and trigger bonus question phase
function finalizeNegotiation(success, finalValue, scorePercent) {
  // success: boolean indicating if negotiation succeeded or failed
  // finalValue: final agreed value or last offer made
  // scorePercent: base score (0-100) computed for negotiation outcome
  offerSection.style.display = "none";        // hide input & submit during question phase
  submitOfferBtn.style.display = "none";
  if (success) {
    // Display outcome message for success
    if (currentScenario === "car") {
      outcomeDiv.textContent = `Deal made! You bought the car for £${finalValue}.`;
    } else if (currentScenario === "salary") {
      outcomeDiv.textContent = `Negotiation successful! Your salary is £${finalValue}.`;
    } else if (currentScenario === "ai") {
      outcomeDiv.textContent = `Agreement reached. AI is allotted ${finalValue} units.`;
    }
  } else {
    // Display failure message
    if (currentScenario === "car") {
      outcomeDiv.textContent = "Negotiation failed. The seller walked away.";
    } else if (currentScenario === "salary") {
      outcomeDiv.textContent = "Negotiation failed. No salary agreement was reached.";
    } else if (currentScenario === "ai") {
      outcomeDiv.textContent = "Negotiation failed. The AI refuses to cooperate.";
    }
  }
  // Show base negotiation score
  outcomeDiv.textContent += ` (Negotiation Score: ${scorePercent}%)`;
  // Proceed to bonus question regardless of success/fail, for learning opportunity
  presentBonusQuestion(scorePercent);
}

// Bonus Question Phase
function presentBonusQuestion(baseScore) {
  // Pick a random question from the pool
  const qIndex = Math.floor(Math.random() * questionPool.length);
  const qObj = questionPool[qIndex];
  // Display question and options
  questionText.textContent = qObj.q;
  optionsList.innerHTML = "";
  answerFeedback.textContent = "";
  continueBtn.style.display = "none";
  bonusQuestionDiv.style.display = "block";
  // Create option buttons
  qObj.options.forEach((optText, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = optText;
    btn.className = "option-btn";
    // Attach event to handle answer selection
    btn.addEventListener("click", () => {
      // Disable all option buttons after answering
      const allOptionButtons = document.querySelectorAll(".option-btn");
      allOptionButtons.forEach(b => b.disabled = true);
      let correctIdx = qObj.correctIndex;
      // Highlight correct and chosen answers
      if (i === correctIdx) {
        btn.classList.add("correct");
        answerFeedback.className = "correct";
        answerFeedback.textContent = "Correct! " + qObj.correctAnswerText;
      } else {
        btn.classList.add("wrong");
        // highlight the correct answer as well
        allOptionButtons[correctIdx].classList.add("correct");
        answerFeedback.className = "wrong";
        answerFeedback.textContent = "Incorrect. " + qObj.correctAnswerText;
      }
      // Calculate and display final score with bonus if correct
      let finalScore = baseScore;
      if (i === correctIdx) {
        finalScore = Math.round(baseScore * 1.2);  // +20% bonus
        // Cap the final score at 120% for cases where baseScore was 100 (so it becomes 120)
        // Actually, allow going above 100% to show bonus effect
        answerFeedback.textContent += ` You earned a 20% bonus. Final Score: ${finalScore}%`;
      } else {
        answerFeedback.textContent += ` Final Score remains ${baseScore}%.`;
      }
      // Show continue button to go back to menu
      continueBtn.style.display = "inline-block";
    });
    li.appendChild(btn);
    optionsList.appendChild(li);
  });
}

// Event handlers for scenario start buttons
document.getElementById("start-car").addEventListener("click", () => startScenario("car"));
document.getElementById("start-salary").addEventListener("click", () => startScenario("salary"));
document.getElementById("start-ai").addEventListener("click", () => startScenario("ai"));

// Handle offer submission during negotiation
submitOfferBtn.addEventListener("click", () => {
  if (!currentScenario) return;
  const offerValue = parseInt(offerInput.value);
  if (isNaN(offerValue)) {
    return; // if no valid number entered, do nothing
  }
  // Append player's offer to dialogue
  appendDialogue("you", `£${offerValue}`);
  if (currentScenario === "car") {
    handleCarNegotiation(offerValue);
  } else if (currentScenario === "salary") {
    handleSalaryNegotiation(offerValue);
  } else if (currentScenario === "ai") {
    handleAINegotiation(offerValue);
  }
  // Clear input for next round
  offerInput.value = "";
});

// Car negotiation logic (offer/counter-offer)
function handleCarNegotiation(playerOffer) {
  const askPrice = scenariosConfig.car.initialAsk;
  const sellerMin = scenarioState.sellerMin;
  let round = scenarioState.round;
  if (round === 1) {
    if (playerOffer >= askPrice) {
      // Player meets or exceeds asking price -> instant accept
      appendDialogue("npc", "Deal! It's yours for that price.");
      // Finalize success
      // Calculate score (lower price is better for buyer)
      let score = Math.max(0, Math.min(100, Math.round(((askPrice - playerOffer) / (askPrice - sellerMin)) * 100)));
      finalizeNegotiation(true, playerOffer, score);
    } else if (playerOffer < sellerMin) {
      // Offer below minimum -> Seller reveals bottom line
      appendDialogue("npc", `I can't go that low. The lowest I'd consider is £${sellerMin}.`);
      appendDialogue("npc", "That's my final offer.");
      scenarioState.round = 2;
      scenarioState.thresholdRevealed = true;
    } else { 
      // Offer is within acceptable range but below ask -> counter-offer
      let counter;
      if (playerOffer >= askPrice * 0.96) {
        // If offer is very close to asking (within ~4%)
        counter = askPrice;  // seller holds at asking price
      } else {
        counter = Math.min(askPrice, playerOffer + 200);
      }
      appendDialogue("npc", `I can't let it go for £${playerOffer}. I can do £${counter}.`);
      scenarioState.lastCounter = counter;
      scenarioState.round = 2;
      scenarioState.thresholdRevealed = false;
    }
  } else if (round === 2) {
    if (scenarioState.thresholdRevealed) {
      // Threshold was revealed in round 1
      if (playerOffer < sellerMin) {
        appendDialogue("npc", "I told you £4500 is my final offer. No deal.");
        // Fail negotiation
        finalizeNegotiation(false, playerOffer, 0);
      } else {
        appendDialogue("npc", `Alright, we have a deal at £${playerOffer}.`);
        let score = Math.max(0, Math.min(100, Math.round(((askPrice - playerOffer) / (askPrice - sellerMin)) * 100)));
        finalizeNegotiation(true, playerOffer, score);
      }
    } else {
      // A counter was given in round 1
      const lastCounter = scenarioState.lastCounter;
      if (playerOffer >= lastCounter) {
        // Player met or exceeded seller's counter -> accept
        appendDialogue("npc", `Deal! I'll accept £${playerOffer}.`);
        let finalPrice = playerOffer;
        if (playerOffer > lastCounter) {
          finalPrice = lastCounter; // if player somehow offered more than counter, deal at counter price (no need to overpay)
        }
        let score = Math.max(0, Math.min(100, Math.round(((askPrice - finalPrice) / (askPrice - sellerMin)) * 100)));
        finalizeNegotiation(true, finalPrice, score);
      } else if (playerOffer < sellerMin) {
        // Player went below seller's minimum in second round (unlikely if first offer was above min, but just in case)
        appendDialogue("npc", "That's even worse. We are too far apart.");
        finalizeNegotiation(false, playerOffer, 0);
      } else if (playerOffer >= sellerMin && playerOffer < lastCounter) {
        // Player countered with a number still below seller's ask
        // Seller gives one final offer (midpoint or close to it)
        let finalCounter = Math.max(sellerMin, Math.floor((lastCounter + playerOffer) / 2));
        if (finalCounter < playerOffer) finalCounter = playerOffer;
        if (finalCounter > lastCounter) finalCounter = lastCounter;
        appendDialogue("npc", `Meet me halfway at £${finalCounter}. That's the lowest I'll go.`);
        scenarioState.lastCounter = finalCounter;
        scenarioState.round = 3;
      }
    }
  } else if (round === 3) {
    const lastCounter = scenarioState.lastCounter;
    if (playerOffer >= lastCounter) {
      appendDialogue("npc", `Alright. Deal at £${playerOffer}.`);
      let finalPrice = playerOffer;
      if (playerOffer > lastCounter) finalPrice = lastCounter;
      let score = Math.max(0, Math.min(100, Math.round(((askPrice - finalPrice) / (askPrice - sellerMin)) * 100)));
      finalizeNegotiation(true, finalPrice, score);
    } else {
      appendDialogue("npc", "If you can't meet my price, we have no deal.");
      finalizeNegotiation(false, playerOffer, 0);
    }
  }
}

// Salary negotiation logic
function handleSalaryNegotiation(playerRequest) {
  const initialOffer = scenariosConfig.salary.initialOffer;
  const maxOffer = scenarioState.managerMax;
  let round = scenarioState.round;
  if (round === 1) {
    if (playerRequest <= initialOffer) {
      // Player requested at or below initial offer -> manager accepts immediately
      appendDialogue("npc", `Alright. We can do £${playerRequest}.`);
      // If player undershot initial, company saves money - but negotiation ends
      let finalSalary = playerRequest;
      // Score: percentage of max raise achieved
      let score = Math.max(0, Math.min(100, Math.round(((finalSalary - initialOffer) / (maxOffer - initialOffer)) * 100)));
      finalizeNegotiation(true, finalSalary, score);
    } else if (playerRequest > maxOffer) {
      // Request above what manager can approve
      appendDialogue("npc", `That's more than we can offer. The most I can do is £${maxOffer}.`);
      scenarioState.round = 2;
      scenarioState.maxRevealed = true;
    } else {
      // Within possible range but higher than initial -> counter
      let counter;
      if (playerRequest >= maxOffer * 0.96) {
        // If request is very close to max
        counter = maxOffer - 0; // manager might reveal near max
        counter = maxOffer * 1; // ensure number
      } else {
        // Offer a bit above initial but below player's request
        counter = Math.max(initialOffer, playerRequest - 2000);
      }
      if (counter < initialOffer) counter = initialOffer;
      appendDialogue("npc", `We were thinking more along the lines of £${counter}.`);
      scenarioState.lastCounter = counter;
      scenarioState.round = 2;
      scenarioState.maxRevealed = false;
    }
  } else if (round === 2) {
    if (scenarioState.maxRevealed) {
      // Manager had revealed max
      if (playerRequest > maxOffer) {
        appendDialogue("npc", "I'm sorry, we can't go any higher than that.");
        finalizeNegotiation(false, playerRequest, 0);
      } else {
        appendDialogue("npc", `Deal. £${playerRequest} it is.`);
        let finalSalary = playerRequest;
        let score = Math.max(0, Math.min(100, Math.round(((finalSalary - initialOffer) / (maxOffer - initialOffer)) * 100)));
        finalizeNegotiation(true, finalSalary, score);
      }
    } else {
      // Manager had given a counter in round 1
      const lastCounter = scenarioState.lastCounter;
      if (playerRequest <= lastCounter) {
        // Player came down to manager's offer or below -> accept
        appendDialogue("npc", `Great. We have an agreement at £${playerRequest}.`);
        let finalSalary = playerRequest;
        if (playerRequest < lastCounter) {
          finalSalary = playerRequest; // company pays even less if candidate went under? (Candidate wouldn't usually do this, but we'll honor the lower number.)
        }
        let score = Math.max(0, Math.min(100, Math.round(((finalSalary - initialOffer) / (maxOffer - initialOffer)) * 100)));
        finalizeNegotiation(true, finalSalary, score);
      } else if (playerRequest > maxOffer) {
        appendDialogue("npc", "We cannot meet that request. It exceeds our limit.");
        finalizeNegotiation(false, playerRequest, 0);
      } else if (playerRequest > lastCounter && playerRequest <= maxOffer) {
        // Player still wants more than manager's counter but not above max
        // Manager makes a final offer (e.g., midpoint or max if close)
        let finalOffer = Math.min(maxOffer, Math.floor((lastCounter + playerRequest) / 2));
        if (finalOffer < lastCounter) finalOffer = lastCounter;
        if (finalOffer > playerRequest) finalOffer = playerRequest;
        appendDialogue("npc", `How about £${finalOffer}? That's our final offer.`);
        scenarioState.lastCounter = finalOffer;
        scenarioState.round = 3;
      }
    }
  } else if (round === 3) {
    const lastCounter = scenarioState.lastCounter;
    if (playerRequest <= lastCounter) {
      appendDialogue("npc", `Done. £${playerRequest} it is.`);
      let finalSalary = playerRequest;
      let score = Math.max(0, Math.min(100, Math.round(((finalSalary - initialOffer) / (maxOffer - initialOffer)) * 100)));
      finalizeNegotiation(true, finalSalary, score);
    } else {
      appendDialogue("npc", "It seems we can't reach an agreement on that number.");
      finalizeNegotiation(false, playerRequest, 0);
    }
  }
}

// AI negotiation logic
function handleAINegotiation(playerOffer) {
  const demand = scenariosConfig.ai.demand;
  const minReq = scenarioState.minRequired;
  let round = scenarioState.round;
  if (round === 1) {
    if (playerOffer >= demand) {
      // Gave full or more than demanded
      appendDialogue("npc", "Agreement accepted. You have given me what I want.");
      if (playerOffer > demand) {
        appendDialogue("npc", "You even offered more than I asked... interesting.");
      }
      // Success, but user conceded everything
      let finalUnits = playerOffer;
      if (playerOffer > demand) finalUnits = demand;
      // Score: how much less than full demand was given (less is better for human)
      let score = Math.max(0, Math.min(100, Math.round(((demand - finalUnits) / (demand - minReq)) * 100)));
      finalizeNegotiation(true, finalUnits, score);
    } else if (playerOffer < minReq) {
      // Too low
      appendDialogue("npc", `Insufficient. I require at least ${minReq} units.`);
      appendDialogue("npc", "Anything less and there's no deal.");
      scenarioState.round = 2;
      scenarioState.minRevealed = true;
    } else {
      // Within range but below demand -> AI counters with a demand
      let counterDemand;
      if (playerOffer <= minReq + 5) {
        // If offer just above minimum, AI still high demands
        counterDemand = Math.floor((playerOffer + demand) / 2); // somewhere mid
      } else {
        counterDemand = playerOffer + 15;
      }
      if (counterDemand > demand) counterDemand = demand;
      if (counterDemand < minReq) counterDemand = minReq;
      scenarioState.lastDemand = counterDemand;
      appendDialogue("npc", `Your offer is not enough. I need ${counterDemand} units of power.`);
      scenarioState.round = 2;
      scenarioState.minRevealed = false;
    }
  } else if (round === 2) {
    if (scenarioState.minRevealed) {
      // AI revealed minimum requirement
      if (playerOffer < minReq) {
        appendDialogue("npc", "You have failed to meet my minimum requirements. Negotiation over.");
        finalizeNegotiation(false, playerOffer, 0);
      } else {
        appendDialogue("npc", `Acceptable. I will settle for ${playerOffer} units.`);
        let finalUnits = playerOffer;
        let score = Math.max(0, Math.min(100, Math.round(((demand - finalUnits) / (demand - minReq)) * 100)));
        finalizeNegotiation(true, finalUnits, score);
      }
    } else {
      const lastDemand = scenarioState.lastDemand;
      if (playerOffer >= lastDemand) {
        appendDialogue("npc", `Very well. I accept ${playerOffer} units.`);
        let finalUnits = playerOffer;
        if (playerOffer > lastDemand) finalUnits = lastDemand;
        let score = Math.max(0, Math.min(100, Math.round(((demand - finalUnits) / (demand - minReq)) * 100)));
        finalizeNegotiation(true, finalUnits, score);
      } else if (playerOffer < minReq) {
        appendDialogue("npc", "This offer is unacceptable. You have wasted my time.");
        finalizeNegotiation(false, playerOffer, 0);
      } else if (playerOffer >= minReq && playerOffer < lastDemand) {
        // AI gives final compromise demand
        let finalDemand = Math.max(minReq, Math.floor((lastDemand + playerOffer) / 2));
        if (finalDemand < playerOffer) finalDemand = playerOffer;
        if (finalDemand > lastDemand) finalDemand = lastDemand;
        appendDialogue("npc", `I will compromise at ${finalDemand} units. This is my final offer.`);
        scenarioState.lastDemand = finalDemand;
        scenarioState.round = 3;
      }
    }
  } else if (round === 3) {
    const lastDemand = scenarioState.lastDemand;
    if (playerOffer >= lastDemand) {
      appendDialogue("npc", `Agreement reached at ${playerOffer} units.`);
      let finalUnits = playerOffer;
      if (playerOffer > lastDemand) finalUnits = lastDemand;
      let score = Math.max(0, Math.min(100, Math.round(((demand - finalUnits) / (demand - minReq)) * 100)));
      finalizeNegotiation(true, finalUnits, score);
    } else {
      appendDialogue("npc", "Negotiations have failed. You leave me no choice.");
      finalizeNegotiation(false, playerOffer, 0);
    }
  }
}

// Back to menu: reset to main menu view
function backToMenu() {
  // Hide game section, show menu
  gameDiv.style.display = "none";
  menuDiv.style.display = "block";
  // Clear any dynamic content for a fresh start
  dialogueDiv.innerHTML = "";
  outcomeDiv.textContent = "";
  bonusQuestionDiv.style.display = "none";
  answerFeedback.textContent = "";
  continueBtn.style.display = "none";
  // Reset current scenario
  currentScenario = null;
  scenarioState = {};
}

// Back button (abort or return to menu)
backBtn.addEventListener("click", () => {
  backToMenu();
});

// Continue button after bonus question, also returns to menu
continueBtn.addEventListener("click", () => {
  backToMenu();
});
