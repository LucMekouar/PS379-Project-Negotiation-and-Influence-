// Negotiation Master game script

// Global state
let currentScenario = null;
let scenarioData = null;
let partnerOffer = null;
let partnerFinalOfferMade = false;
let partnerFinalValue = null;
let userOfferCount = 0;
let score = 0;  // total score, primarily for bonus points

// Scenario definitions with expanded bonus question banks
const scenarios = {
  salary: {
    name: "Salary Negotiation",
    partnerName: "Employer",
    initialOffer: 30000,
    maxOffer: 35000,
    questions: [
      {
        question: "What does the term '3D negotiation' refer to?",
        options: [
          "Using three separate negotiation tactics one after the other.",
          "A negotiation involving three or more parties at the table.",
          "Negotiating beyond the table by also shaping the setup and deal design (negotiating away from the table).",
          "A negotiation method that focuses on three critical factors only."
        ],
        correct: 2
      },
      {
        question: "In negotiation, what does the concept of System 1 vs System 2 thinking describe?",
        options: [
          "Using two negotiation approaches: one competitive (System 1) and one cooperative (System 2).",
          "The difference between intuitive, automatic thinking (System 1) and deliberate, analytical thinking (System 2).",
          "Having a backup negotiator (System 2) to take over if the primary (System 1) fails.",
          "A strategy where one party makes the first offer (System 1) and the other party responds (System 2)."
        ],
        correct: 1
      },
      {
        question: "Which of the following best describes 'leverage' in a negotiation?",
        options: [
          "Strictly sticking to your initial position throughout the negotiation.",
          "Using persuasive techniques and emotional appeals.",
          "The power or advantage one side has to influence the outcome in their favor.",
          "Offering incentives or concessions to get the other side to agree."
        ],
        correct: 2
      },
      {
        question: "What is a key characteristic of interest-based (principled) bargaining?",
        options: [
          "Insisting on your demands until the other side concedes.",
          "Focusing on underlying interests and seeking win-win solutions.",
          "Making compromises without discussing the reasons behind positions.",
          "Keeping your real goals hidden from the other party."
        ],
        correct: 1
      },
      {
        question: "What is 'anchoring' in the context of negotiation?",
        options: [
          "Refusing to move away from an initial offer once it's made.",
          "The first offer or piece of information sets a reference point that skews the rest of the negotiation.",
          "Staying focused on one issue to avoid confusion in talks.",
          "Establishing a friendly rapport before getting to numbers."
        ],
        correct: 1
      }
    ]
  },
  car: {
    name: "Car Price Negotiation",
    partnerName: "Seller",
    initialOffer: 10000,
    minPrice: 8000,
    questions: [
      {
        question: "What does the term '3D negotiation' refer to?",
        options: [
          "Using three separate negotiation tactics one after the other.",
          "A negotiation involving three or more parties at the table.",
          "Negotiating beyond the table by also shaping the setup and deal design (negotiating away from the table).",
          "A negotiation method that focuses on three critical factors only."
        ],
        correct: 2
      },
      {
        question: "In negotiation, what does the concept of System 1 vs System 2 thinking describe?",
        options: [
          "Using two negotiation approaches: one competitive (System 1) and one cooperative (System 2).",
          "The difference between intuitive, automatic thinking (System 1) and deliberate, analytical thinking (System 2).",
          "Having a backup negotiator (System 2) to take over if the primary (System 1) fails.",
          "A strategy where one party makes the first offer (System 1) and the other party responds (System 2)."
        ],
        correct: 1
      },
      {
        question: "Which of the following best describes 'leverage' in a negotiation?",
        options: [
          "Strictly sticking to your initial position throughout the negotiation.",
          "Using persuasive techniques and emotional appeals.",
          "The power or advantage one side has to influence the outcome in their favor.",
          "Offering incentives or concessions to get the other side to agree."
        ],
        correct: 2
      },
      {
        question: "What is a key characteristic of interest-based (principled) bargaining?",
        options: [
          "Insisting on your demands until the other side concedes.",
          "Focusing on underlying interests and seeking win-win solutions.",
          "Making compromises without discussing the reasons behind positions.",
          "Keeping your real goals hidden from the other party."
        ],
        correct: 1
      },
      {
        question: "What is 'anchoring' in the context of negotiation?",
        options: [
          "Refusing to move away from an initial offer once it's made.",
          "The first offer or piece of information sets a reference point that skews the rest of the negotiation.",
          "Staying focused on one issue to avoid confusion in talks.",
          "Establishing a friendly rapport before getting to numbers."
        ],
        correct: 1
      }
    ]
  }
};

