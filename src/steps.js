import { data, state } from './state.js';
import { esc, gv, sv, showToast, showPopup } from './utils.js';
import { STEPS, CAPS, LIMITS, timeOptions } from './constants.js';

// Capacity reminder pop-up on the attendees field (shown once per session).
let attNoticeShown=false;
export function attendeesCapNotice(){
  if(attNoticeShown) return;
  attNoticeShown=true;
  showPopup('👥 Attendee capacity', `Please do not exceed the capacity of this venue or the number of attendees reported in this form.<ul><li>Room A: up to <strong>105</strong></li><li>Room A + B: up to <strong>250</strong> (up to <strong>465</strong> with no tables/chairs)</li></ul>`);
}

// ── ROOM SELECTION & COST ESTIMATE ──────────────────────────────────────────
// Room chosen here is the single source of truth; the floor-plan step follows it.
export function setRoom(r){
  data.room=r;
  document.querySelectorAll('.radio-opt[onclick^="setRoom"]').forEach(o=>
    o.classList.toggle('on', o.getAttribute('onclick').includes("'"+r+"'")));
  renderCostEstimate();
}

// Reads the live value from the DOM if the field is on screen, else saved data.
function liveVal(id, key){ const e=document.getElementById(id); return e?e.value.trim():(data[key]||''); }
function liveChecked(id, key){ const e=document.getElementById(id); return e?e.checked:!!data[key]; }

// Rules from the rate sheet: NC Group = rental waived; NC Sponsored / External pay
// (Room A $350/day, Room A+B $500/day). Custodial estimate by day of week.
export function computeCosts(){
  const group=data.groupType, room=data.room||'a';
  const paid = group==='NC Sponsored' || group==='External';
  // Rental per day by group (from the official rate schedules):
  //  NC Group  — waived.  NC Sponsored — Room A $350 / A+B $500.
  //  External  — Room A $350 / A+B $700.
  let rentalPerDay = 0;
  if(group==='NC Sponsored') rentalPerDay = room==='ab'?500:350;
  else if(group==='External') rentalPerDay = room==='ab'?700:350;
  const d1=liveVal('f-date','date'), multi=liveChecked('f-multiday','multiDay'), d2=liveVal('f-dateend','dateEnd');
  const endTime=liveVal('f-end','endTime');
  let dayList=[];
  if(d1){
    if(multi && d2){
      const a=new Date(d1+'T00:00'), b=new Date(d2+'T00:00');
      const n=Math.round((b-a)/86400000)+1;
      for(let i=0;i<(n>0?n:1);i++){ const dd=new Date(a); dd.setDate(a.getDate()+i); dayList.push(dd); }
    } else dayList=[new Date(d1+'T00:00')];
  }
  const days=dayList.length||1;
  const rental=rentalPerDay*days;
  let custodial=0; const custNotes=[];
  dayList.forEach(dd=>{
    const wd=dd.getDay();
    if(wd===0){custodial+=240;custNotes.push('Sun +$240');}
    else if(wd===6){custodial+=180;custNotes.push('Sat +$180');}
    else if(wd===5 && (!endTime||endTime>'14:00')){custodial+=180;custNotes.push('Fri after 2pm +$180');}
  });
  const subtotal=rental+custodial;
  const hst=Math.round(subtotal*0.13*100)/100;
  const total=Math.round((subtotal+hst)*100)/100;
  // External groups pay a $150/day non-refundable deposit with the form.
  const deposit = group==='External' ? 150*days : 0;
  return {group,room,paid,rentalPerDay,days,rental,custodial,custNotes,subtotal,hst,total,deposit};
}

const money=n=>'$'+n.toLocaleString('en-CA',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});

