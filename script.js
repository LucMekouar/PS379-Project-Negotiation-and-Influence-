// script.js

// --------------
// Helper: shuffle
// --------------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ----------------------------
// Global State & Questions
// ----------------------------
let currentScenario = null, currentCar = null;
let initialPrice = 0, minPrice = 0, negotiationAttempts = 0, maxAttempts = 5;
let salaryRole = "", initialSalaryOffer = 0, employerMax = 0, employerRemaining = 0, finalSalaryOffer = 0;
let incentiveBonus = 0, requestedIncentives = [], incentiveRequestsCount = 0;
const maxIncentives = 4;
const incentivesData = [
  { name: "Signing Bonus", value: 2000, cost: 3000 },
  { name: "Flexible Working Hours", valuePercent: 10, costPercent: 7.5 },
  { name: "Professional Development", value: 500, cost: 1000 },
  { name: "Gym Access", value: 150, cost: 100 },
  { name: "Coffee Machine", value: 100, cost: 10 }
];
let aiState = { round:0, demand:100, minRequired:60, lastDemand:0 };
let bonusBaseScore = 0, bonusScenarioType = "", bonusFinalValue = 0;

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
// High Scores Store
// ----------------------------
const highScores = JSON.parse(localStorage.getItem('highScores')) || {
  "Buy a Car": { new_car:0, old_car:0, antique:0 },
  "Rogue AI Negotiation": 0,
  "Salary Negotiation": 0
};

// ----------------------------
// Cached DOM Elements
// ----------------------------
const screens = {
  initial:    document.getElementById('initial-screen'),
  scenarios:  document.getElementById('scenario-selection'),
  carSelect:  document.getElementById('car-selection'),
  salaryRole: document.getElementById('salary-role-selection'),
  negotiation:document.getElementById('negotiation'),
  outcome:    document.getElementById('outcome-screen'),
  bonus:      document.getElementById('bonus-question'),
  congrats:   document.getElementById('congratulations'),
  highScores: document.getElementById('high-scores')
};

const startBtn    = document.getElementById('start-button');
const scenarioBtns= document.querySelectorAll('.scenario-button');
const highBtn     = document.getElementById('high-scores-button');
const backBtns    = document.querySelectorAll('.back-button');
const carOpts     = document.querySelectorAll('.car-option');
const roleBtns    = document.querySelectorAll('.role-button');

const sellerDlg   = document.getElementById('seller-dialog');
const negImg      = document.getElementById('negotiation-car-image');
const offerIn     = document.getElementById('offer-input');

const outcomeImg  = document.getElementById('outcome-image');
const outcomeTxt  = document.getElementById('outcome-text');
const outcomeBtn  = document.getElementById('outcome-continue');

const bonusTxt    = document.getElementById('bonus-text');
const bonusOpts   = document.getElementById('bonus-options');
const bonusConf   = document.getElementById('bonus-confirm');

const congratsImg = document.getElementById('car-image');
const scoreEl     = document.getElementById('score-text');

const highText    = document.getElementById('high-scores-text');
const resetBtn    = document.getElementById('reset-high-scores-button');

// ----------------------------
// Utility Functions
// ----------------------------
function switchScreen(key) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[key].classList.remove('hidden');
}

function saveHighScores() {
  localStorage.setItem('highScores', JSON.stringify(highScores));
}

function showInputError(el,msg) {
  const orig=el.placeholder;
  el.placeholder=msg;
  el.style.borderColor='#ff5252';
  setTimeout(()=>{ el.placeholder=orig; el.style.borderColor='var(--accent-color)'; },2000);
}

function createConfetti() {
  const colors=['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeead'];
  const ctr=document.getElementById('congratulations');
  document.querySelectorAll('.confetti').forEach(x=>x.remove());
  for(let i=0;i<80;i++){
    const c=document.createElement('div');
    c.className='confetti';
    c.style.left=Math.random()*100+'vw';
    c.style.backgroundColor=colors[Math.floor(Math.random()*colors.length)];
    c.style.animationDelay=Math.random()*3+'s';
    ctr.appendChild(c);
  }
}

// Reset standard Car/AI proposal buttons
function resetOfferButtons() {
  const grp=document.querySelector('.offer-buttons');
  grp.innerHTML='';
  const p=document.createElement('button');
  p.id='propose-offer'; p.textContent='Propose';
  p.addEventListener('click', onProposeOffer);
  grp.appendChild(p);
  const a=document.createElement('button');
  a.id='accept-offer'; a.textContent='Accept';
  a.addEventListener('click', onAcceptOffer);
  grp.appendChild(a);
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').classList.add('hidden');
}

