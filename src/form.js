import { data, state } from './state.js';
import { esc, gv, sv, showToast } from './utils.js';
import { STEPS } from './constants.js';
import { step1, step2, step3, step5 } from './steps.js';
import { step4, initFP } from './floorplan.js';

// Basic email-shape check: something@something.tld with no spaces.
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

export function showForm(){
  document.getElementById('landing-screen').style.display='none';
  document.getElementById('progress-wrap').style.display='';
  document.getElementById('form-screen').style.display='';
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ═══════════════════════════════════════════════════════
//  PROGRESS
// ═══════════════════════════════════════════════════════
export function renderProgress(){
  const el=document.getElementById('progress-bar');
  el.innerHTML=STEPS.map((lbl,i)=>{
    const n=i+1;
    const cls=n<state.cur?'done':n===state.cur?'active':'';
    const icon=n<state.cur?'✓':n;
    return `<div class="prog-step ${cls}" onclick="${n<state.cur?'jumpTo('+n+')':''}">
      <div class="prog-num">${icon}</div>
      <div class="prog-label">${lbl}</div>
    </div>`;
  }).join('');
}
export function jumpTo(n){saveCurrentStep();state.cur=n;renderAll();}

// ═══════════════════════════════════════════════════════
//  SAVE / VALIDATE / NAV
// ═══════════════════════════════════════════════════════
export function saveCurrentStep(){
  if(state.cur===1){
    sv('title','f-title');sv('date','f-date');sv('attendees','f-att');
    data.multiDay=document.getElementById('f-multiday')?.checked||false;
    data.dateEnd=data.multiDay?gv('f-dateend'):'';
    data.studentGroup=document.getElementById('f-studentgroup')?.checked||false;
    sv('setupStart','f-setup');sv('startTime','f-start');sv('endTime','f-end');
    sv('breakdownEnd','f-breakdown');sv('description','f-desc');
  }
  if(state.cur===2){
    sv('groupName','f-gname');sv('org1','f-o1');sv('org1phone','f-o1p');
    sv('org1email','f-o1e');sv('org2','f-o2');sv('org2phone','f-o2p');
    sv('org3','f-o3');sv('org3phone','f-o3p');
  }
  if(state.cur===3){
    sv('avNotes','f-avnotes');
    sv('paymentDept','f-pdept');sv('paymentAcct','f-pacct');
    sv('paymentContact','f-pcontact');sv('paymentEmail','f-pemail');sv('paymentPhone','f-pphone');
    sv('paymentGL','f-pgl');sv('paymentCFC','f-pcfc');sv('paymentCC','f-pcc');sv('paymentFund','f-pfund');
  }
  if(state.cur===5){
    sv('sig','f-sig');sv('sigDate','f-sigdate');sv('sigTitle','f-sigtitle');
    const pc=document.getElementById('f-policy'); if(pc) data.policyAccepted=pc.checked;
  }
}

export function validate(){
  let ok=true;
  function err(id,msg){const f=document.getElementById(id);if(f)f.classList.add('error');const em=document.getElementById('err-'+id);if(em){em.textContent=msg;em.classList.add('show');}ok=false;}
  function clr(id){const f=document.getElementById(id);if(f)f.classList.remove('error');const em=document.getElementById('err-'+id);if(em)em.classList.remove('show');}
  if(state.cur===1){
    ['f-title','f-date','f-att','f-setup','f-start','f-end','f-breakdown','f-desc'].forEach(clr);
    if(!gv('f-title'))  err('f-title','Event title is required');
    if(!gv('f-date'))   err('f-date','Please select a date');
    if(!gv('f-att'))    err('f-att','Please enter estimated attendees');
    if(!gv('f-start'))  err('f-start','Start time is required');
    if(!gv('f-end'))    err('f-end','End time is required');
    if(!gv('f-desc'))   err('f-desc','Please describe your event');
    if(!data.groupType){showToast('Please select your group type.');ok=false;}
    // Multi-day: require a valid end date on or after the start date.
    if(document.getElementById('f-multiday')?.checked){
      clr('f-dateend');
      const d1=gv('f-date'), d2=gv('f-dateend');
      if(!d2)            err('f-dateend','Please select the event end date');
      else if(d1&&d2<d1) err('f-dateend','End date can’t be before the start date');
    }
    // Chronological order: setup ≤ start < end ≤ breakdown
    const setup=gv('f-setup'), st=gv('f-start'), en=gv('f-end'), bd=gv('f-breakdown');
    if(setup && st && st<setup)  err('f-start','Event start can’t be before setup');
    if(st && en && en<=st)       err('f-end','Event end must be after the start time');
    if(en && bd && bd<en)        err('f-breakdown','Breakdown can’t be before the event ends');
    if(setup && bd && bd<setup)  err('f-breakdown','Breakdown can’t be before setup');
  }
  if(state.cur===2){
    ['f-gname','f-o1','f-o1e'].forEach(clr);
    if(!gv('f-gname')) err('f-gname','Group name is required');
    if(!gv('f-o1'))    err('f-o1','Primary organizer name is required');
    const email=gv('f-o1e');
    if(!email)              err('f-o1e','Email is required');
    else if(!isEmail(email)) err('f-o1e','Enter a valid email, e.g. name@mail.utoronto.ca');
  }
  if(state.cur===5){
    ['f-sig','f-sigdate'].forEach(clr);
    if(!gv('f-sig'))     err('f-sig','Signature is required');
    if(!gv('f-sigdate')) err('f-sigdate','Date is required');
    const pc=document.getElementById('f-policy');
    if(pc && !pc.checked){
      data.policyAccepted=false;
      const em=document.getElementById('err-f-policy'); if(em){em.textContent='Please read and accept the policies to continue';em.classList.add('show');}
      ok=false;
    }
  }
  return ok;
}

export function goNext(){saveCurrentStep();if(!validate())return;state.cur++;renderAll();window.scrollTo({top:0,behavior:'smooth'});}
export function goBack(){saveCurrentStep();state.cur--;renderAll();window.scrollTo({top:0,behavior:'smooth'});}

export function renderAll(){
  renderProgress();
  const mc=document.getElementById('main-content');
  const fs=document.getElementById('form-screen').querySelector('.main');
  // Remove any existing fp-page overlay
  const oldFP=document.getElementById('fp-page');if(oldFP)oldFP.remove();
  if(state.cur===4){
    // Full-screen overlay: render into body, hide form-screen
    fs.className='main';
    document.getElementById('form-screen').style.display='none';
    document.getElementById('progress-wrap').style.display='none';
    const div=document.createElement('div');
    div.innerHTML=step4();
    document.body.appendChild(div.firstElementChild);
    initFP();
  } else {
    document.getElementById('form-screen').style.display='';
    document.getElementById('progress-wrap').style.display='';
    fs.className='main';
    if(state.cur===1) mc.innerHTML=step1();
    else if(state.cur===2) mc.innerHTML=step2();
    else if(state.cur===3) mc.innerHTML=step3();
    else if(state.cur===5) mc.innerHTML=step5();
  }
}