export function costEstimateHTML(){
  const cap = data.room==='ab' ? 'Room A + B — up to <strong>250</strong> seated (up to <strong>465</strong> with no tables/chairs)' : 'Room A — up to <strong>105</strong> seated';
  if(!data.groupType){
    return `<div class="notice"><span class="notice-icon">ℹ️</span><span>${cap}. Select a <strong>group type</strong> above to see an estimated cost.</span></div>`;
  }
  const c=computeCosts();
  const rentalLabel = c.paid ? `Room rental (${money(c.rentalPerDay)}/day × ${c.days} day${c.days>1?'s':''})` : 'Room rental (NC Group — waived)';
  const custodialRow = c.custodial>0
    ? `<div class="payment-row"><span class="payment-label">Custodial estimate (${c.custNotes.join(', ')})</span><span class="payment-value">${money(c.custodial)}</span></div>`
    : `<div class="payment-row"><span class="payment-label">Custodial fee</span><span class="payment-value">None (weekday)</span></div>`;
  return `
    <div class="notice" style="margin-bottom:10px"><span class="notice-icon">🏛️</span><span>${cap}.</span></div>
    <div class="payment-block">
      <div class="payment-header">Estimated cost — ${esc(c.group)}</div>
      <div class="payment-row"><span class="payment-label">${rentalLabel}</span><span class="payment-value">${money(c.rental)}</span></div>
      ${custodialRow}
      <div class="payment-row"><span class="payment-label">Subtotal</span><span class="payment-value">${money(c.subtotal)}</span></div>
      <div class="payment-row"><span class="payment-label">HST (13%)</span><span class="payment-value">${money(c.hst)}</span></div>
      <div class="payment-row" style="font-weight:700;border-top:1px solid var(--gray-200)"><span class="payment-label">Estimated total</span><span class="payment-value">${money(c.total)}</span></div>
      ${c.deposit>0?`<div class="payment-row"><span class="payment-label">Deposit due with form ($150/day × ${c.days})</span><span class="payment-value">${money(c.deposit)}</span></div>`:''}
    </div>
    ${c.deposit>0
      ? `<div class="notice warn" style="margin-top:8px;margin-bottom:0"><span class="notice-icon">💵</span><span>A <strong>$150/day non-refundable deposit (${money(c.deposit)})</strong> is required with your application; the <strong>balance is due two weeks before</strong> the event. Overtime and other extra charges are calculated later. Estimate assumes the default setup; holidays are billed at the Sunday rate. AV tech, overtime and alcohol are not included.</span></div>`
      : `<div class="notice warn" style="margin-top:8px;margin-bottom:0"><span class="notice-icon">ℹ️</span><span><strong>Overtime days and applicable extra charges will be calculated later.</strong> ${c.paid?'Payment is collected after the event (within one business day). ':''}This is an estimate assuming the default setup; holidays are billed at the Sunday rate. AV tech support, overtime, and alcohol service are not included. Internal debit-memo payments are HST-exempt.</span></div>`}`;
}

export function renderCostEstimate(){
  const el=document.getElementById('cost-estimate'); if(el) el.innerHTML=costEstimateHTML();
}

// Multi-day toggle: reveal the end-date picker and show the setup pop-up once.
let multiDayNoticeShown=false;
export function toggleMultiDay(checked){
  data.multiDay=!!checked;
  const row=document.getElementById('multiday-row'); if(row) row.style.display=checked?'':'none';
  if(!checked){ data.dateEnd=''; const e=document.getElementById('f-dateend'); if(e) e.value=''; }
  if(checked && !multiDayNoticeShown){
    multiDayNoticeShown=true;
    showPopup('🗓️ Multi-day events', `If your event runs across multiple dates, the <strong>setup must stay the same</strong> for every day.<br><br>If the setup changes between days, please submit a <strong>separate form for each setup</strong>.`);
  }
  renderCostEstimate();
}

export function selRadio(key,val,el){
  data[key]=val;
  el.closest('.radio-group').querySelectorAll('.radio-opt').forEach(e=>e.classList.remove('on'));
  el.classList.add('on');
  if(key==='food'){const fe=document.getElementById('food-extra');if(fe)fe.style.display=val==='Yes'?'':'none';}
  if(key==='alcohol'){const an=document.getElementById('alcohol-notice');if(an)an.style.display=val==='Yes'?'':'none';}
  if(key==='paymentType'){renderPaymentFields(val);}
  if(key==='groupType'){
    renderCostEstimate();
    // Show the "recognized student group" question only for NC groups.
    const isNC=val==='NC Group'||val==='NC Sponsored';
    const sf=document.getElementById('studentgroup-field'); if(sf) sf.style.display=isNC?'':'none';
    if(!isNC){ data.studentGroup=false; const cb=document.getElementById('f-studentgroup'); if(cb) cb.checked=false; const note=document.getElementById('orsl-note'); if(note) note.style.display='none'; }
    else { const note=document.getElementById('orsl-note'); if(note) note.style.display=data.studentGroup?'':'none'; }
  }
}
export function radioOpts(key,opts,curVal){
  return opts.map(o=>`<label class="radio-opt${curVal===o?' on':''}" onclick="selRadio('${key}','${o}',this)">
    <input type="radio" name="${key}"><span class="dot"></span>${o}</label>`).join('');
}
export function adjAV(key,d,max){
  data[key]=Math.max(0,Math.min(max,(data[key]||0)+d));
  const el=document.getElementById('av-'+key);if(el)el.textContent=data[key];
}

export function setPolicy(checked){
  data.policyAccepted=!!checked;
  const em=document.getElementById('err-f-policy'); if(em) em.classList.remove('show');
}
export function setStudentGroup(checked){
  data.studentGroup=!!checked;
  const note=document.getElementById('orsl-note');
  const isNC=data.groupType==='NC Group'||data.groupType==='NC Sponsored';
  if(note) note.style.display=(checked&&isNC)?'':'none';
}
export function showPolicies(){
  showPopup('📜 Rental policies, rates &amp; rules', `
    <p>Key terms (full regulations are in the rental agreement):</p>
    <ul>
      <li>Ensure your booking is <strong>approved before advertising</strong> your event.</li>
      <li>Submit requests <strong>at least 3 weeks</strong> in advance.</li>
      <li><strong>Payment is billed after the event</strong> (within one business day); fees are subject to 13% HST.</li>
      <li><strong>Cancellation:</strong> $150/day if cancelled more than 14 days out; full fee if less than 14 days.</li>
      <li>Occupancy limits must not be exceeded; organizers must be present and sign out keys.</li>
      <li>No outside food/beverages without authorization; alcohol needs 30 days' notice to UofT Beverage Services.</li>
      <li>Groups are liable for damage; a $5M liability insurance certificate may be required 30 days prior.</li>
      <li>Rooms must be vacated on time and left in original condition.</li>
    </ul>`);
}