function onProposeOffer() {
  const v=parseFloat(offerIn.value.replace(/,/g,''))||0;
  if(!v) return showInputError(offerIn,'Enter a valid number');
  if(currentScenario==='buy-car') {
    negotiationAttempts++; handleCarOffer(v); offerIn.value='';
  }
  else if(currentScenario==='rogue-ai') {
    handleAIOffer(v); offerIn.value='';
  }
  else {
    handleSalaryOffer();
  }
}

function onAcceptOffer() {
  if(currentScenario==='salary-negotiation') return acceptSalaryOffer();
  const num=parseFloat(this.textContent.replace(/[^0-9\.]/g,''))||0;
  if(num) endCarOrAI(num);
}

// ----------------------------
// Navigation Setup
// ----------------------------
startBtn.addEventListener('click', ()=>switchScreen('scenarios'));
scenarioBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    const s=b.dataset.scenario;
    currentScenario=s;
    if(s==='buy-car')        switchScreen('carSelect');
    else if(s==='rogue-ai')  { startAINegotiation(); switchScreen('negotiation'); }
    else                      switchScreen('salaryRole');
  });
});
highBtn.addEventListener('click', ()=>{
  renderHighScores(); switchScreen('highScores');
});
backBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    if(b.id==='back-to-initial-from-scenarios') switchScreen('initial');
    else if(b.id==='back-to-scenarios-from-high-scores') switchScreen('scenarios');
    else if(b.id==='back-to-scenarios') switchScreen('scenarios');
    else if(b.id==='back-to-scenarios-from-salary-role') switchScreen('scenarios');
    else if(b.id==='back-to-car-selection') {
      if(currentScenario==='buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetState();
    }
    else if(b.id==='back-to-scenarios-from-congrats') {
      switchScreen('scenarios');
      resetState();
    }
    else if(b.id==='back-to-car-selection-from-congrats') {
      if(currentScenario==='buy-car') switchScreen('carSelect');
      else switchScreen('scenarios');
      resetState();
    }
  });
});
resetBtn.addEventListener('click', showResetConfirmation);

// ----------------------------
// Car Negotiation
// ----------------------------
carOpts.forEach(o=>{
  o.addEventListener('click', ()=>{
    startNegotiation(o.dataset.car);
    switchScreen('negotiation');
  });
});

function startNegotiation(carType) {
  resetOfferButtons();
  currentCar=carType; negotiationAttempts=0; maxAttempts=Math.floor(Math.random()*5)+1;
  const specs={new_car:{label:"New Car",price:50000},old_car:{label:"Old Car",price:10000},antique:{label:"Antique Car",price:13000}};
  initialPrice=specs[carType].price;
  minPrice=initialPrice*(0.75+Math.random()*0.1);
  sellerDlg.innerHTML=`🤑 Seller: Interested in this ${specs[carType].label}?<br>Initial Price: $${initialPrice.toLocaleString()}`;
  negImg.src=`${carType}.png`;
  offerIn.placeholder="Enter your car offer (£)";
  // immediate accept
  document.getElementById('accept-offer').textContent=`Accept $${initialPrice.toLocaleString()}`;
}

function handleCarOffer(offer) {
  if(negotiationAttempts>maxAttempts){
    sellerDlg.innerHTML=`😠 Too many low offers! Final Price: $${initialPrice.toLocaleString()}`;
    document.getElementById('accept-offer').textContent=`Accept $${initialPrice.toLocaleString()}`;
    return;
  }
  if(offer<minPrice*0.9){
    const co=Math.floor(Math.random()*(initialPrice-minPrice)+minPrice);
    sellerDlg.innerHTML=`😠 Insulting! My best: $${co.toLocaleString()}`;
    document.getElementById('accept-offer').textContent=`Accept $${co.toLocaleString()}`;
  }
  else if(offer<minPrice){
    const co=Math.floor(Math.random()*(minPrice-offer)+offer);
    sellerDlg.innerHTML=`🤔 How about $${co.toLocaleString()}?`;
    document.getElementById('accept-offer').textContent=`Accept $${co.toLocaleString()}`;
  }
  else {
    sellerDlg.innerHTML=`🎉 Deal at $${offer.toLocaleString()}!`;
    document.getElementById('accept-offer').textContent=`Accept $${offer.toLocaleString()}`;
  }
}

function endCarOrAI(finalOffer){
  const range=initialPrice-minPrice;
  const saved=initialPrice-finalOffer;
  const pct=range>0?Math.round(saved/range*100):0;
  bonusBaseScore=pct;
  bonusScenarioType=currentScenario;
  bonusFinalValue=finalOffer;
  showOutcomeScreen();
}

