import { data } from './state.js';

// Small shared helpers: HTML-escape, read field value, save value, toast.
export function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function gv(id){const e=document.getElementById(id);return e?e.value.trim():'';}
export function sv(key,id){data[key]=gv(id);}
export function showToast(msg,dur=3500){
  const t=document.getElementById('toast');
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',dur);
}

// Centre-screen pop-up dialog. `body` is HTML. Dismissed by the button or backdrop.
export function showPopup(title, body){
  const old=document.getElementById('app-modal'); if(old) old.remove();
  const overlay=document.createElement('div');
  overlay.id='app-modal';
  overlay.className='app-modal-overlay';
  overlay.innerHTML=`
    <div class="app-modal" role="dialog" aria-modal="true">
      <div class="app-modal-title">${title}</div>
      <div class="app-modal-body">${body}</div>
      <div class="app-modal-actions"><button type="button" class="app-modal-ok">Got it</button></div>
    </div>`;
  const close=()=>overlay.remove();
  overlay.addEventListener('click',e=>{ if(e.target===overlay) close(); });
  overlay.querySelector('.app-modal-ok').addEventListener('click',close);
  document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);} });
  document.body.appendChild(overlay);
}
