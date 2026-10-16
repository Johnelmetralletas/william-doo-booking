import { data, state } from './state.js';
import { CONFIG } from './config.js';
import { esc } from './utils.js';
import { saveCurrentStep, validate } from './form.js';
import { computeCosts } from './steps.js';

export function buildPayload(id){
  const costs=computeCosts();
  const rnd=data.fpPieces.filter(p=>p.type==='round');
  const rec=data.fpPieces.filter(p=>p.type==='rect');
  const chr=data.fpPieces.filter(p=>p.type==='chair');
  const cru=data.fpPieces.filter(p=>p.type==='cruiser');
  return{
    bookingId:id,title:data.title,date:data.date,dateEnd:data.dateEnd,multiDay:data.multiDay?'Yes':'No',attendees:data.attendees,
    setupStart:data.setupStart,startTime:data.startTime,endTime:data.endTime,
    breakdownEnd:data.breakdownEnd,description:data.description,groupType:data.groupType,
    groupName:data.groupName,org1:data.org1,org1phone:data.org1phone,org1email:data.org1email,
    org2:data.org2,org2phone:data.org2phone,org3:data.org3,org3phone:data.org3phone,
    avPodiumA:data.avPodiumA,avFamiliar:data.avFamiliar,
    clickshare:data.clickshare,handheld:data.handheld,lapel:data.lapel,
    podiumMic:data.podiumMic,assistive:data.assistive,avNotes:data.avNotes,
    atrium:data.atrium,food:data.food,foodCatering:data.foodCatering,alcohol:data.alcohol,
    paymentType:data.paymentType,paymentDept:data.paymentDept,paymentGL:data.paymentGL,
    room:data.room, showPartition:data.showPartition!==false,
    studentGroup:data.studentGroup?'Yes':'No',
    requiresApproval:((data.groupType==='NC Group'||data.groupType==='NC Sponsored')&&data.studentGroup)?'Yes':'No',
    numDays:costs.days,estimatedRental:costs.rental,estimatedCustodial:costs.custodial,estimatedHST:costs.hst,estimatedTotal:costs.total,
    deposit:costs.deposit,
    policyAccepted:data.policyAccepted?'Yes':'No',
    roundTables:rnd.length,roundChairs:rnd.reduce((s,p)=>s+(p.chairs||0),0),
    rectTables:rec.length,rectChairs:rec.reduce((s,p)=>s+(p.chairs||0),0),
    looseChairs:chr.reduce((s,p)=>s+(p.qty||1),0),
    cruisers:cru.reduce((s,p)=>s+(p.qty||1),0),
    fpPieces:JSON.stringify(data.fpPieces),
    sig:data.sig,sigTitle:data.sigTitle,sigDate:data.sigDate,
    submittedAt:new Date().toISOString(),isUpdate:state.isEditing?'Yes':'No'
  };
}

// True once at least one backend (Sheets or EmailJS) is configured in .env.
function backendConfigured(){
  return !!CONFIG.SHEETS_WEBAPP_URL || !!(CONFIG.EMAILJS_PUBLIC_KEY && CONFIG.EMAILJS_SERVICE_ID);
}