// Keep the four event-time dropdowns in chronological order:
// setup < start < end < breakdown. Each later dropdown only offers times after
// the previous one; a selection that becomes invalid (e.g. setup moved past it)
// is cleared so the user re-picks it.
export function syncEventTimes(){
  let setup=gv('f-setup'), start=gv('f-start'), end=gv('f-end'), bd=gv('f-breakdown');
  // Drop any downstream value that is no longer strictly after the one before it.
  if(start && setup && start<=setup) start='';
  const startMin = start || setup;
  if(end && startMin && end<=startMin) end='';
  const endMin = end || startMin;
  if(bd && endMin && bd<=endMin) bd='';
  // Rebuild each dependent dropdown's options against its minimum, keeping
  // the (still-valid) current selection.
  const set=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html;};
  set('f-start', timeOptions(start, setup));
  set('f-end',   timeOptions(end, startMin));
  set('f-breakdown', timeOptions(bd, endMin));
  // Persist to state so re-renders (and the review step) stay consistent.
  data.setupStart=setup; data.startTime=start; data.endTime=end; data.breakdownEnd=bd;
  renderCostEstimate();
}

export function step1(){
  const editNote=state.isEditing?`<div class="notice warn" style="margin-bottom:1rem"><span class="notice-icon">✏️</span><span>Editing booking <strong>${state.editingId}</strong> — change any fields and submit to notify the office.</span></div>`:'';
  return `
  <div class="step-intro"><div class="step-tag">Step 1 of 5</div><div class="step-title">Tell us about your event</div></div>
  ${editNote}
  <div class="notice warn" style="margin-bottom:.5rem"><span class="notice-icon">📢</span><span><strong>Please ensure your application has been accepted and approved before advertising your event.</strong></span></div>
  <div class="notice" style="margin-bottom:1rem"><span class="notice-icon">🗓️</span><span>Please submit your reservation request <strong>at least three weeks before</strong> your event date.</span></div>
  <div class="card">
    <div class="card-header"><div class="card-icon">📋</div><div><div class="card-title">Event details</div><div class="card-subtitle">Basic information about your booking</div></div></div>
    <div class="field"><label>Title of the event <span class="req">*</span></label><input id="f-title" value="${esc(data.title)}" placeholder="e.g. Annual Student Gala 2026"><div class="field-error" id="err-f-title"></div></div>
    <div class="field-grid col2">
      <div class="field"><label>Event date <span class="req">*</span></label><input id="f-date" type="date" value="${data.date}" onchange="renderCostEstimate()"><div class="field-error" id="err-f-date"></div></div>
      <div class="field"><label>Estimated attendees <span class="req">*</span></label><input id="f-att" type="number" min="1" max="465" value="${data.attendees}" placeholder="e.g. 80" onfocus="attendeesCapNotice()"><div class="field-error" id="err-f-att"></div></div>
    </div>
    <label class="inline-check"><input type="checkbox" id="f-multiday" ${data.multiDay?'checked':''} onchange="toggleMultiDay(this.checked)"> My event lasts more than one day</label>
    <div id="multiday-row" style="${data.multiDay?'':'display:none'}">
      <div class="field-grid col2" style="margin-top:.5rem">
        <div class="field" style="margin-bottom:.4rem"><label>Event end date <span class="req">*</span></label><input id="f-dateend" type="date" value="${data.dateEnd||''}" onchange="renderCostEstimate()"><div class="field-error" id="err-f-dateend"></div></div>
        <div></div>
      </div>
      <div class="notice warn" style="margin-top:0"><span class="notice-icon">⚠️</span><span>The setup must stay the <strong>same across all dates</strong>. If the setup changes between days, submit a <strong>separate form per setup</strong>.</span></div>
    </div>
    <div class="field-grid col4">
      <div class="field"><label>Setup start</label><select id="f-setup" onchange="syncEventTimes()">${timeOptions(data.setupStart)}</select><div class="field-error" id="err-f-setup"></div></div>
      <div class="field"><label>Event start <span class="req">*</span></label><select id="f-start" onchange="syncEventTimes()">${timeOptions(data.startTime, data.setupStart)}</select><div class="field-error" id="err-f-start"></div></div>
      <div class="field"><label>Event end <span class="req">*</span></label><select id="f-end" onchange="syncEventTimes()">${timeOptions(data.endTime, data.startTime||data.setupStart)}</select><div class="field-error" id="err-f-end"></div></div>
      <div class="field"><label>Breakdown end</label><select id="f-breakdown" onchange="syncEventTimes()">${timeOptions(data.breakdownEnd, data.endTime||data.startTime||data.setupStart)}</select><div class="field-error" id="err-f-breakdown"></div></div>
    </div>
    <div class="notice warn" style="margin-top:0"><span class="notice-icon">⚠️</span><span>Events with setup/start time before 9:00 AM may be subject to overtime charges depending on setup requirements.</span></div>
    <div class="field" style="margin-top:1rem"><label>Detailed description <span class="req">*</span></label><textarea id="f-desc" placeholder="Describe the event, activities, and expected audience…">${esc(data.description)}</textarea><div class="field-error" id="err-f-desc"></div></div>
    <div class="field" style="margin-bottom:.6rem"><label>Group type <span class="req">*</span></label>
      <div class="radio-group">${radioOpts('groupType',['NC Group','NC Sponsored','External'],data.groupType)}</div>
      <div style="font-size:11.5px;color:var(--gray-400);margin-top:6px;line-height:1.5"><strong>NC Group</strong> — rental waived (approval required). <strong>NC Sponsored</strong> — an NC group hosting with an external group. <strong>External</strong> — non-NC UofT or outside group.</div>
    </div>
    <div class="field" id="studentgroup-field" style="${(data.groupType==='NC Group'||data.groupType==='NC Sponsored')?'':'display:none'};margin-bottom:0">
      <label class="inline-check"><input type="checkbox" id="f-studentgroup" ${data.studentGroup?'checked':''} onchange="setStudentGroup(this.checked)"> We are a UofT-recognized student group</label>
      <div id="orsl-note" class="notice" style="${data.studentGroup&&(data.groupType==='NC Group'||data.groupType==='NC Sponsored')?'':'display:none'};margin-top:8px;margin-bottom:0"><span class="notice-icon">✅</span><span>Recognized student groups must get <strong>ORSL approval</strong> first (<strong>new.studentlife@utoronto.ca</strong>). This booking will stay <strong>Pending</strong> until an ORSL staff member reviews and signs it.</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-icon">💰</div><div><div class="card-title">Room, capacity &amp; estimated cost</div><div class="card-subtitle">Choose your space to see capacity and an estimated cost</div></div></div>
    <div class="field" style="margin-bottom:.6rem"><label>Which space do you need? <span class="req">*</span></label>
      <div class="radio-group">
        <label class="radio-opt${data.room==='a'?' on':''}" onclick="setRoom('a')"><span class="dot"></span>Room A (up to 105)</label>
        <label class="radio-opt${data.room==='ab'?' on':''}" onclick="setRoom('ab')"><span class="dot"></span>Room A + B (up to 250)</label>
      </div>
    </div>
    <div id="cost-estimate">${costEstimateHTML()}</div>
  </div>
  <div class="nav"><span></span><button class="btn-next" onclick="goNext()">Contact info →</button></div>`;
}