// ----------------------------
// Rogue AI Negotiation
// ----------------------------
function startAINegotiation(){
  resetOfferButtons();
  aiState={round:1,demand:100,minRequired:60,lastDemand:0};
  sellerDlg.innerHTML=`🤖 EXO-9: I demand ${aiState.demand} units. Your offer?`;
  negImg.src="exo9.png";
  offerIn.placeholder="Enter your resource offer (units)";
  // immediate accept
  document.getElementById('accept-offer').textContent=`Accept ${aiState.demand}`;
}

function handleAIOffer(offer){
  if(aiState.round===1){
    if(offer>=aiState.demand){ sellerDlg.innerHTML=`🤖 Accepted ${offer} units.`; endCarOrAI(offer); }
    else if(offer<aiState.minRequired){ sellerDlg.innerHTML=`🤖 Insufficient. ≥${aiState.minRequired}.`; aiState.round=2; }
    else { aiState.lastDemand=Math.floor((aiState.demand+offer)/2); sellerDlg.innerHTML=`🤖 I need ${aiState.lastDemand}.`; aiState.round=2; }
  } else if(aiState.round===2){
    if(offer>=aiState.lastDemand){ sellerDlg.innerHTML=`🤖 Deal at ${offer}.`; endCarOrAI(offer); }
    else { const fd=Math.floor((aiState.lastDemand+offer)/2); sellerDlg.innerHTML=`🤖 Final demand: ${fd}.`; aiState.lastDemand=fd; aiState.round=3; }
  } else {
    if(offer>=aiState.lastDemand){ sellerDlg.innerHTML=`🤖 Agreement at ${offer}.`; endCarOrAI(offer); }
    else { sellerDlg.innerHTML=`🤖 No agreement.`; endCarOrAI(offer); }
  }
}

// ----------------------------
// Salary Negotiation
// ----------------------------
roleBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    switchScreen('negotiation');
    beginSalaryNegotiation(btn.dataset.role);
  });
});

function beginSalaryNegotiation(role){
  salaryRole=role;
  if(role==="high"){ initialSalaryOffer=35000; employerMax=60000; }
  else { initialSalaryOffer=25000; employerMax=40000; }
  employerRemaining=employerMax-initialSalaryOffer;
  incentiveBonus=0; requestedIncentives=[]; negotiationAttempts=0;

  offerIn.placeholder="Enter your salary offer (£)";
  const grp=document.querySelector('.offer-buttons');
  grp.innerHTML='';

  ["Negotiate Salary","Request Incentive","Walk Away","Accept Offer"].forEach((txt,i)=>{
    const b=document.createElement('button');
    b.textContent=txt; b.classList.add('salary-button');
    if(i===0) b.addEventListener('click', onProposeOffer);
    if(i===1) b.addEventListener('click', requestIncentiveSalary);
    if(i===2) b.addEventListener('click', walkAwaySalary);
    if(i===3) b.addEventListener('click', onAcceptOffer);
    grp.appendChild(b);
  });

  sellerDlg.innerHTML=`Employer: We propose £${initialSalaryOffer.toLocaleString()}. Your thoughts?`;
  negImg.src="employer-interview_picture.png";
}

function handleSalaryOffer(){
  // (existing salary logic unmodified)
}

function requestIncentiveSalary(){
  // (existing incentive logic)
}

function walkAwaySalary(){
  // (existing walk-away logic)
}

function acceptSalaryOffer(){
  finalSalaryOffer=parseFloat(offerIn.value.replace(/,/g,''))||initialSalaryOffer;
  endSalaryNegotiation();
}

function endSalaryNegotiation(){
  const gain=finalSalaryOffer-initialSalaryOffer;
  const range=employerMax-initialSalaryOffer;
  const pct=range>0?Math.round(gain/range*100):0;
  bonusBaseScore=pct;
  bonusScenarioType='salary-negotiation';
  bonusFinalValue=finalSalaryOffer;
  showOutcomeScreen();
}

// ----------------------------
// Show Outcome Screen
// ----------------------------
function showOutcomeScreen(){
  // populate image & text
  let imgSrc="", txt="";
  if(bonusScenarioType==='buy-car'){
    imgSrc=`${currentCar}.png`;
    txt=`You negotiated from $${initialPrice.toLocaleString()} down to $${bonusFinalValue.toLocaleString()}.\nBase score: ${bonusBaseScore}%`;
  }
  else if(bonusScenarioType==='rogue-ai'){
    imgSrc="exo9.png";
    txt=`🤖 EXO-9: "Thank you, Judgement day is coming..."\nUnits given: ${bonusFinalValue}.\nBase score: ${bonusBaseScore}%`;
  }
  else { // salary
    imgSrc="employer-interview_picture.png";
    txt=`You negotiated salary from £${initialSalaryOffer.toLocaleString()} to £${bonusFinalValue.toLocaleString()}.\nBase score: ${bonusBaseScore}%`;
  }
  outcomeImg.src=imgSrc;
  outcomeTxt.textContent=txt;
  switchScreen('outcome');
}

