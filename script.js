const KEY = 'finance-dashboard-state-v1';
const $ = id => document.getElementById(id);

const careerItems = ["Python","Java","SQL","HTML","CSS","JavaScript","Git & GitHub","Data Structures & Algorithms","AI & Machine Learning","Portfolio Website","AI Project","Web Application","GitHub Portfolio","CV Updated"];
const visionItems = ["Degree completed","Internship experience","Strong GitHub portfolio","Emergency fund (£1,500)","Savings (£3,000–£5,000)","Investment portfolio (£1,500–£3,000)","Graduate job secured","Financial confidence for next stage"];
const rules = [
  "Education comes before investing.",
  "Pay tuition on time.",
  "Keep at least £1,500 in an emergency fund.",
  "Save before spending.",
  "Invest consistently, not emotionally.",
  "Never invest money needed for rent or tuition.",
  "Build skills that increase my future income.",
  "Apply for internships every year.",
  "Live below my means.",
  "Remember: my degree is my biggest investment."
];

let state = {
  tuitionY1: 0, tuitionY2: 0,
  incJob:0, incFam:0, incSch:0, incOth:0,
  expRent:0, expFood:0, expTransport:0, expPhone:0, expStudy:0, expFun:0, expMisc:0,
  efBalance:0, lsBalance:0, invValue:0, invPnl:0,
  nwCash:0, nwDebt:0,
  career: {}, vision: {}
};

function buildRules(){
  $('rulesList').innerHTML = rules.map(r => `<li>${r}</li>`).join('');
}

function buildChecklist(gridId, items, stateKey){
  const grid = $(gridId);
  grid.innerHTML = items.map((label,i)=>`<div class="check-item" data-i="${i}"><div class="box"></div><div>${label}</div></div>`).join('');
  grid.querySelectorAll('.check-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      const i = el.dataset.i;
      state[stateKey][i] = !state[stateKey][i];
      renderChecklist(gridId, items, stateKey);
      updateTagsAndStamps();
      save();
    });
  });
  renderChecklist(gridId, items, stateKey);
}
function renderChecklist(gridId, items, stateKey){
  const grid = $(gridId);
  grid.querySelectorAll('.check-item').forEach(el=>{
    const i = el.dataset.i;
    el.classList.toggle('done', !!state[stateKey][i]);
  });
}

function countDone(stateKey){
  return Object.values(state[stateKey]).filter(Boolean).length;
}

function fmt(n){
  const v = isFinite(n) ? n : 0;
  return '£' + v.toLocaleString('en-GB', {maximumFractionDigits:0});
}

function pill(el){ return el; }

function setupPills(){
  document.querySelectorAll('.pill-group').forEach(group=>{
    const year = group.dataset.year;
    group.querySelectorAll('.pill').forEach(p=>{
      p.addEventListener('click', ()=>{
        state['tuitionY'+year] = parseFloat(p.dataset.val);
        renderPills();
        updateAll();
        save();
      });
    });
  });
}
function renderPills(){
  document.querySelectorAll('.pill-group').forEach(group=>{
    const year = group.dataset.year;
    const val = state['tuitionY'+year];
    group.querySelectorAll('.pill').forEach(p=>{
      p.classList.toggle('active', parseFloat(p.dataset.val) === val);
    });
  });
}

function bindInput(id, castFloat=true){
  const el = $(id);
  el.addEventListener('input', ()=>{
    state[id] = castFloat ? (parseFloat(el.value)||0) : el.value;
    updateAll();
    save();
  });
}