// ═══════════════════════════════════════════════════════
//  STEP 2 — CONTACT
// ═══════════════════════════════════════════════════════
export function step2(){
  return `
  <div class="step-intro"><div class="step-tag">Step 2 of 5</div><div class="step-title">Who's organizing this event?</div></div>
  <div class="card">
    <div class="card-header"><div class="card-icon">👥</div><div><div class="card-title">Contact information</div><div class="card-subtitle">Organizers must be present at all times during the event</div></div></div>
    <div class="field"><label>Group / department name <span class="req">*</span></label><input id="f-gname" value="${esc(data.groupName)}" placeholder="e.g. New College Student Council"><div class="field-error" id="err-f-gname"></div></div>
    <div class="org-block">
      <div class="org-label">Primary organizer <span class="badge">Required</span></div>
      <div class="field-grid col2">
        <div class="field"><label>Full name <span class="req">*</span></label><input id="f-o1" value="${esc(data.org1)}" placeholder="Full name"><div class="field-error" id="err-f-o1"></div></div>
        <div class="field"><label>Cell number</label><input id="f-o1p" value="${esc(data.org1phone)}" placeholder="+1 416 000 0000" type="tel" inputmode="tel" oninput="this.value=this.value.replace(/[^0-9 +()-]/g,'').slice(0,20)"></div>
      </div>
      <div class="field" style="margin-bottom:0"><label>Email <span class="req">*</span></label><input id="f-o1e" value="${esc(data.org1email)}" placeholder="name@mail.utoronto.ca" type="email"><div class="field-error" id="err-f-o1e"></div></div>
    </div>
    <div class="org-block">
      <div class="org-label">Organizer 2 <span style="color:var(--gray-300);font-weight:400;text-transform:none;letter-spacing:0;font-size:11px">optional</span></div>
      <div class="field-grid col2" style="margin-bottom:0">
        <div class="field" style="margin-bottom:0"><label>Full name</label><input id="f-o2" value="${esc(data.org2)}" placeholder="Full name"></div>
        <div class="field" style="margin-bottom:0"><label>Cell number</label><input id="f-o2p" value="${esc(data.org2phone)}" placeholder="+1 416 000 0000" type="tel" inputmode="tel" oninput="this.value=this.value.replace(/[^0-9 +()-]/g,'').slice(0,20)"></div>
      </div>
    </div>
    <div class="org-block" style="margin-bottom:0">
      <div class="org-label">Organizer 3 <span style="color:var(--gray-300);font-weight:400;text-transform:none;letter-spacing:0;font-size:11px">optional</span></div>
      <div class="field-grid col2" style="margin-bottom:0">
        <div class="field" style="margin-bottom:0"><label>Full name</label><input id="f-o3" value="${esc(data.org3)}" placeholder="Full name"></div>
        <div class="field" style="margin-bottom:0"><label>Cell number</label><input id="f-o3p" value="${esc(data.org3phone)}" placeholder="+1 416 000 0000" type="tel" inputmode="tel" oninput="this.value=this.value.replace(/[^0-9 +()-]/g,'').slice(0,20)"></div>
      </div>
    </div>
    <div class="notice warn" style="margin-top:1rem"><span class="notice-icon">⚠️</span><span>Group organizers must be present at the event and sign out keys. You will need to leave a government-issued ID with the front desk.</span></div>
  </div>
  <div class="nav"><button class="btn-back" onclick="goBack()">← Back</button><button class="btn-next" onclick="goNext()">AV, Food & Payment →</button></div>`;
}