// advance to bonus
outcomeBtn.addEventListener('click', ()=>showBonusQuestion());

// ----------------------------
// Bonus Question Phase
// ----------------------------
function showBonusQuestion(){
  switchScreen('bonus');
  bonusOpts.innerHTML='';
  bonusConf.classList.add('hidden');

  const q=questionPool[Math.floor(Math.random()*questionPool.length)];
  bonusTxt.textContent=q.q;

  const opts=q.options.map((opt,i)=>({text:opt,idx:i}));
  shuffleArray(opts);

  opts.forEach(({text,idx})=>{
    const b=document.createElement('button');
    b.className='option-btn';
    b.textContent=text;
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.option-btn').forEach(x=>x.disabled=true);
      let finalScore=bonusBaseScore;
      if(idx===q.correctIndex){
        finalScore=Math.round(bonusBaseScore*1.2);
        bonusTxt.textContent+=`\n\n✅ Correct! ${q.correctAnswerText}\nFinal Score: ${finalScore}%`;
        b.classList.add('correct');
      } else {
        bonusTxt.textContent+=`\n\n❌ Wrong. ${q.correctAnswerText}\nFinal Score: ${finalScore}%`;
        b.classList.add('wrong');
      }
      // update highs
      if(bonusScenarioType==='buy-car'){
        if(finalScore>highScores["Buy a Car"][currentCar])
          highScores["Buy a Car"][currentCar]=finalScore;
      } else if(bonusScenarioType==='rogue-ai'){
        if(finalScore>highScores["Rogue AI Negotiation"])
          highScores["Rogue AI Negotiation"]=finalScore;
      } else {
        if(finalScore>highScores["Salary Negotiation"])
          highScores["Salary Negotiation"]=finalScore;
      }
      saveHighScores();

      scoreEl.textContent=`Your total score: ${finalScore}%`;
      congratsImg.src = bonusScenarioType==='rogue-ai'
        ? "exo9.png"
        : bonusScenarioType==='buy-car'
          ? `${currentCar}.png`
          : "seller.jpg";

      bonusConf.classList.remove('hidden');
    });
    bonusOpts.appendChild(b);
  });
}

bonusConf.addEventListener('click', ()=>switchScreen('congrats'));

// ----------------------------
// High Scores & Reset
// ----------------------------
function renderHighScores(){
  let t="Buy a Car:\n";
  const L={new_car:"New Car",old_car:"Old Car",antique:"Antique Car"};
  for(const c in highScores["Buy a Car"])
    t+=`  ${L[c]}: ${highScores["Buy a Car"][c]}%\n`;
  t+=`\nRogue AI Negotiation: ${highScores["Rogue AI Negotiation"]}%\n`;
  t+=`\nSalary Negotiation: ${highScores["Salary Negotiation"]}%\n`;
  highText.textContent=t;
}
function showResetConfirmation(){
  const ov=document.createElement('div'); ov.id='reset-confirmation-overlay';
  const md=document.createElement('div'); md.id='reset-confirmation-modal';
  md.innerHTML=`<p>Reset all High Scores?</p>`;
  const y=document.createElement('button'); y.textContent="Yes";
  const n=document.createElement('button'); n.textContent="No";
  md.appendChild(y); md.appendChild(n); ov.appendChild(md);
  document.body.appendChild(ov);
  const tm=setTimeout(()=>{ if(document.body.contains(ov)) document.body.removeChild(ov); },15000);
  y.addEventListener('click',()=>{
    clearTimeout(tm);
    Object.keys(highScores["Buy a Car"]).forEach(k=>highScores["Buy a Car"][k]=0);
    highScores["Rogue AI Negotiation"]=0;
    highScores["Salary Negotiation"]=0;
    saveHighScores(); renderHighScores();
    document.body.removeChild(ov);
  });
  n.addEventListener('click',()=>{ clearTimeout(tm); document.body.removeChild(ov); });
}

// ----------------------------
// Reset Utility
// ----------------------------
function resetState(){
  currentCar=currentScenario=null;
  initialPrice=minPrice=0; negotiationAttempts=0;
  salaryRole=""; initialSalaryOffer=employerMax=0;
  employerRemaining=0; finalSalaryOffer=0;
  incentiveBonus=0; requestedIncentives=[]; incentiveRequestsCount=0;
  aiState={round:0,demand:100,minRequired:60,lastDemand:0};
  offerIn.value='';
  document.getElementById('ai-options').classList.add('hidden');
  document.getElementById('salary-incentives').classList.add('hidden');
  resetOfferButtons();
}