// Get DOM elements
const scenarioSelectionDiv = document.getElementById('scenarioSelection');
const negotiationInterfaceDiv = document.getElementById('negotiationInterface');
const scenarioTitle = document.getElementById('scenarioTitle');
const dialogueDiv = document.getElementById('dialogue');
const offerInput = document.getElementById('offerInput');
const negotiateButton = document.getElementById('negotiateButton');
const acceptButton = document.getElementById('acceptButton');
const bonusOverlay = document.getElementById('bonusOverlay');
const bonusQuestionText = document.getElementById('bonusQuestionText');
const bonusOptionsDiv = document.getElementById('bonusOptions');
const bonusFeedback = document.getElementById('bonusFeedback');
const closeBonusBtn = document.getElementById('closeBonusBtn');

// Start the selected scenario
function startScenario(scenarioKey) {
  currentScenario = scenarioKey;
  scenarioData = scenarios[scenarioKey];
  userOfferCount = 0;
  partnerFinalOfferMade = false;
  partnerFinalValue = null;
  // Show negotiation interface for the chosen scenario
  scenarioTitle.textContent = scenarioData.name;
  scenarioSelectionDiv.style.display = 'none';
  negotiationInterfaceDiv.style.display = 'block';
  // Configure input field and buttons based on scenario
  if (scenarioKey === 'salary') {
    // Salary scenario: hide input until 'Negotiate Salary' is clicked
    offerInput.value = '';
    offerInput.placeholder = 'Propose your salary in £';
    offerInput.style.display = 'none';
    negotiateButton.textContent = 'Negotiate Salary';
  } else if (scenarioKey === 'car') {
    // Car scenario: input visible from start
    offerInput.value = '';
    offerInput.placeholder = 'Enter your car offer in £';
    offerInput.style.display = 'inline-block';
    negotiateButton.textContent = 'Submit Offer';
  }
  // Ensure Accept button is visible and enabled from the start
  acceptButton.style.display = 'inline-block';
  acceptButton.disabled = false;
  // Clear dialogue and show partner's initial offer
  dialogueDiv.innerHTML = '';
  partnerOffer = scenarioData.initialOffer;
  if (scenarioKey === 'salary') {
    displayMessage(scenarioData.partnerName + ": I can offer you £" + partnerOffer + " as a starting salary.");
  } else if (scenarioKey === 'car') {
    displayMessage(scenarioData.partnerName + ": I'm asking £" + partnerOffer + " for the car.");
  }
}

// Utility: display a message in the dialogue area
function displayMessage(text) {
  const p = document.createElement('p');
  p.textContent = text;
  dialogueDiv.appendChild(p);
  // Auto-scroll to bottom for new messages
  dialogueDiv.scrollTop = dialogueDiv.scrollHeight;
}

// Process the user's offer when they submit a proposal
function processUserOffer() {
  const offerValue = parseInt(offerInput.value);
  if (isNaN(offerValue) || offerValue <= 0) {
    alert('Please enter a valid number for your offer.');
    return;
  }
  const userOffer = offerValue;
  displayMessage("You: I propose £" + userOffer + ".");
  userOfferCount++;
  // Partner responds based on scenario logic
  if (currentScenario === 'salary') {
    handleSalaryCounter(userOffer);
  } else if (currentScenario === 'car') {
    handleCarCounter(userOffer);
  }
  // Clear the input field for the next round
  offerInput.value = '';
}

