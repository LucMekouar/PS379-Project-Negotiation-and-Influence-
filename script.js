document.documentElement.style.setProperty('--accent-color', '#FF6B6B');

// Smooth screen transitions
function switchScreen(hideId, showId) {
    const hideElement = document.getElementById(hideId);
    const showElement = document.getElementById(showId);

    hideElement.classList.add('fade-out');
    setTimeout(() => {
        hideElement.classList.add('hidden');
        hideElement.classList.remove('fade-out');
        showElement.classList.remove('hidden');
        showElement.classList.add('fade-in');
        setTimeout(() => {
            showElement.classList.remove('fade-in');
        }, 300);
    }, 300);
}

// Initialize game state
let currentCar = null;
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
let negotiationAttempts = 0;
const maxAttempts = 5;

const highScores = JSON.parse(localStorage.getItem('highScores')) || {
    "Business Merger": 0,
    "Salary Negotiation": 0,
    "Buy a Car": {
        "new_car": 0,
        "old_car": 0,
        "antique": 0
    }
};

// DOM Event Listeners
document.getElementById('start-button').addEventListener('click', function() {
    switchScreen('start-button', 'scenario-selection');
});

document.querySelectorAll('.scenario-button').forEach(button => {
    button.addEventListener('click', function() {
        const scenario = this.getAttribute('data-scenario');
        if (scenario === 'buy-car') {
            switchScreen('scenario-selection', 'car-selection');
        } else {
            showTemporaryMessage('Scenario under construction! Coming soon!');
        }
    });
});

document.getElementById('high-scores-button').addEventListener('click', function() {
    switchScreen('scenario-selection', 'high-scores');
    updateHighScores();
});

document.querySelectorAll('.car-option').forEach(option => {
    option.addEventListener('click', function() {
        const carType = this.getAttribute('data-car');
        startNegotiation(carType);
    });
});

document.getElementById('back-to-scenarios').addEventListener('click', function() {
    switchScreen('car-selection', 'scenario-selection');
});

document.getElementById('back-to-car-selection').addEventListener('click', function() {
    switchScreen('negotiation', 'car-selection');
    resetNegotiation();
});

document.getElementById('back-to-car-selection-from-congrats').addEventListener('click', function() {
    switchScreen('congratulations', 'car-selection');
    resetNegotiation();
});

document.getElementById('back-to-scenarios-from-congrats').addEventListener('click', function() {
    switchScreen('congratulations', 'scenario-selection');
    resetNegotiation();
});

document.getElementById('back-to-scenarios-from-high-scores').addEventListener('click', function() {
    switchScreen('high-scores', 'scenario-selection');
});

document.getElementById('propose-offer').addEventListener('click', function() {
    const offerInput = document.getElementById('offer-input');
    const offer = parseFloat(offerInput.value.replace(/,/g, ''));

    if (isNaN(offer)) { 
        showInputError(offerInput, 'Please enter a valid number');
        return;
    }

    if (offer <= 0) {
        showInputError(offerInput, 'Offer must be positive');
        return;
    }

    negotiationAttempts++;
    handleOffer(offer);
    offerInput.value = '';
});

document.getElementById('accept-offer').addEventListener('click', function() {
    const offerText = this.textContent;
    const offer = parseFloat(offerText.split('$')[1].replace(/,/g, ''));
    endNegotiation(offer);
});

document.getElementById('offer-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('propose-offer').click();
    }
});

// Game Functions
function startNegotiation(carType) {
    currentCar = carType;
    negotiationAttempts = 0;

    const carSpecs = {
        "new_car": { label: "New Car", price: 50000 },
        "old_car": { label: "Old Car", price: 10000 },
        "antique": { label: "Antique Car", price: 13000 }
    };

    initialPrice = carSpecs[carType].price;
    minPrice = initialPrice * (0.75 + Math.random() * 0.1); // Randomize min price slightly

    document.getElementById('seller-dialog').innerHTML = `
        <div class="seller-avatar">
            <img src="seller.jpg" alt="Seller">
        </div>
        <div class="dialog-content">
            <p>🤑 Seller: Welcome! Interested in this ${carSpecs[carType].label}?</p>
            <p class="price-display">Initial Price: $${initialPrice.toLocaleString()}</p>
        </div>
    `;

    document.getElementById('accept-offer').textContent = `Accept $${initialPrice.toLocaleString()}`;
    document.getElementById('attempts-counter').textContent = `Attempts left: ${maxAttempts - negotiationAttempts}`;

    switchScreen('car-selection', 'negotiation');
}