// ═══════════════════════════════════════════════════════
//  STEP 3 — AV, FOOD & PAYMENT
// ═══════════════════════════════════════════════════════
export function step3(){
  const avItems=[
    {id:'podiumMic',name:'Podium mic',desc:'Fixed podium microphone (max 1)',max:1},
    {id:'lapel',name:'Lavalier / lapel mic',desc:'Currently unavailable',max:0},
    {id:'clickshare',name:'ClickShare dongle',desc:'Connects PC to projector wirelessly (max 2)',max:2},
    {id:'handheld',name:'Handheld mic',desc:'Wireless handheld microphone (max 3)',max:3},
    {id:'assistive',name:'Assistive listening device',desc:'For guests with hearing loss (max 2)',max:2},
  ];
  return `
  <div class="step-intro"><div class="step-tag">Step 3 of 5</div><div class="step-title">Audio-visual, food &amp; payment</div></div>
  <div class="card">
    <div class="card-header"><div class="card-icon">🎤</div><div><div class="card-title">Audio-visual equipment</div><div class="card-subtitle">Podium A includes screen, HDMI, ClickShare &amp; mics</div></div></div>
    <div class="field-grid col2" style="margin-bottom:1rem">
      <div class="field"><label>Will you use Podium A?</label><div class="radio-group">${radioOpts('avPodiumA',['Yes','No'],data.avPodiumA)}</div></div>
      <div class="field"><label>Familiar with the AV equipment?</label><div class="radio-group">${radioOpts('avFamiliar',['Yes','No'],data.avFamiliar)}</div></div>
    </div>
    <div class="field"><label>Wireless devices needed</label>
      <div class="av-table">${avItems.map(it=>`<div class="av-row"><div><div class="av-name">${it.name}</div><div class="av-desc">${it.desc}</div></div><div class="qty-ctrl"><button class="qbtn" onclick="adjAV('${it.id}',-1,${it.max})">−</button><span class="qval" id="av-${it.id}">${data[it.id]||0}</span><button class="qbtn" onclick="adjAV('${it.id}',1,${it.max})">+</button></div></div>`).join('')}</div>
    </div>
    <div class="field" style="margin-bottom:0"><label>AV notes / special requests</label><textarea id="f-avnotes" placeholder="e.g. Request AV tech support — min. 2 weeks notice required ($50/hr + HST outside M–F 9am–5pm)">${esc(data.avNotes)}</textarea></div>
    <div class="notice"><span class="notice-icon">ℹ️</span><span><strong>Bring your own laptop.</strong> Event organizers are responsible for connecting to the projector. A setup manual is provided. AV tech support outside regular hours requires a 4-hour minimum at $50/hr + HST.</span></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-icon">🍽️</div><div><div class="card-title">Food, beverages &amp; atrium</div><div class="card-subtitle">No outside food or beverages without prior authorization</div></div></div>
    <div class="field">
      <label>Do you require the Atrium?</label>
      <div class="radio-group">${radioOpts('atrium',['Yes','No'],data.atrium)}</div>
      <div class="notice" style="margin-top:8px;margin-bottom:0"><span class="notice-icon">ℹ️</span><span>The Atrium is a <strong>shared student lounge space</strong> on ground level (max capacity: 50). Non-participants reserve the right to remain in the space during your event.</span></div>
    </div>
    <div class="field"><label>Will food be served?</label><div class="radio-group">${radioOpts('food',['Yes','No'],data.food)}</div></div>
    <div id="food-extra" style="${data.food==='Yes'?'':'display:none'}"><div class="field"><label>Catering type</label><div class="radio-group">${radioOpts('foodCatering',['UofT catering','External catering'],data.foodCatering)}</div></div></div>
    <div class="field" style="margin-bottom:0"><label>Will alcoholic beverages be served?</label><div class="radio-group">${radioOpts('alcohol',['Yes','No'],data.alcohol)}</div></div>
    <div id="alcohol-notice" class="notice danger" style="${data.alcohol==='Yes'?'':'display:none'}"><span class="notice-icon">🚨</span><span>Alcohol must be requested to UofT Beverage Services (416-978-6415) <strong>at least 30 days prior</strong>. Documentation required 2 weeks before. Auditorium licensed for 100–160 people max.</span></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-icon">💳</div><div><div class="card-title">Payment</div><div class="card-subtitle">Payment is collected after the event (within one business day) — no upfront deposit</div></div></div>
    <div class="payment-block">
      <div class="payment-header">Rate schedule (per day)</div>
      <div class="payment-row"><span class="payment-label">Room A rental fee (NC Group)</span><span class="payment-value">Waived</span></div>
      <div class="payment-row"><span class="payment-label">Room A rental fee (NC Sponsored / External)</span><span class="payment-value">$350 + HST</span></div>
      <div class="payment-row"><span class="payment-label">Room A+B rental fee (NC Group)</span><span class="payment-value">Waived</span></div>
      <div class="payment-row"><span class="payment-label">Room A+B rental fee (NC Sponsored / External)</span><span class="payment-value">$500 + HST</span></div>
      <div class="payment-row"><span class="payment-label">Custodial fee — Fri after 2pm / Sat</span><span class="payment-value">$180 (default setup) / $360 + HST</span></div>
      <div class="payment-row"><span class="payment-label">Custodial fee — Sun/Holiday</span><span class="payment-value">$240 (default setup) / $480 + HST</span></div>
      <div class="payment-row"><span class="payment-label">Overtime (before 9am Mon–Fri)</span><span class="payment-value">$45–$90/hr (min 4 hrs)</span></div>
      <div class="payment-row"><span class="payment-label">AV tech support (outside M–F 9am–5pm)</span><span class="payment-value">$65/hr + HST (min 4 hrs)</span></div>
      <div class="payment-row"><span class="payment-label">Cancellation fee (more than 14 days' notice)</span><span class="payment-value">$150/day</span></div>
    </div>
    <div class="notice"><span class="notice-icon">ℹ️</span><span>Payment is billed <strong>after</strong> the event (within one business day), by cheque (payable to <em>University of Toronto</em>) dropped at the Summer Residence Office (Room 1007, 40 Willcocks St), by credit/debit card, or — for NC departments — by internal debit memo. All fees are subject to 13% HST (no HST on internal debit memo).</span></div>
    <div class="field"><label>Payment method</label>
      <div class="radio-group">${radioOpts('paymentType',['Credit/debit card','Certified cheque / money order','Internal UofT debit memo','Send invoice'],data.paymentType)}</div>
    </div>
    <div id="payment-fields">${renderPaymentFieldsHTML(data.paymentType)}</div>
  </div>
  <div class="nav"><button class="btn-back" onclick="goBack()">← Back</button><button class="btn-next" onclick="goNext()">Floor plan →</button></div>`;
}