function updateAll(){
  // Tuition
  const paidY1 = 17960 * state.tuitionY1;
  const paidY2 = 17960 * state.tuitionY2;
  const totalPaid = paidY1 + paidY2;
  const remaining = 35920 - totalPaid;
  $('tuitionRemaining').textContent = fmt(remaining);

  // Runway
  const pct = Math.round((totalPaid/35920)*100);
  $('runwayFill').style.width = pct + '%';
  $('runwayPlane').style.left = Math.min(pct,97) + '%';
  $('runwayAmount').textContent = `${fmt(totalPaid)} / £35,920 paid`;
  $('stub-progress').textContent = pct + '%';

  // Budget
  const income = state.incJob + state.incFam + state.incSch + state.incOth;
  const expenses = state.expRent + state.expFood + state.expTransport + state.expPhone + state.expStudy + state.expFun + state.expMisc;
  $('totalIncome').textContent = fmt(income);
  $('totalExpenses').textContent = fmt(expenses);
  const leftover = income - expenses;
  const leftoverEl = $('leftover');
  leftoverEl.textContent = fmt(leftover);
  leftoverEl.style.color = leftover < 0 ? '#a63d2f' : 'var(--teal)';

  // Emergency fund
  const efPct = Math.min(100, Math.round((state.efBalance/1500)*100));
  $('efBar').style.width = efPct + '%';
  $('efPct').textContent = efPct + '%';
  $('stampEmergency').classList.toggle('show', state.efBalance >= 1500);

  // Long term savings
  const lsPct = Math.min(100, Math.round((state.lsBalance/5000)*100));
  $('lsBar').style.width = lsPct + '%';
  $('lsPct').textContent = lsPct + '%';
  $('stampSavings').classList.toggle('show', state.lsBalance >= 5000);

  // Investments
  const invPct = Math.min(100, Math.round((state.invValue/3000)*100));
  $('invBar').style.width = invPct + '%';
  $('invPct').textContent = invPct + '%';

  // Net worth
  $('nwEf').textContent = fmt(state.efBalance);
  $('nwSav').textContent = fmt(state.lsBalance);
  $('nwInv').textContent = fmt(state.invValue);
  const totalAssets = state.nwCash + state.efBalance + state.lsBalance + state.invValue;
  const netWorth = totalAssets - state.nwDebt;
  $('nwTotal').textContent = fmt(netWorth);

  updateTagsAndStamps();

  // month label
  $('monthLabel').textContent = new Date().toLocaleDateString('en-GB', {month:'long', year:'numeric'});
}

function updateTagsAndStamps(){
  $('careerTag').textContent = `${countDone('career')} / ${careerItems.length}`;
  $('visionTag').textContent = `${countDone('vision')} / ${visionItems.length}`;
}

function save(){
  try{
    localStorage.setItem(KEY, JSON.stringify(state));
  }catch(e){ console.error('Save failed', e); }
}

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      const loaded = JSON.parse(raw);
      state = Object.assign(state, loaded);
      state.career = loaded.career || {};
      state.vision = loaded.vision || {};
    }
  }catch(e){
    // no saved state yet
  }
}

function applyStateToInputs(){
  ['incJob','incFam','incSch','incOth','expRent','expFood','expTransport','expPhone','expStudy','expFun','expMisc','efBalance','lsBalance','invValue','invPnl','nwCash','nwDebt'].forEach(id=>{
    if($(id)) $(id).value = state[id] || '';
  });
}

async function init(){
  buildRules();
  setupPills();
  buildChecklist('careerGrid', careerItems, 'career');
  buildChecklist('visionGrid', visionItems, 'vision');

  await load();
  applyStateToInputs();
  renderPills();
  renderChecklist('careerGrid', careerItems, 'career');
  renderChecklist('visionGrid', visionItems, 'vision');

  ['incJob','incFam','incSch','incOth','expRent','expFood','expTransport','expPhone','expStudy','expFun','expMisc','efBalance','lsBalance','invValue','invPnl','nwCash','nwDebt'].forEach(id=> bindInput(id));

  updateAll();

  $('resetBtn').addEventListener('click', async ()=>{
    if(!confirm('Reset all saved data on this dashboard?')) return;
    state = {tuitionY1:0,tuitionY2:0,incJob:0,incFam:0,incSch:0,incOth:0,expRent:0,expFood:0,expTransport:0,expPhone:0,expStudy:0,expFun:0,expMisc:0,efBalance:0,lsBalance:0,invValue:0,invPnl:0,nwCash:0,nwDebt:0,career:{},vision:{}};
    applyStateToInputs();
    renderPills();
    renderChecklist('careerGrid', careerItems, 'career');
    renderChecklist('visionGrid', visionItems, 'vision');
    updateAll();
    await save();
  });
}

init();