function handleOffer(offer) {
    const sellerDialog = document.getElementById('seller-dialog');
    const acceptButton = document.getElementById('accept-offer');

    if (negotiationAttempts >= maxAttempts) {
        sellerDialog.innerHTML = `
            <div class="seller-avatar">
                <img src="seller.jpg" alt="Seller">
            </div>
            <div class="dialog-content">
                <p>😠 Seller: Too many low offers! I'm ending negotiations.</p>
                <p class="price-display">Final Price: $${initialPrice.toLocaleString()}</p>
            </div>
        `;
        acceptButton.textContent = `Accept $${initialPrice.toLocaleString()}`;
        return;
    }

    document.getElementById('attempts-counter').textContent = `Attempts left: ${maxAttempts - negotiationAttempts}`;

    if (offer < minPrice * 0.9) {
        // Very low offer - angry response
        const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
        sellerDialog.innerHTML = `
            <div class="seller-avatar">
                <img src="seller.jpg" alt="Seller">
            </div>
            <div class="dialog-content">
                <p>😠 Seller: That's insulting! My best: $${counterOffer.toLocaleString()}</p>
                <p class="hint">(Try offering between $${Math.floor(minPrice * 0.9).toLocaleString()} and $${Math.floor(minPrice * 1.1).toLocaleString()})</p>
            </div>
        `;
        acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
    } else if (offer < minPrice) {
        // Low but reasonable offer - neutral response
        const counterOffer = Math.floor(Math.random() * (minPrice - offer) + offer);
        sellerDialog.innerHTML = `
            <div class="seller-avatar">
                <img src="seller.jpg" alt="Seller">
            </div>
            <div class="dialog-content">
                <p>🤔 Seller: Hmm... how about $${counterOffer.toLocaleString()}?</p>
                <p class="hint">(You're getting close!)</p>
            </div>
        `;
        acceptButton.textContent = `Accept $${counterOffer.toLocaleString()}`;
    } else if (offer < minPrice * 1.1) {
        // Good offer - positive response
        sellerDialog.innerHTML = `
            <div class="seller-avatar">
                <img src="seller.jpg" alt="Seller">
            </div>
            <div class="dialog-content">
                <p>😊 Seller: That's reasonable! I accept $${offer.toLocaleString()}!</p>
                <p class="success">(Great negotiation!)</p>
            </div>
        `;
        acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
    } else {
        // Overpaying - happy seller
        sellerDialog.innerHTML = `
            <div class="seller-avatar">
                <img src="seller.jpg" alt="Seller">
            </div>
            <div class="dialog-content">
                <p>🎉 Seller: Deal! Let's sign the papers for $${offer.toLocaleString()}!</p>
                <p class="warning">(You could have gotten a better deal)</p>
            </div>
        `;
        acceptButton.textContent = `Accept $${offer.toLocaleString()}`;
    }
}

function endNegotiation(offer) {
    agreedPrice = offer;
    const score = Math.max(0, initialPrice - agreedPrice);

    updateHighScore(currentCar, score);
    saveHighScores();

    document.getElementById('car-image').src = `${currentCar}.png`;
    document.getElementById('score-text').innerHTML = `
        <p>You negotiated a ${currentCar.replace('_', ' ')} from $${initialPrice.toLocaleString()} to $${agreedPrice.toLocaleString()}</p>
        <p class="score-display">Your score: <span>${score.toLocaleString()}</span></p>
    `;

    createConfetti();
    switchScreen('negotiation', 'congratulations');
}

function updateHighScore(carType, score) {
    if (score > highScores["Buy a Car"][carType]) {
        highScores["Buy a Car"][carType] = score;
        document.getElementById('score-text').innerHTML += `
            <p class="new-high-score">🏆 New High Score! 🏆</p>
        `;
    }
}

function saveHighScores() {
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function updateHighScores() {
    let scoresText = "";
    const carLabels = {
        "new_car": "New Car",
        "old_car": "Old Car",
        "antique": "Antique Car"
    };

    for (const scenario in highScores) {
        if (scenario === "Buy a Car") {
            scoresText += `<strong>${scenario}:</strong>\n`;
            for (const car in highScores[scenario]) {
                scoresText += `  ${carLabels[car]}: $${highScores[scenario][car].toLocaleString()}\n`;
            }
        } else {
            scoresText += `<strong>${scenario}:</strong> $${highScores[scenario].toLocaleString()}\n`;
        }
    }

    document.getElementById('high-scores-text').innerHTML = `<pre>${scoresText}</pre>`;
}

function resetNegotiation() {
    currentCar = null;
    initialPrice = 0;
    minPrice = 0;
    agreedPrice = null;
    negotiationAttempts = 0;
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'];
    const container = document.getElementById('congratulations');

    // Clear existing confetti
    const existingConfetti = document.querySelectorAll('.confetti');
    existingConfetti.forEach(el => el.remove());

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(confetti);
    }
}

function showInputError(inputElement, message) {
    const errorElement = document.getElementById('offer-error') || createErrorElement();
    errorElement.textContent = message;
    inputElement.style.borderColor = 'red';

    setTimeout(() => {
        errorElement.textContent = '';
        inputElement.style.borderColor = 'var(--accent-color)';
    }, 3000);
}

function createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'offer-error';
    errorElement.className = 'error-message';
    document.getElementById('player-bubble').appendChild(errorElement);
    return errorElement;
}

function showTemporaryMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'temp-message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 2000);
}