// Handle the partner's counter-offer logic for the salary scenario
function handleSalaryCounter(userOffer) {
  const maxOffer = scenarioData.maxOffer;
  if (userOffer > maxOffer) {
    // User asks for more than employer's maximum
    partnerOffer = maxOffer;
    partnerFinalOfferMade = true;
    partnerFinalValue = maxOffer;
    displayMessage(scenarioData.partnerName + ": I'm sorry, we cannot go to £" + userOffer + ". The highest we can offer is £" + partnerOffer + ".");
    // User can now only accept or counter (if counter above this again, it will be no deal)
    return;
  }
  // User's offer is within the employer's limit
  if (!partnerFinalOfferMade) {
    // If user offered less or equal to current offer (unexpected in salary negotiation), employer accepts (cheaper for them)
    if (userOffer <= partnerOffer) {
      displayMessage(scenarioData.partnerName + ": Alright, we accept £" + userOffer + ".");
      partnerOffer = userOffer;
      endNegotiation(true, partnerOffer);
      return;
    }
    // User offered more than current offer but <= maxOffer
    const difference = userOffer - partnerOffer;
    if (difference <= partnerOffer * 0.05) {
      // If the counter is only slightly higher, employer accepts the proposal
      displayMessage(scenarioData.partnerName + ": We can agree to £" + userOffer + ". You've got a deal.");
      partnerOffer = userOffer;
      endNegotiation(true, partnerOffer);
    } else {
      // Otherwise, employer counters with a higher offer (halfway toward user's offer, capped at maxOffer)
      let counterOffer = partnerOffer + Math.round(difference / 2);
      if (counterOffer > maxOffer) {
        counterOffer = maxOffer;
      }
      partnerOffer = counterOffer;
      if (partnerOffer >= userOffer) {
        // This counter meets or exceeds user's ask (user's ask was very close to maxOffer)
        partnerOffer = userOffer;
        displayMessage(scenarioData.partnerName + ": We can agree to £" + partnerOffer + ".");
        endNegotiation(true, partnerOffer);
      } else {
        if (partnerOffer === maxOffer) {
          // Reached max offer, mark as final offer
          partnerFinalOfferMade = true;
          partnerFinalValue = partnerOffer;
          displayMessage(scenarioData.partnerName + ": The highest we can go is £" + partnerOffer + ".");
        } else {
          // Regular counter-offer (not final yet)
          displayMessage(scenarioData.partnerName + ": How about £" + partnerOffer + "?");
        }
        // Continue negotiation (user can accept or counter again)
      }
    }
  } else {
    // Employer had already made a final offer, and user countered again
    if (userOffer <= partnerFinalValue) {
      // User came down to or below employer's final offer, employer accepts this offer
      partnerOffer = userOffer;
      displayMessage(scenarioData.partnerName + ": Alright, we can do £" + userOffer + ". Deal.");
      endNegotiation(true, partnerOffer);
    } else {
      // User still above final limit -> no deal
      displayMessage(scenarioData.partnerName + ": I’m sorry, £" + partnerFinalValue + " was our final offer. We cannot reach a deal.");
      endNegotiation(false, null);
    }
  }
}

// Handle the partner's counter-offer logic for the car scenario
function handleCarCounter(userOffer) {
  const minPrice = scenarioData.minPrice;
  if (userOffer < minPrice) {
    // User offers below seller's minimum price
    partnerOffer = minPrice;
    partnerFinalOfferMade = true;
    partnerFinalValue = minPrice;
    displayMessage(scenarioData.partnerName + ": I can't go that low. The lowest I'll accept is £" + partnerOffer + ".");
    return;
  }
  if (!partnerFinalOfferMade) {
    if (userOffer >= partnerOffer) {
      // User agrees to current price (or offers more)
      displayMessage(scenarioData.partnerName + ": Deal! I'll sell it for £" + userOffer + ".");
      partnerOffer = userOffer;
      endNegotiation(true, partnerOffer);
    } else {
      // User offers lower than current price but above minPrice
      const difference = partnerOffer - userOffer;
      if (difference <= partnerOffer * 0.05) {
        // If the counter is only slightly below, seller accepts the offer
        displayMessage(scenarioData.partnerName + ": Alright, it's a deal at £" + userOffer + ".");
        partnerOffer = userOffer;
        endNegotiation(true, partnerOffer);
      } else {
        // Otherwise, seller counters by lowering the price (halfway towards user's offer, not below minPrice)
        let counterOffer = partnerOffer - Math.round(difference / 2);
        if (counterOffer < minPrice) {
          counterOffer = minPrice;
        }
        partnerOffer = counterOffer;
        if (partnerOffer <= userOffer) {
          // Counter ended up at or below user's offer (user's offer was close to minPrice)
          partnerOffer = userOffer;
          displayMessage(scenarioData.partnerName + ": Alright, I can accept £" + partnerOffer + ".");
          endNegotiation(true, partnerOffer);
        } else {
          if (partnerOffer === minPrice) {
            // Reached min price, mark as final
            partnerFinalOfferMade = true;
            partnerFinalValue = partnerOffer;
            displayMessage(scenarioData.partnerName + ": I can't go lower than £" + partnerOffer + ".");
          } else {
            // Regular counter-offer
            displayMessage(scenarioData.partnerName + ": How about £" + partnerOffer + "?");
          }
          // Continue negotiation
        }
      }
    }
  } else {
    // Seller had given a final lowest price, and user countered again
    if (userOffer >= partnerFinalValue) {
      // User came up to (or above) the final price, seller accepts
      partnerOffer = userOffer;
      displayMessage(scenarioData.partnerName + ": Alright, you've got a deal at £" + userOffer + ".");
      endNegotiation(true, partnerOffer);
    } else {
      // User still below final price -> no deal
      displayMessage(scenarioData.partnerName + ": £" + partnerFinalValue + " is my final price. We cannot make a deal if you won't meet that.");
      endNegotiation(false, null);
    }
  }
}