export async function submitForm(){
  saveCurrentStep();if(!validate())return;
  const btn=document.getElementById('submit-btn');
  const lbl=document.getElementById('submit-label');
  const spn=document.getElementById('submit-spinner');
  btn.disabled=true;lbl.textContent='Sending…';spn.style.display='block';
  const bookingId=state.isEditing?state.editingId:'NC-'+Math.floor(100000+Math.random()*900000);
  const payload=buildPayload(bookingId);

  // Demo mode: nothing is wired up yet, so let the user test the whole flow
  // without hitting an error. Nothing is actually sent.
  if(!backendConfigured()){
    console.warn('[William Doo] Demo mode — no backend configured in .env, booking was NOT sent. See README “Going live”.');
    showSuccess(bookingId, true);
    return;
  }

  // 1) Record the booking in Google Sheets (best-effort: no-cors gives an
  //    opaque response, so we can't read success/failure, only network errors).
  if(CONFIG.SHEETS_WEBAPP_URL){
    try{
      await fetch(CONFIG.SHEETS_WEBAPP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:state.isEditing?'update':'create',data:payload})});
    }catch(err){ console.error('Sheets write failed:',err); }
  }

  // 2) Send the emails — each call is guarded so one failure doesn't lose the
  //    whole submission (the Sheet row is the record of truth).
  if(CONFIG.EMAILJS_PUBLIC_KEY && CONFIG.EMAILJS_SERVICE_ID){
    const subj=state.isEditing?`UPDATE ${bookingId} — ${data.title} · ${data.date}`:`New Booking ${bookingId} — ${data.title} · ${data.date}`;
    if(CONFIG.EMAILJS_TEMPLATE_ID){
      try{
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID,CONFIG.EMAILJS_TEMPLATE_ID,{
          to_email:CONFIG.OFFICE_EMAIL,subject:subj,booking_id:bookingId,
          is_update:state.isEditing?'⚠️ UPDATE':'NEW BOOKING',
          event_title:data.title,event_date:data.date,start_time:data.startTime,end_time:data.endTime,
          attendees:data.attendees,group_name:data.groupName,group_type:data.groupType,
          organizer:data.org1,organizer_email:data.org1email,organizer_phone:data.org1phone,
          room:data.room==='a'?'Room A only':'Room A + B',
          round_tables:payload.roundTables+' ('+payload.roundChairs+' chairs)',
          rect_tables:payload.rectTables+' ('+payload.rectChairs+' chairs)',
          loose_chairs:payload.looseChairs,cruisers:payload.cruisers,
          food:data.food,alcohol:data.alcohol,atrium:data.atrium,
          av_notes:data.avNotes||'None',description:data.description,
        },CONFIG.EMAILJS_PUBLIC_KEY);
      }catch(err){ console.error('Office notification email failed:',err); }
    }
    if(CONFIG.EMAILJS_CONFIRM_TEMPLATE && data.org1email){
      try{
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID,CONFIG.EMAILJS_CONFIRM_TEMPLATE,{
          to_email:data.org1email,to_name:data.org1,booking_id:bookingId,
          is_update:state.isEditing?'updated':'received',
          event_title:data.title,event_date:data.date,start_time:data.startTime,end_time:data.endTime,
          room:data.room==='a'?'Room A only':'Room A + B',
        },CONFIG.EMAILJS_PUBLIC_KEY);
      }catch(err){ console.error('Customer confirmation email failed:',err); }
    }
  }

  showSuccess(bookingId);
}

export function showSuccess(id, demo=false){
  document.getElementById('progress-wrap').style.display='none';
  document.getElementById('edit-banner').style.display='none';
  const demoNote = demo
    ? `<div class="notice warn" style="margin-bottom:1rem"><span class="notice-icon">🧪</span><span><strong>Demo mode.</strong> This booking was <strong>not</strong> actually sent — no backend is connected yet. Add your EmailJS &amp; Google Sheets keys to <code>.env</code> to go live (see the README).</span></div>`
    : '';
  document.getElementById('main-content').innerHTML=`
  ${demoNote}
  <div class="card success-wrap">
    <div class="success-icon">${state.isEditing?'✏️':'✓'}</div>
    <div class="success-title">${state.isEditing?'Booking updated!':'Booking request received!'}</div>
    <div class="success-sub">${state.isEditing
      ?`Your changes to booking <strong>${id}</strong> have been saved. The office has been notified with subject <em>"UPDATE ${id}"</em>.`
      :`Thank you, <strong>${esc(data.org1)}</strong>. Your request for <em>${esc(data.title)}</em> on <strong>${data.date}</strong> has been received. The New College team will contact you at <strong>${esc(data.org1email)}</strong> within 2–3 business days.`
    }</div>
    <div class="booking-id-box">
      <div class="booking-id-label">Your booking reference</div>
      <div class="booking-id-value">${id}</div>
      <div class="booking-id-hint">Save this number — you'll need it to edit your booking later</div>
    </div>
    <div class="success-ref">
      <div class="review-row" style="padding:6px 0"><span class="rk">Room</span><span class="rv">${data.room==='a'?'Room A only':'Room A + B'}</span></div>
      <div class="review-row" style="padding:6px 0"><span class="rk">Date &amp; time</span><span class="rv">${data.date} · ${data.startTime}–${data.endTime}</span></div>
      <div class="review-row" style="padding:6px 0"><span class="rk">Confirmation sent to</span><span class="rv">${esc(data.org1email)}</span></div>
      <div class="review-row" style="padding:6px 0;border-bottom:none"><span class="rk">Office notified</span><span class="rv">nc.roombookings@utoronto.ca</span></div>
    </div>
    <p style="font-size:13px;color:var(--gray-400);line-height:1.7">
      To edit later, return to this page and enter <strong>${id}</strong>.<br>
      Questions? <a href="mailto:nc.roombookings@utoronto.ca" style="color:var(--nc-blue)">nc.roombookings@utoronto.ca</a> · 416-946-0529
    </p>
    <button class="btn-next" style="margin-top:1.5rem" onclick="location.reload()">Make another booking</button>
  </div>`;
  window.scrollTo({top:0,behavior:'smooth'});
}
