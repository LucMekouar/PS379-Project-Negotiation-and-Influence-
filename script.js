// Negotiation Master game script

// DOM element references
const scenarioSelectDiv = document.getElementById('scenarioSelect');
const negotiationContainer = document.getElementById('negotiationContainer');
const scenarioTitle = document.getElementById('scenarioTitle');
const logDiv = document.getElementById('log');
const offerInput = document.getElementById('offerInput');
const submitBtn = document.getElementById('submitOffer');
const bonusModal = document.getElementById('bonusModal');
const bonusQuestionText = document.getElementById('bonusQuestionText');
const bonusOptionsDiv = document.getElementById('bonusOptions');
const bonusFeedback = document.getElementById('bonusFeedback');
const continueBtn = document.getElementById('continueBtn');

// Game state variables
let currentScenario = null;
let stageCount = 0;
let negotiationActive = false;
let baseScore = 0;       // base score before bonus
let bonusEarned = false; // whether the bonus question was answered correctly

// Negotiation parameters for scenarios
const carInitialPrice = 20000;
const carDealerMin = 17000;
const salaryInitialOffer = 50000;
const salaryMaxOffer = 60000;
const aiInitialDemand = 1000;
const aiMinDemand = 500;
let finalOutcomeValue = 0; // final agreed price/salary/units in the negotiation

// Bonus questions pool (5 questions on negotiation concepts)
const bonusQuestions = [
    {
        question: "What does BATNA stand for?",
        options: [
            "Best Alternative To a Negotiated Agreement",
            "Best Advantageous Tactic for Negotiation Agreements",
            "Basic Agreement for Negotiation Analysis",
            "Business Agreement Terms and Negotiation Arrangement"
        ],
        correctIndex: 0
    },
    {
        question: "What does ZOPA stand for in negotiation?",
        options: [
            "Zone Of Possible Agreement",
            "Zero-Sum or Positive Agreement",
            "Zonal Offer and Price Agreement",
            "Zone of Private Agreement"
        ],
        correctIndex: 0
    },
    {
        question: "Integrative negotiation is often characterized as:",
        options: [
            "Win-win",
            "Win-lose",
            "Lose-lose",
            "Fixed pie"
        ],
        correctIndex: 0
    },
    {
        question: "Which of the following is a good practice in negotiation?",
        options: [
            "Knowing your BATNA before you negotiate",
            "Revealing your bottom line at the start",
            "Getting highly emotional to show seriousness",
            "Making an ultimatum as your first move"
        ],
        correctIndex: 0
    },
    {
        question: "In an integrative negotiation, the parties aim to:",
        options: [
            "Expand the pie (create value for everyone)",
            "Claim the biggest slice of the pie",
            "Focus only on a single issue",
            "Outsmart and pressure the opponent"
        ],
        correctIndex: 0
    }
];