// Conclude the negotiation and trigger the bonus question
function endNegotiation(success, dealValue) {
  if (success) {
    displayMessage("*** Negotiation successful! Deal reached at £" + dealValue + ". ***");
  } else {
    displayMessage("*** Negotiation ended with no deal. ***");
  }
  // After a short pause, present a bonus question
  setTimeout(showBonusQuestion, 1000);
}

// Show a bonus question in a centered overlay
function showBonusQuestion() {
  // Pick a random question from the current scenario's bonus bank
  const questions = scenarioData.questions;
  const questionObj = questions[Math.floor(Math.random() * questions.length)];
  bonusQuestionText.textContent = questionObj.question;
  // Reset options and feedback display
  bonusOptionsDiv.innerHTML = '';
  bonusFeedback.textContent = '';
  closeBonusBtn.style.display = 'none';
  // Generate option buttons for the question
  const optionButtons = [];
  questionObj.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = function() {
      // Disable all options after an answer is selected
      optionButtons.forEach(b => b.disabled = true);
      // Highlight the correct answer
      optionButtons[questionObj.correct].classList.add('correct');
      if (idx === questionObj.correct) {
        // Correct answer chosen
        bonusFeedback.textContent = `Correct! The correct answer is "${questionObj.options[questionObj.correct]}". +10 bonus points.`;
        score += 10;
      } else {
        // Incorrect answer chosen
        this.classList.add('incorrect');
        bonusFeedback.textContent = `Incorrect. The correct answer was "${questionObj.options[questionObj.correct]}". +0 points.`;
      }
      // Show the continue button to close the overlay
      closeBonusBtn.style.display = 'inline-block';
    };
    bonusOptionsDiv.appendChild(btn);
    optionButtons.push(btn);
  });
  // Display the bonus question overlay
  bonusOverlay.style.display = 'flex';
}a

// Close the bonus overlay and reset the game interface
closeBonusBtn.addEventListener('click', function() {
  bonusOverlay.style.display = 'none';
  // Return to scenario selection for another play
  negotiationInterfaceDiv.style.display = 'none';
  scenarioSelectionDiv.style.display = 'block';
});

// Event listeners for negotiation actions
negotiateButton.addEventListener('click', function() {
  if (currentScenario === 'salary' && offerInput.style.display === 'none') {
    // On first click in salary scenario, reveal the input field
    offerInput.style.display = 'inline-block';
    offerInput.focus();
    negotiateButton.textContent = 'Submit Offer';
  } else {
    // Otherwise, treat click as submitting the offer (car scenario or salary after input shown)
    processUserOffer();
  }
});

acceptButton.addEventListener('click', function() {
  // User accepts the current partner offer at any time
  displayMessage("You: I accept £" + partnerOffer + ".");
  endNegotiation(true, partnerOffer);
});