export function renderPaymentFieldsHTML(type){
  if(type==='Internal UofT debit memo'){
    return `<div class="field-grid col2" style="margin-top:.75rem">
      <div class="field"><label>Dept / Acct</label><input id="f-pdept" value="${esc(data.paymentDept)}" placeholder="Department / Account"></div>
      <div class="field"><label>Business officer name</label><input id="f-pacct" value="${esc(data.paymentAcct)}" placeholder="Name"></div>
      <div class="field"><label>Contact email</label><input id="f-pemail" value="${esc(data.paymentEmail)}" placeholder="email@utoronto.ca" type="email"></div>
      <div class="field"><label>Contact phone</label><input id="f-pphone" value="${esc(data.paymentPhone)}" placeholder="+1 416 000 0000" type="tel" inputmode="tel" oninput="this.value=this.value.replace(/[^0-9 +()-]/g,'').slice(0,20)"></div>
      <div class="field"><label>G/L #</label><input id="f-pgl" value="${esc(data.paymentGL)}" placeholder="G/L number"></div>
      <div class="field"><label>CFC #</label><input id="f-pcfc" value="${esc(data.paymentCFC)}" placeholder="CFC number"></div>
      <div class="field"><label>CC #</label><input id="f-pcc" value="${esc(data.paymentCC)}" placeholder="CC number"></div>
      <div class="field"><label>Fund I/O #</label><input id="f-pfund" value="${esc(data.paymentFund)}" placeholder="Fund I/O number"></div>
    </div>`;
  }
  if(type==='Credit/debit card'||type==='Certified cheque / money order'){
    return `<div class="notice success" style="margin-top:.75rem"><span class="notice-icon">✅</span><span>Payment is collected <strong>after</strong> the event at the <strong>Summer Residence Office, Room 1007, 40 Willcocks Street</strong> (within one business day). No upfront payment is required to confirm.</span></div>`;
  }
  if(type==='Send invoice'){
    return `<div class="notice success" style="margin-top:.75rem"><span class="notice-icon">✅</span><span>An invoice will be emailed to the primary organizer after the office reviews your booking. No additional details needed here.</span></div>`;
  }
  return '';
}
export function renderPaymentFields(type){
  const el=document.getElementById('payment-fields');
  if(el) el.innerHTML=renderPaymentFieldsHTML(type);
}

