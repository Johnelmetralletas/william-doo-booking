import { data, state } from './state.js';
import { showToast } from './utils.js';
import { showForm, renderAll } from './form.js';
import { CONFIG } from './config.js';

export function startNew(){
  Object.assign(data,{
    bookingId:'',title:'',date:'',dateEnd:'',multiDay:false,attendees:'',setupStart:'',startTime:'',endTime:'',
    breakdownEnd:'',description:'',groupType:'',studentGroup:false,
    groupName:'',org1:'',org1phone:'',org1email:'',
    org2:'',org2phone:'',org3:'',org3phone:'',
    avPodiumA:'',avFamiliar:'',
    clickshare:0,handheld:0,lapel:0,podiumMic:0,assistive:0,avNotes:'',
    atrium:'',food:'',foodCatering:'',alcohol:'',
    paymentType:'',paymentDept:'',paymentAcct:'',paymentContact:'',paymentEmail:'',paymentPhone:'',paymentGL:'',paymentCFC:'',paymentCC:'',paymentFund:'',
    room:'a',fpPieces:[],fpIdN:0,showPartition:true,fpTextMode:false,sig:'',sigDate:'',sigTitle:'',policyAccepted:false
  });
  state.isEditing=false; state.editingId=null; state.cur=1;
  showForm();
}

export function toggleRetrieve(){
  const w=document.getElementById('retrieve-wrap');
  const hidden=w.style.display==='none'||w.style.display==='';
  w.style.display=hidden?'block':'none';
  if(hidden) setTimeout(()=>{const i=document.getElementById('retrieve-id-input');if(i)i.focus();},50);
}

export async function doRetrieve(){
  const id=document.getElementById('retrieve-id-input').value.trim().toUpperCase();
  const errEl=document.getElementById('retrieve-error');
  errEl.style.display='none';
  if(!id){errEl.textContent='Please enter a booking ID.';errEl.style.display='block';return;}
  const btn=document.querySelector('.btn-retrieve');
  btn.textContent='Loading…'; btn.disabled=true;
  try{
    const res=await fetch(`${CONFIG.SHEETS_WEBAPP_URL}?action=get&id=${encodeURIComponent(id)}`);
    const json=await res.json();
    if(!json.success||!json.booking){
      errEl.textContent='Booking ID not found. Please check your confirmation email.';
      errEl.style.display='block';
      btn.textContent='Load booking'; btn.disabled=false; return;
    }
    const b=json.booking;
    Object.assign(data,b);
    if(typeof data.fpPieces==='string') data.fpPieces=JSON.parse(data.fpPieces||'[]');
    ['clickshare','handheld','lapel','podiumMic','assistive'].forEach(k=>data[k]=parseInt(data[k])||0);
    state.isEditing=true; state.editingId=id; state.cur=1;
    showForm();
    document.getElementById('edit-banner').style.display='';
    document.getElementById('banner-id').textContent=id;
  }catch(e){
    errEl.textContent='Could not connect. Please try again.';
    errEl.style.display='block';
  }
  btn.textContent='Load booking'; btn.disabled=false;
}