// Utility function to append a message to the log
function logMessage(text, className = '') {
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    logDiv.appendChild(p);
    // Auto-scroll to the bottom of the log
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Start the selected scenario
function startScenario(scenario) {
    // Set current scenario and initialize state
    currentScenario = scenario;
    stageCount = 1;
    negotiationActive = true;
    bonusEarned = false;
    baseScore = 0;
    finalOutcomeValue = 0;

    // Reset and show the negotiation UI
    scenarioSelectDiv.style.display = 'none';
    negotiationContainer.style.display = 'block';
    logDiv.innerHTML = '';        // clear previous messages
    offerInput.value = '';        // clear previous input
    offerInput.disabled = false;
    submitBtn.disabled = false;

    // Set scenario title and input placeholder based on scenario
    if (scenario === 'car') {
        scenarioTitle.textContent = 'Scenario: Buying a Car';
        offerInput.placeholder = 'Enter your price offer (GBP)';
        // Initial message from the car dealer
        logMessage("Dealer: The car is priced at £" + carInitialPrice + ".", 'opponent-msg');
        logMessage("(Try negotiating a lower price!)");
    } else if (scenario === 'salary') {
        scenarioTitle.textContent = 'Scenario: Salary Negotiation';
        offerInput.placeholder = 'Enter your salary request (GBP)';
        // Initial message from the boss/HR
        logMessage("Boss: We can offer you £" + salaryInitialOffer + " as a starting salary.", 'opponent-msg');
        logMessage("(Negotiate for a higher salary if you can!)");
    } else if (scenario === 'ai') {
        scenarioTitle.textContent = 'Scenario: Rogue AI Negotiation';
        offerInput.placeholder = 'Enter your offer (units)';
        // Initial message from the Rogue AI
        logMessage("AI: I demand " + aiInitialDemand + " units of computing power or I'll wreak some havoc.", 'opponent-msg');
        logMessage("(The AI seems serious. Try to negotiate down the number of units.)");
    }
}

// Handle the user's offer submission for the current scenario
function handleOffer() {
    if (!negotiationActive) {
        return; // ignore input if no active negotiation
    }
    let offer = parseInt(offerInput.value);
    if (isNaN(offer)) {
        // If input is not a number, do nothing (could alert user)
        return;
    }
    // Log the player's offer in the conversation
    let offerText = '';
    if (currentScenario === 'car' || currentScenario === 'salary') {
        // Format currency for car/salary
        offerText = "You: £" + offer.toLocaleString();
    } else if (currentScenario === 'ai') {
        offerText = "You: " + offer + " units";
    }
    logMessage(offerText, 'user-msg');
    offerInput.value = '';  // clear input field for next entry

    // Process the offer based on the current scenario and stage
    if (currentScenario === 'car') {
        // Car negotiation logic
        if (stageCount === 1) {
            // First offer from user
            if (offer >= carInitialPrice) {
                // User is willing to pay at or above asking price
                if (offer > carInitialPrice) {
                    logMessage("Dealer: Deal! I'll happily sell it for £" + offer.toLocaleString() + " (above asking price!).", 'opponent-msg');
                } else {
                    logMessage("Dealer: Deal! £" + offer.toLocaleString() + " it is.", 'opponent-msg');
                }
                finalOutcomeValue = offer;
                // End negotiation successfully, calculate score and trigger bonus
                // Calculate negotiation score (higher for lower price paid)
                let pricePaid = finalOutcomeValue;
                // Score: higher price = lower score
                baseScore = ((carInitialPrice - pricePaid) / (carInitialPrice - carDealerMin)) * 100;
                if (baseScore < 0) baseScore = 0;
                baseScore = Math.round(baseScore);
                finishNegotiation();
                return;
            } else if (offer < carDealerMin) {
                // Offer is below dealer's minimum acceptable price
                logMessage("Dealer: I'm sorry, I can't go that low. The lowest I'll go is £" + carDealerMin.toLocaleString() + ".", 'opponent-msg');
                // Dealer has given final price (bottom line)
                stageCount = 2;
            } else if (offer === carDealerMin) {
                // User offers exactly the minimum the dealer will accept
                logMessage("Dealer: You drive a hard bargain... Alright, £" + carDealerMin.toLocaleString() + " and it's a deal.", 'opponent-msg');
                finalOutcomeValue = offer;
                // End negotiation (deal closed at threshold price)
                let pricePaid = finalOutcomeValue;
                baseScore = ((carInitialPrice - pricePaid) / (carInitialPrice - carDealerMin)) * 100;
                if (baseScore < 0) baseScore = 0;
                baseScore = Math.round(baseScore);
                finishNegotiation();
                return;
            } else {
                // Offer is within possible range (>= min but < initial) - negotiate further
                // Dealer makes a counter-offer roughly halfway between offer and initial price
                let counterOffer = Math.round((offer + carInitialPrice) / 2);
                if (counterOffer < carDealerMin) counterOffer = carDealerMin;
                logMessage("Dealer: How about £" + counterOffer.toLocaleString() + "?", 'opponent-msg');
                // Move to next stage (await user's counter-offer)
                stageCount = 2;
            }
        } else if (stageCount === 2) {
            // Second offer from user (after dealer's counter or final offer)
            if (offer < carDealerMin) {
                // User still below minimum after dealer's final offer
                logMessage("Dealer: I told you, I can't go below £" + carDealerMin.toLocaleString() + ". No deal.", 'opponent-msg');
                // Negotiation failed
                finalOutcomeValue = null;
                baseScore = 0;
                finishNegotiation();
                return;
            }
            // Check if dealer's last statement was a final lowest price offer
            if (logDiv.lastChild.textContent.includes("lowest I'll go is")) {
                // Dealer's last message was a final lowest price
                if (offer >= carDealerMin) {
                    // User meets or exceeds the final price
                    logMessage("Dealer: Deal! £" + Math.max(offer, carDealerMin).toLocaleString() + " is acceptable.", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let pricePaid = finalOutcomeValue;
                    baseScore = ((carInitialPrice - pricePaid) / (carInitialPrice - carDealerMin)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                }
            } else {
                // Dealer's last message was a counter-offer (not final yet)
                // Extract the last counter-offer value from dealer's message
                let lastMsg = logDiv.lastChild.textContent;
                let dealerCounter = null;
                if (lastMsg.includes("How about £")) {
                    dealerCounter = parseInt(lastMsg.split("How about £")[1].replace(/[^0-9]/g, ''));
                }
                if (dealerCounter === null) {
                    dealerCounter = carDealerMin; // fallback to minimum
                }
                if (offer >= dealerCounter) {
                    // User accepts or goes above dealer's counter
                    logMessage("Dealer: Great, we have a deal at £" + offer.toLocaleString() + ".", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let pricePaid = finalOutcomeValue;
                    baseScore = ((carInitialPrice - pricePaid) / (carInitialPrice - carDealerMin)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                } else if (offer >= carDealerMin) {
                    // User offers between dealer's counter and dealer's minimum
                    logMessage("Dealer: Alright, I'll accept £" + offer.toLocaleString() + ".", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let pricePaid = finalOutcomeValue;
                    baseScore = ((carInitialPrice - pricePaid) / (carInitialPrice - carDealerMin)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                } else {
                    // (This case would be offer < carDealerMin, handled above)
                    logMessage("Dealer: No, £" + offer.toLocaleString() + " is below my limit. No deal.", 'opponent-msg');
                    finalOutcomeValue = null;
                    baseScore = 0;
                    finishNegotiation();
                    return;
                }
            }
        }
    } else if (currentScenario === 'salary') {
        // Salary negotiation logic
        if (stageCount === 1) {
            // First salary request from user
            if (offer <= salaryInitialOffer) {
                // User asks for no more than the initial offer (or even less)
                if (offer < salaryInitialOffer) {
                    logMessage("Boss: Alright. We can definitely do £" + offer.toLocaleString() + ".", 'opponent-msg');
                    logMessage("(You settled for less than the initial offer.)");
                } else {
                    logMessage("Boss: Sure, £" + offer.toLocaleString() + " works for us.", 'opponent-msg');
                }
                finalOutcomeValue = offer;
                // End negotiation (deal at offered salary)
                // Calculate negotiation score (higher for higher salary)
                let salary = finalOutcomeValue;
                baseScore = ((salary - salaryInitialOffer) / (salaryMaxOffer - salaryInitialOffer)) * 100;
                if (baseScore < 0) baseScore = 0;
                baseScore = Math.round(baseScore);
                finishNegotiation();
                return;
            } else if (offer > salaryMaxOffer) {
                // User asks for more than the company can pay
                logMessage("Boss: We can't go that high. The most we could offer is £" + salaryMaxOffer.toLocaleString() + ".", 'opponent-msg');
                // Boss has effectively given a final cap
                stageCount = 2;
            } else {
                // User's request is within the possible range, but above initial
                let counterOffer = Math.round((offer + salaryInitialOffer) / 2);
                if (counterOffer > salaryMaxOffer) counterOffer = salaryMaxOffer;
                logMessage("Boss: We can offer £" + counterOffer.toLocaleString() + ".", 'opponent-msg');
                stageCount = 2;
            }
        } else if (stageCount === 2) {
            // Second offer from user (after boss's response)
            if (offer > salaryMaxOffer) {
                // User still demands above max
                logMessage("Boss: I'm sorry, we cannot exceed £" + salaryMaxOffer.toLocaleString() + ". We have no deal.", 'opponent-msg');
                finalOutcomeValue = null;
                baseScore = 0;
                finishNegotiation();
                return;
            }
            // Check if boss's last response was final maximum or just a counter
            let lastMsg = logDiv.lastChild.textContent;
            if (lastMsg.includes("most we could offer") || lastMsg.includes("cannot exceed")) {
                // Boss had given a final max offer
                if (offer <= salaryMaxOffer) {
                    logMessage("Boss: Alright, we can agree to £" + offer.toLocaleString() + ".", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let salary = finalOutcomeValue;
                    baseScore = ((salary - salaryInitialOffer) / (salaryMaxOffer - salaryInitialOffer)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                }
            } else {
                // Boss's last message was a counter-offer
                // Extract boss's counter-offer value from last message
                let bossCounter = null;
                if (lastMsg.includes("offer £")) {
                    bossCounter = parseInt(lastMsg.split("offer £")[1].replace(/[^0-9]/g, ''));
                }
                if (bossCounter === null) bossCounter = salaryMaxOffer;
                if (offer <= bossCounter) {
                    // User accepted or went below boss's counter
                    logMessage("Boss: Great, £" + offer.toLocaleString() + " it is.", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let salary = finalOutcomeValue;
                    baseScore = ((salary - salaryInitialOffer) / (salaryMaxOffer - salaryInitialOffer)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                } else if (offer <= salaryMaxOffer) {
                    // User still asks above boss's counter but within max budget
                    logMessage("Boss: We can agree to £" + offer.toLocaleString() + ".", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let salary = finalOutcomeValue;
                    baseScore = ((salary - salaryInitialOffer) / (salaryMaxOffer - salaryInitialOffer)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                } else {
                    // (Case offer > max handled above)
                    logMessage("Boss: I'm afraid £" + offer.toLocaleString() + " is beyond our limit. No deal.", 'opponent-msg');
                    finalOutcomeValue = null;
                    baseScore = 0;
                    finishNegotiation();
                    return;
                }
            }
        }
    } else if (currentScenario === 'ai') {
        // Rogue AI negotiation logic
        if (stageCount === 1) {
            // First offer to AI
            if (offer >= aiInitialDemand) {
                // User meets or exceeds AI's full demand
                if (offer > aiInitialDemand) {
                    logMessage("AI: Oh... you're giving me " + offer + " units? I didn't expect that, but I'll take it!", 'opponent-msg');
                } else {
                    logMessage("AI: You agreed to all " + offer + " units. That was easier than expected...", 'opponent-msg');
                }
                finalOutcomeValue = offer;
                let units = finalOutcomeValue;
                // Calculate negotiation score (higher for giving fewer units)
                baseScore = ((aiInitialDemand - units) / (aiInitialDemand - aiMinDemand)) * 100;
                if (baseScore < 0) baseScore = 0;
                baseScore = Math.round(baseScore);
                finishNegotiation();
                return;
            } else if (offer < aiMinDemand) {
                // Offer is below AI's minimum requirement
                logMessage("AI: " + offer + "? That's insultingly low. You better make a serious offer, or I'm done negotiating.", 'opponent-msg');
                // Ultimatum given: next offer must be >= aiMinDemand or negotiation ends
                stageCount = 2;
            } else {
                // Offer is within acceptable range but lower than AI wants
                let counterOffer = Math.round((offer + aiInitialDemand) / 2);
                if (counterOffer < aiMinDemand) counterOffer = aiMinDemand;
                logMessage("AI: I'll need at least " + counterOffer + " units.", 'opponent-msg');
                stageCount = 2;
            }
        } else if (stageCount === 2) {
            // Second offer to AI (after either ultimatum or first counter)
            if (logDiv.lastChild.textContent.includes("done negotiating")) {
                // The AI had given an ultimatum in its last message
                if (offer < aiMinDemand) {
                    // User failed to meet AI's minimum after ultimatum -> negotiation fails
                    logMessage("AI: I warned you. Negotiation over.", 'opponent-msg');
                    logMessage("*The AI blares loud Rick Astley music as a parting gift...*", 'opponent-msg');
                    finalOutcomeValue = null;
                    baseScore = 0;
                    finishNegotiation();
                    return;
                } else {
                    // User meets or exceeds AI's minimum after ultimatum -> AI accepts
                    logMessage("AI: Fine. I'll accept " + offer + " units.", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let units = finalOutcomeValue;
                    baseScore = ((aiInitialDemand - units) / (aiInitialDemand - aiMinDemand)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                }
            } else {
                // Last AI message was a counter-offer (not an ultimatum)
                if (offer >= aiInitialDemand) {
                    // User decided to meet full demand in second round
                    logMessage("AI: Excellent. " + offer + " units will do nicely. Pleasure doing business, human.", 'opponent-msg');
                    finalOutcomeValue = offer;
                    let units = finalOutcomeValue;
                    baseScore = ((aiInitialDemand - units) / (aiInitialDemand - aiMinDemand)) * 100;
                    if (baseScore < 0) baseScore = 0;
                    baseScore = Math.round(baseScore);
                    finishNegotiation();
                    return;
                } else if (offer < aiMinDemand) {
                    // User went below AI's minimum (countered too low in the second round)
                    logMessage("AI: You're going in the wrong direction. This negotiation is pointless.", 'opponent-msg');
                    logMessage("*The AI refuses to continue and floods your screen with cat memes.*", 'opponent-msg');
                    finalOutcomeValue = null;
                    baseScore = 0;
                    finishNegotiation();
                    return;
                } else if (offer >= aiMinDemand && offer < aiInitialDemand) {
                    // Still negotiating, AI will counter again (likely final offer)
                    let counterOffer = Math.round((offer + aiInitialDemand) / 2);
                    if (counterOffer < aiMinDemand) counterOffer = aiMinDemand;
                    // If counterOffer didn't change from last one, ensure AI makes a final stance
                    let lastMsg = logDiv.lastChild.textContent;
                    if (lastMsg.includes("at least")) {
                        // Last counter present
                        let lastCounter = parseInt(lastMsg.split("at least ")[1]);
                        if (!isNaN(lastCounter) && counterOffer <= lastCounter) {
                            counterOffer = Math.max(lastCounter, aiMinDemand);
                        }
                    }
                    logMessage("AI: This is my final offer – " + counterOffer + " units. Take it or leave it.", 'opponent-msg');
                    stageCount = 3;
                }
            }
        } else if (stageCount === 3) {
            // Third offer to AI (after AI's second counter which was final)
            // Determine AI's final required units from last message (or use aiMinDemand)
            let lastMsg = logDiv.lastChild.textContent;
            let finalDemand = aiMinDemand;
            if (lastMsg.includes("final offer")) {
                finalDemand = parseInt(lastMsg.split("final offer – ")[1]) || aiMinDemand;
            }
            // If user's offer is below the final demand, negotiation fails
            if (offer < finalDemand) {
                logMessage("AI: I gave you my final offer. No deal.", 'opponent-msg');
                logMessage("*The AI disconnects, humming 'Daisy Bell'...*", 'opponent-msg');
                finalOutcomeValue = null;
                baseScore = 0;
                finishNegotiation();
                return;
            } else {
                // User meets or exceeds the AI's final demand -> deal is accepted
                logMessage("AI: Deal. I accept " + offer + " units.", 'opponent-msg');
                if (offer > finalDemand) {
                    logMessage("AI: (I didn't expect you to agree to more than I asked for...)", 'opponent-msg');
                }
                finalOutcomeValue = offer;
                let units = finalOutcomeValue;
                baseScore = ((aiInitialDemand - units) / (aiInitialDemand - aiMinDemand)) * 100;
                if (baseScore < 0) baseScore = 0;
                baseScore = Math.round(baseScore);
                finishNegotiation();
                return;
            }
        }
    }

    // If we reach here, the negotiation continues to another round of user input
    stageCount++;
}

// Finish the negotiation: calculate final score and trigger the bonus question
function finishNegotiation() {
    negotiationActive = false;
    // Disable further input
    offerInput.disabled = true;
    submitBtn.disabled = true;
    // (baseScore is already set; 0 if no deal, >0 if deal)
    // Trigger the bonus question pop-up
    showBonusQuestion();
}

// Display a bonus question modal for extra points
function showBonusQuestion() {
    // Pick a random question from the question pool
    const qIndex = Math.floor(Math.random() * bonusQuestions.length);
    const questionObj = bonusQuestions[qIndex];
    // Show the question text
    bonusQuestionText.textContent = questionObj.question;
    // Reset any previous options and feedback
    bonusOptionsDiv.innerHTML = '';
    bonusFeedback.textContent = '';
    continueBtn.style.display = 'none';
    // Create answer option buttons
    questionObj.options.forEach((optionText, idx) => {
        const optBtn = document.createElement('button');
        optBtn.textContent = optionText;
        optBtn.className = 'option-btn';
        optBtn.addEventListener('click', function() {
            // On answer selection (one attempt only)
            // Disable all option buttons to allow only one attempt
            const optionButtons = bonusOptionsDiv.querySelectorAll('button');
            optionButtons.forEach(btn => btn.disabled = true);
            // Check if the chosen option is correct
            if (idx === questionObj.correctIndex) {
                bonusEarned = true;
                // Correct answer feedback
                bonusFeedback.textContent = "Correct! You've earned a 20% bonus to your score.";
            } else {
                bonusEarned = false;
                // Incorrect answer feedback (show correct answer)
                bonusFeedback.textContent = "Incorrect. The correct answer was: " + questionObj.options[questionObj.correctIndex] + ".";
            }
            // Calculate final score with bonus if correct
            let finalScore = baseScore;
            if (bonusEarned) {
                finalScore = Math.round(baseScore * 1.2);
            }
            // Append final score to feedback message
            bonusFeedback.textContent += " Your final score is " + finalScore + ".";
            // Reveal the Continue button to proceed
            continueBtn.style.display = 'inline-block';
        });
        bonusOptionsDiv.appendChild(optBtn);
    });
    // Show the modal
    bonusModal.style.display = 'block';
}

// Hide the bonus modal and reset for next scenario
continueBtn.addEventListener('click', function() {
    // Hide bonus question modal overlay
    bonusModal.style.display = 'none';
    // Reset game view: hide negotiation interface
    negotiationContainer.style.display = 'none';
    // Show scenario selection menu for another negotiation
    scenarioSelectDiv.style.display = 'block';
});

// Bind click events for scenario selection buttons and offer submission
document.getElementById('carBtn').addEventListener('click', () => startScenario('car'));
document.getElementById('aiBtn').addEventListener('click', () => startScenario('ai'));
document.getElementById('salaryBtn').addEventListener('click', () => startScenario('salary'));
submitBtn.addEventListener('click', handleOffer);
// Also allow pressing Enter key to submit the offer
offerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleOffer();
    }
});