// ═══════════════════════════════════════════════════════
//  STEP 4 — FLOOR PLAN (full-screen overlay)
// ═══════════════════════════════════════════════════════

// ── STEP 5 — REVIEW ──
export function step5(){
  const rnd=data.fpPieces.filter(p=>p.type==='round');
  const rec=data.fpPieces.filter(p=>p.type==='rect');
  const chr=data.fpPieces.filter(p=>p.type==='chair');
  const cru=data.fpPieces.filter(p=>p.type==='cruiser');
  const c=computeCosts();
  const rl=data.room==='a'?'Room A only':'Room A + B (partition wall stacked)';
  const needsApproval=(data.groupType==='NC Group'||data.groupType==='NC Sponsored')&&data.studentGroup;
  const editNote=state.isEditing
    ?`<div class="notice warn" style="margin-bottom:1rem"><span class="notice-icon">✏️</span><span>Submitting will update booking <strong>${state.editingId}</strong>. The office will receive an <strong>UPDATE</strong> notification email.</span></div>`
    :`<div class="notice" style="margin-bottom:1rem"><span class="notice-icon">ℹ️</span><span>Review all details before submitting. ${c.deposit>0?`A <strong>$150/day deposit (${money(c.deposit)})</strong> is due with this application; the balance is due two weeks before the event.`:'Payment is collected <strong>after</strong> the event (within one business day).'} All fees are subject to 13% HST.</span></div>`;
  const approvalNote=needsApproval
    ?`<div class="notice warn" style="margin-bottom:1rem"><span class="notice-icon">🕑</span><span>As a recognized student group, this booking requires <strong>ORSL approval</strong>. After you submit, it stays <strong>Pending</strong> until an ORSL staff member reviews and signs it.</span></div>`:'';
  return `
  <div class="step-intro"><div class="step-tag">Step 5 of 5</div><div class="step-title">Review &amp; submit</div></div>
  ${editNote}
  ${approvalNote}
  <div class="review-block">
    <div class="review-block-header">📋 Event details</div>
    <div class="review-row"><span class="rk">Event title</span><span class="rv">${esc(data.title)||'—'}</span></div>
    <div class="review-row"><span class="rk">Date</span><span class="rv">${data.multiDay&&data.dateEnd?`${data.date} → ${data.dateEnd}`:(data.date||'—')}</span></div>
    <div class="review-row"><span class="rk">Time</span><span class="rv">${data.startTime||'—'} – ${data.endTime||'—'}</span></div>
    <div class="review-row"><span class="rk">Setup / breakdown</span><span class="rv">${data.setupStart||'—'} / ${data.breakdownEnd||'—'}</span></div>
    <div class="review-row"><span class="rk">Est. attendees</span><span class="rv">${data.attendees||'—'}</span></div>
    <div class="review-row"><span class="rk">Group type</span><span class="rv">${data.groupType||'—'}${needsApproval?' · recognized student group':''}</span></div>
    ${needsApproval?`<div class="review-row"><span class="rk">Approval</span><span class="rv">Pending ORSL sign-off</span></div>`:''}
  </div>
  <div class="review-block">
    <div class="review-block-header">👥 Contact</div>
    <div class="review-row"><span class="rk">Group / dept</span><span class="rv">${esc(data.groupName)||'—'}</span></div>
    <div class="review-row"><span class="rk">Primary organizer</span><span class="rv">${esc(data.org1)||'—'}</span></div>
    <div class="review-row"><span class="rk">Email</span><span class="rv">${esc(data.org1email)||'—'}</span></div>
    <div class="review-row"><span class="rk">Phone</span><span class="rv">${esc(data.org1phone)||'—'}</span></div>
    ${data.org2?`<div class="review-row"><span class="rk">Organizer 2</span><span class="rv">${esc(data.org2)}</span></div>`:''}
  </div>
  <div class="review-block">
    <div class="review-block-header">🎤 AV &amp; food</div>
    <div class="review-row"><span class="rk">Podium A</span><span class="rv">${data.avPodiumA||'—'}</span></div>
    <div class="review-row"><span class="rk">ClickShare / Handheld / Lapel</span><span class="rv">${data.clickshare} / ${data.handheld} / ${data.lapel}</span></div>
    <div class="review-row"><span class="rk">Podium mic / Assistive</span><span class="rv">${data.podiumMic} / ${data.assistive}</span></div>
    <div class="review-row"><span class="rk">Atrium</span><span class="rv">${data.atrium||'No'}</span></div>
    <div class="review-row"><span class="rk">Food / alcohol</span><span class="rv">${data.food==='Yes'?(data.foodCatering||'Yes'):'No'} / ${data.alcohol||'No'}</span></div>
  </div>
  <div class="review-block">
    <div class="review-block-header">💰 Estimated cost</div>
    <div class="review-row"><span class="rk">Room</span><span class="rv">${data.room==='ab'?'Room A + B':'Room A'}${c.days>1?` · ${c.days} days`:''}</span></div>
    <div class="review-row"><span class="rk">Rental</span><span class="rv">${c.paid?money(c.rental):'Waived (NC Group)'}</span></div>
    ${c.custodial>0?`<div class="review-row"><span class="rk">Custodial estimate</span><span class="rv">${money(c.custodial)}</span></div>`:''}
    <div class="review-row"><span class="rk">HST (13%)</span><span class="rv">${money(c.hst)}</span></div>
    <div class="review-row" style="font-weight:700"><span class="rk">Estimated total</span><span class="rv">${money(c.total)}</span></div>
    <div class="review-row" style="border-bottom:none"><span class="rk" style="font-size:11px;color:var(--gray-400)">Overtime & extra charges calculated later</span><span class="rv"></span></div>
  </div>
  <div class="review-block">
    <div class="review-block-header">💳 Payment</div>
    <div class="review-row"><span class="rk">Payment method</span><span class="rv">${data.paymentType||'Not specified'}</span></div>
    ${data.paymentType==='Internal UofT debit memo'&&data.paymentDept?`<div class="review-row"><span class="rk">Dept / Acct</span><span class="rv">${esc(data.paymentDept)}</span></div>`:''}
    ${data.paymentType==='Internal UofT debit memo'&&data.paymentGL?`<div class="review-row"><span class="rk">G/L # / CFC # / CC #</span><span class="rv">${esc(data.paymentGL)} / ${esc(data.paymentCFC)} / ${esc(data.paymentCC)}</span></div>`:''}
  </div>
  <div class="review-block">
    <div class="review-block-header">🗺️ Floor plan — ${rl}</div>
    <div class="review-row"><span class="rk">Round 5′ tables</span><span class="rv">${rnd.length} tables · ${rnd.reduce((s,p)=>s+(p.chairs||0),0)} chairs</span></div>
    <div class="review-row"><span class="rk">Rectangle 6′ tables</span><span class="rv">${rec.length} tables · ${rec.reduce((s,p)=>s+(p.chairs||0),0)} chairs</span></div>
    <div class="review-row"><span class="rk">Loose chairs</span><span class="rv">${chr.reduce((s,p)=>s+(p.qty||1),0)}</span></div>
    <div class="review-row"><span class="rk">Cruiser tables</span><span class="rv">${cru.reduce((s,p)=>s+(p.qty||1),0)}</span></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-icon">✍️</div><div><div class="card-title">Signature &amp; agreement</div><div class="card-subtitle">By signing you confirm you have read the rental regulations and policies</div></div></div>
    <div class="sig-area">
      <div class="field-grid col3">
        <div class="field" style="margin-bottom:0"><label>Full name (signature) <span class="req">*</span></label><input id="f-sig" value="${esc(data.sig)}" placeholder="Type your full legal name"><div class="field-error" id="err-f-sig"></div></div>
        <div class="field" style="margin-bottom:0"><label>Title / role</label><input id="f-sigtitle" value="${esc(data.sigTitle)}" placeholder="e.g. President, Student Council"></div>
        <div class="field" style="margin-bottom:0"><label>Date <span class="req">*</span></label><input id="f-sigdate" type="date" value="${data.sigDate}"><div class="field-error" id="err-f-sigdate"></div></div>
      </div>
      <div style="font-size:11.5px;color:var(--gray-400);margin-top:12px;line-height:1.6">I confirm I have read and agree to the William Doo Auditorium Facility Rental Regulations and Policies, including cancellation, liability, and insurance terms.</div>
    </div>
  </div>
  <div class="policy-gate">
    <label>
      <input type="checkbox" id="f-policy" ${data.policyAccepted?'checked':''} onchange="setPolicy(this.checked)">
      <span>I have read and accept the William Doo Auditorium <button type="button" class="link-btn" onclick="showPolicies()">rental policies, rates &amp; rules</button>. <span class="req">*</span></span>
    </label>
    <div class="field-error" id="err-f-policy" style="margin-left:28px"></div>
  </div>
  <div class="nav">
    <button class="btn-back" onclick="goBack()">← Back</button>
    <button class="btn-submit" id="submit-btn" onclick="submitForm()">
      <span id="submit-label">${state.isEditing?'✓ Submit update':'✓ Submit booking'}</span>
      <span class="btn-spinner" id="submit-spinner"></span>
    </button>
  </div>`;
}
