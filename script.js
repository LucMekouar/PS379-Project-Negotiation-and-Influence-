document.getElementById('start-button').addEventListener('click', function() {
    document.getElementById('scenario-selection').classList.remove('hidden');
    document.getElementById('start-button').classList.add('hidden');
});

document.querySelectorAll('.scenario-button').forEach(button => {
    button.addEventListener('click', function() {
        const scenario = this.getAttribute('data-scenario');
        if (scenario === 'buy-car') {
            document.getElementById('car-selection').classList.remove('hidden');
            document.getElementById('scenario-selection').classList.add('hidden');
        } else {
            alert('Scenario under construction');
        }
    });
});

document.getElementById('high-scores-button').addEventListener('click', function() {
    document.getElementById('high-scores').classList.remove('hidden');
    document.getElementById('scenario-selection').classList.add('hidden');
    updateHighScores();
});

document.querySelectorAll('.car-option').forEach(option => {
    option.addEventListener('click', function() {
        const carType = this.getAttribute('data-car');
        startNegotiation(carType);
    });
});

document.getElementById('back-to-scenarios').addEventListener('click', function() {
    document.getElementById('scenario-selection').classList.remove('hidden');
    document.getElementById('car-selection').classList.add('hidden');
});

document.getElementById('back-to-car-selection').addEventListener('click', function() {
    document.getElementById('car-selection').classList.remove('hidden');
    document.getElementById('negotiation').classList.add('hidden');
});

document.getElementById('back-to-car-selection-from-congrats').addEventListener('click', function() {
    document.getElementById('car-selection').classList.remove('hidden');
    document.getElementById('congratulations').classList.add('hidden');
});

document.getElementById('back-to-scenarios-from-congrats').addEventListener('click', function() {
    document.getElementById('scenario-selection').classList.remove('hidden');
    document.getElementById('congratulations').classList.add('hidden');
});

document.getElementById('back-to-scenarios-from-high-scores').addEventListener('click', function() {
    document.getElementById('scenario-selection').classList.remove('hidden');
    document.getElementById('high-scores').classList.add('hidden');
});

document.getElementById('propose-offer').addEventListener('click', function() {
    const offer = parseFloat(document.getElementById('offer-input').value);
    if (isNaN(offer)) {
        alert('Please enter a valid number');
        return;
    }
    handleOffer(offer);
});

document.getElementById('accept-offer').addEventListener('click', function() {
    const offerText = this.textContent;
    const offer = parseFloat(offerText.split('$')[1].replace(',', ''));
    endNegotiation(offer);
});

let currentCar = null;
let initialPrice = 0;
let minPrice = 0;
let agreedPrice = null;
const highScores = {
    "Business Merger": 0,
    "Salary Negotiation": 0,
    "Buy a Car": {"new_car": 0, "old_car": 0, "antique": 0}
};

function startNegotiation(carType) {
    currentCar = carType;
    const carSpecs = {
        "new_car": { label: "New Car", price: 50000 },
        "old_car": { label: "Old Car", price: 10000 },
        "antique": { label: "Antique Car", price: 13000 }
    };
    initialPrice = carSpecs[carType].price;
    minPrice = initialPrice * 0.78;
    document.getElementById('seller-dialog').innerHTML = `🤑 Seller: Welcome! Interested in this ${carSpecs[carType].label}?<br>Initial Price: $${initialPrice.toLocaleString()}`;
    document.getElementById('accept-offer').textContent = `Accept $${initialPrice.toLocaleString()}`;
    document.getElementById('negotiation').classList.remove('hidden');
    document.getElementById('car-selection').classList.add('hidden');
}

function handleOffer(offer) {
    if (offer < minPrice) {
        const counterOffer = Math.floor(Math.random() * (initialPrice - minPrice) + minPrice);
        document.getElementById('seller-dialog').innerHTML = `🤨 Seller: Too low! My best: $${counterOffer.toLocaleString()}`;
        document.getElementById('accept-offer').textContent = `Accept $${counterOffer.toLocaleString()}`;
    } else {
        document.getElementById('seller-dialog').innerHTML = "🎉 Seller: Deal! Let's sign the papers!";
        document.getElementById('accept-offer').textContent = `Accept $${offer.toLocaleString()}`;
    }
    document.getElementById('offer-input').value = '';
}

function endNegotiation(offer) {
    agreedPrice = offer;
    const score = initialPrice - agreedPrice;
    updateHighScore(currentCar, score);
    document.getElementById('car-image').src = `${currentCar}.png`;
    document.getElementById('score-text').innerHTML = `Your score is: ${score.toFixed(2)}`;
    document.getElementById('congratulations').classList.remove('hidden');
    document.getElementById('negotiation').classList.add('hidden');
}

function updateHighScore(carType, score) {
    if (score > highScores["Buy a Car"][carType]) {
        highScores["Buy a Car"][carType] = score;
    }
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
            scoresText += `${scenario}:\n`;
            for (const car in highScores[scenario]) {
                scoresText += `  ${carLabels[car]}: ${highScores[scenario][car].toFixed(2)}\n`;
            }
        } else {
            scoresText += `${scenario}: ${highScores[scenario].toFixed(2)}\n`;
        }
    }
    document.getElementById('high-scores-text').innerHTML = `<pre>${scoresText}</pre>`;
}
