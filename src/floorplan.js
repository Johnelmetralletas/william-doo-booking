import { data, state } from './state.js';
import { esc, gv, sv, showToast } from './utils.js';
import { CAPS, LIMITS } from './constants.js';
import { renderAll } from './form.js';

export function step4(){
  return `
<div class="fp-page" id="fp-page">

  <!-- TOP CHROME -->
  <div class="fp-header-bar">
    <div>
      <h2>Floor plan — ${data.room==='a'?'Room A':'Room A &amp; B'}</h2>
      <div class="fp-header-sub">Step 4 of 5 · Drag furniture onto the plan to design your layout</div>
    </div>
    <div class="fp-nav-btns">
      <button class="fp-btn-back" onclick="fpExitStep(-1)">← Back</button>
      <button class="fp-btn-fwd" onclick="fpExitStep(1)">Continue to review →</button>
    </div>
  </div>

  <!-- INSTRUCTIONS STRIP (above the toolbar so it's seen first) -->
  <div class="fp-inst-strip">
    <span class="fp-inst-lead">💡 How to use this builder</span>
    <span>1️⃣ <strong>Pick your room</strong> — Room A (105 seats) or A+B (250 seats)</span>
    <span>2️⃣ <strong>Choose a preset</strong> or drag furniture from the toolbar below onto the plan</span>
    <span>3️⃣ <strong>Click a piece to select it</strong> — its controls then appear: <strong>− +</strong> chairs, <strong>↺ ↻</strong> rotate, <strong>⇅</strong> flip chairs to one side, <strong>×</strong> remove</span>
    <span>4️⃣ <strong>Drag any piece</strong> to reposition it on the plan</span>
    <span style="color:#9a6a1a">💡 Bulk loose chairs: type a number in the toolbar and click "+ Add"</span>
    <span style="color:#9a6a1a">✏️ Use <strong>Text label</strong> to drop a note; 🧱 toggle the <strong>Partition wall</strong> to open the full space</span>
  </div>

  <!-- HORIZONTAL TOOLBAR -->
  <div class="fp-toolbar" id="fp-toolbar">

    <!-- Room -->
    <div class="tb-group">
      <div class="tb-label">Room</div>
      <div class="tb-room-btns">
        <button class="room-btn${data.room==='a'?' on':''}" id="frbA" onclick="fpSetRoom('a')">Room A</button>
        <button class="room-btn${data.room==='ab'?' on':''}" id="frbAB" onclick="fpSetRoom('ab')">A + B</button>
      </div>
    </div>

    <div class="cap-badge" id="fp-cap">Cap: ${CAPS[data.room]}</div>

    <div class="tb-divider"></div>

    <!-- Presets -->
    <div class="tb-group">
      <div class="tb-label">Quick presets</div>
      <div style="display:flex;gap:5px">
        <button class="preset-btn" onclick="fpApplyPreset('tables')">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="2.5" r="1.2" fill="currentColor"/><circle cx="7" cy="11.5" r="1.2" fill="currentColor"/><circle cx="2.5" cy="7" r="1.2" fill="currentColor"/><circle cx="11.5" cy="7" r="1.2" fill="currentColor"/></svg>
          8 tables × 6 chairs
        </button>
        <button class="preset-btn" onclick="fpApplyPreset('lecture')">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="2" width="5" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="2" width="5" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="8" width="5" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="8" width="5" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
          105 loose chairs
        </button>
        <button class="preset-btn" onclick="fpApplyPreset('ab')">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="4" cy="4" r="2.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="10" cy="4" r="2.6" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="1.5" y="9" width="11" height="3.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
          A+B: 10 tables + 120 chairs
        </button>
        <button class="preset-btn" onclick="fpApplyPreset('clear')" style="color:var(--nc-red);border-color:rgba(192,57,43,.25)">
          ✕ Clear
        </button>
      </div>
    </div>

    <div class="tb-divider"></div>

    <!-- Furniture palette -->
    <div class="tb-group">
      <div class="tb-label">Drag to place</div>
      <div style="display:flex;gap:6px">
        <div class="fp-fi" id="fi-round" draggable="true" ondragstart="fpDragStart(event,'round')">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="9" fill="rgba(26,61,107,.12)" stroke="#1a3d6b" stroke-width="1.8"/>
            <circle cx="16" cy="7.5" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
            <circle cx="16" cy="24.5" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
            <circle cx="7.5" cy="16" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
            <circle cx="24.5" cy="16" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
            <circle cx="10" cy="10" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
            <circle cx="22" cy="22" r="2" fill="rgba(45,106,45,.7)" stroke="#2d6a2d" stroke-width=".7"/>
          </svg>
          Round table
        </div>
        <div class="fp-fi" id="fi-rect" draggable="true" ondragstart="fpDragStart(event,'rect')">
          <svg width="36" height="28" viewBox="0 0 36 28">
            <rect x="4" y="7" width="28" height="14" rx="2" fill="rgba(83,58,183,.12)" stroke="#534AB7" stroke-width="1.8"/>
            <rect x="7" y="2" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
            <rect x="15" y="2" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
            <rect x="23" y="2" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
            <rect x="7" y="21" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
            <rect x="15" y="21" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
            <rect x="23" y="21" width="6" height="5" rx="1" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>
          </svg>
          Rect table
        </div>
        <div class="fp-fi" id="fi-rect0" draggable="true" ondragstart="fpDragStart(event,'rect0')">
          <svg width="36" height="28" viewBox="0 0 36 28">
            <rect x="4" y="9" width="28" height="12" rx="2" fill="rgba(110,102,96,.12)" stroke="#6e6660" stroke-width="1.8"/>
            <path d="M12 13l12 4M24 13l-12 4" stroke="#6e6660" stroke-width=".9"/>
          </svg>
          Rect (no chairs)
        </div>
        <div class="fp-fi" id="fi-chair" draggable="true" ondragstart="fpDragStart(event,'chair')">
          <svg width="22" height="24" viewBox="0 0 22 24">
            <rect x="2" y="2" width="18" height="13" rx="3" fill="rgba(45,106,45,.18)" stroke="#2d6a2d" stroke-width="1.8"/>
            <rect x="5" y="15" width="12" height="5" rx="2" fill="#2d6a2d" opacity=".4"/>
            <rect x="5" y="19" width="3" height="4" rx="1" fill="#2d6a2d" opacity=".35"/>
            <rect x="14" y="19" width="3" height="4" rx="1" fill="#2d6a2d" opacity=".35"/>
          </svg>
          Loose chair
        </div>
        <div class="fp-fi" id="fi-cruiser" draggable="true" ondragstart="fpDragStart(event,'cruiser')">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" fill="rgba(184,134,11,.14)" stroke="#b8860b" stroke-width="1.8"/>
            <circle cx="14" cy="6" r="2" fill="rgba(184,134,11,.5)" stroke="#b8860b" stroke-width=".7"/>
            <circle cx="14" cy="22" r="2" fill="rgba(184,134,11,.5)" stroke="#b8860b" stroke-width=".7"/>
            <circle cx="6" cy="14" r="2" fill="rgba(184,134,11,.5)" stroke="#b8860b" stroke-width=".7"/>
            <circle cx="22" cy="14" r="2" fill="rgba(184,134,11,.5)" stroke="#b8860b" stroke-width=".7"/>
          </svg>
          Cruiser
        </div>
      </div>
    </div>

    <div class="tb-divider"></div>

    <!-- Multi-chair add -->
    <div class="tb-group">
      <div class="tb-label">Add loose chairs</div>
      <div class="tb-chair-add">
        <input type="number" id="chair-qty-input" min="1" max="105" value="10">
        <button onclick="fpAddChairGroup()">+ Add</button>
      </div>
    </div>

    <div class="tb-divider"></div>

    <!-- Text label tool -->
    <div class="tb-group">
      <div class="tb-label">Add text</div>
      <button class="tb-text-btn" id="tb-text-btn" onclick="fpActivateTextTool()">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <rect x="2" y="2" width="18" height="18" rx="3" fill="rgba(184,134,11,.1)" stroke="#b8860b" stroke-width="1.5"/>
          <text x="11" y="15" text-anchor="middle" font-size="11" fill="#b8860b" font-weight="700" font-family="sans-serif">T</text>
        </svg>
        Text label
      </button>
    </div>

    <div class="tb-divider"></div>

    <!-- Partition wall toggle -->
    <div class="tb-group">
      <div class="tb-label">Partition wall</div>
      <button class="tb-toggle active" id="tb-partition-btn" onclick="fpTogglePartition()">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="1" y="6" width="12" height="2" fill="currentColor" opacity=".7"/>
          <line x1="3" y1="2" x2="3" y2="12" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.5"/>
          <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.5"/>
          <line x1="11" y1="2" x2="11" y2="12" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.5"/>
        </svg>
        Wall visible
      </button>
    </div>

    <div class="tb-divider"></div>

    <!-- Live summary -->
    <div class="tb-summary">
      <div class="tb-sum-item"><span class="tb-sum-val" id="fpc-tables">0</span><span class="tb-sum-lbl">Tables</span></div>
      <div class="tb-sum-item"><span class="tb-sum-val" id="fpc-chairs">0</span><span class="tb-sum-lbl">Chairs</span></div>
      <div class="tb-sum-item"><span class="tb-sum-val" id="fpc-c">0</span><span class="tb-sum-lbl">Loose</span></div>
      <div class="tb-sum-item"><span class="tb-sum-val" id="fpc-cr">0</span><span class="tb-sum-lbl">Cruisers</span></div>
    </div>
  </div>

  <!-- FULL-WIDTH CANVAS -->
  <div class="fp-canvas" id="fp-canvas"
    ondragover="event.preventDefault()"
    ondrop="fpDrop(event)">
    <svg id="fp-svg-base" xmlns="http://www.w3.org/2000/svg"
      style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></svg>
    <div class="fp-hint" id="fp-hint">
      🪑 Drag furniture here to build your layout<br>
      <span style="font-size:11px">or choose a preset from the toolbar above</span>
    </div>
  </div>

</div>`;
}
// ═══════════════════════════════════════════════════════
//  FLOOR PLAN LOGIC
// ═══════════════════════════════════════════════════════
let fpDragType=null,fpMovingId=null,fpSelId=null,fpOffX=0,fpOffY=0;
const ROOM_RECTS = {
  // viewBox coords of droppable area for Room A and Room B
  a:  {x:40,y:30,w:520,h:320},
  ab: {x:40,y:30,w:520,h:580}
};

export function roomLabel(){return data.room==='a'?'Room A':'Room A+B';}

export function fpSetRoom(r){
  const prev=data.room; data.room=r;
  document.getElementById('frbA').className='room-btn'+(r==='a'?' on':'');
  document.getElementById('frbAB').className='room-btn'+(r==='ab'?' on':'');
  if(r==='a'&&prev==='ab') fpTrimToLimits();
  const h=document.querySelector('.fp-header-bar h2');
  if(h) h.textContent='Floor plan — '+(r==='a'?'Room A':'Room A & B');
  // Update cap badge
  fpUpdateCap();
  fpDrawBaseMap();
  fpRender(); fpUpdateCounters(); fpUpdateDragHandles();
}

export function fpTrimToLimits(){
  const lim=LIMITS.a;
  const tables=data.fpPieces.filter(p=>p.type==='round'||p.type==='rect');
  if(tables.length>lim.tables){
    const ids=tables.slice(lim.tables).map(p=>p.id);
    data.fpPieces=data.fpPieces.filter(p=>!ids.includes(p.id));
    showToast('Trimmed to Room A table limit (max '+lim.tables+')');
  }
  let overC=data.fpPieces.filter(p=>p.type==='chair').reduce((s,p)=>s+(p.qty||1),0)-lim.looseChairs;
  if(overC>0){
    const arr=data.fpPieces.filter(p=>p.type==='chair');
    for(let i=arr.length-1;i>=0&&overC>0;i--){
      const p=data.fpPieces.find(x=>x.id===arr[i].id);if(!p)continue;
      const cut=Math.min(p.qty||1,overC);p.qty=(p.qty||1)-cut;overC-=cut;
      if(p.qty<=0)data.fpPieces=data.fpPieces.filter(x=>x.id!==p.id);
    }
    showToast('Loose chairs trimmed to Room A max ('+lim.looseChairs+')');
  }
}

export function fpApplyPreset(type){
  fpClear();
  if(type==='clear'){ showToast('Floor plan cleared'); return; }
  const canvas=document.getElementById('fp-canvas');if(!canvas)return;
  // Wait for FP_SAFE to be populated (set by fpDrawBaseMap)
  const safe=window.FP_SAFE||{x1:55,y1:96,x2:canvas.offsetWidth-35,y2:340,midX:canvas.offsetWidth/2,midY:220};
  const safeW=safe.x2-safe.x1;
  const safeH=safe.y2-safe.y1;

  if(type==='tables'){
    const cols=4, rows=2;
    const padX=70, padY=30;
    const gapX=(safeW-padX*2)/cols;
    const gapY=(safeH-padY*2)/rows;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        data.fpPieces.push({
          id:'fp'+(++data.fpIdN),type:'round',
          x: safe.x1+padX+gapX*c+gapX/2,
          y: safe.y1+padY+gapY*r+gapY/2,
          chairs:6, rot:0
        });
      }
    }
    showToast('Standard layout: 8 round tables × 6 chairs each');
  } else if(type==='lecture'){
    const zw=Math.min(safeW*0.82, 640);
    const zh=160;
    data.fpPieces.push({
      id:'fp'+(++data.fpIdN),
      type:'chairzone',
      x: safe.midX,
      y: safe.y1+safeH*0.45,
      qty:105, rot:0, w:zw, h:zh
    });
    showToast('Lecture layout: 105 loose chairs zone placed');
  } else if(type==='ab'){
    // Full A+B layout: switch to A+B, remove the partition wall, place 10 round
    // tables (6 chairs each) in Room A + a 120 loose-chair zone in Room B.
    data.room='ab'; data.showPartition=false;
    const frbA=document.getElementById('frbA'), frbAB=document.getElementById('frbAB');
    if(frbA) frbA.className='room-btn'; if(frbAB) frbAB.className='room-btn on';
    const pb=document.getElementById('tb-partition-btn');
    if(pb){ pb.classList.remove('active'); pb.textContent='⬜ Wall hidden'; }
    fpDrawBaseMap();                               // redraw as A+B, wall off → refreshes FP_SAFE
    const s=window.FP_SAFE||safe;
    const sw=s.x2-s.x1, sh=s.y2-s.y1;
    const cols=5, rows=2, padX=50, padY=16;
    const gx=(sw-padX*2)/cols, gy=(sh-padY*2)/rows;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      data.fpPieces.push({id:'fp'+(++data.fpIdN),type:'round',
        x:s.x1+padX+gx*c+gx/2, y:s.y1+padY+gy*r+gy/2, chairs:6, rot:0});
    }
    const roomBY=(s.ROOM_B_TOP!=null?s.ROOM_B_TOP:s.y2+200)+150;
    data.fpPieces.push({id:'fp'+(++data.fpIdN),type:'chairzone',x:s.midX,y:roomBY,qty:120,rot:0});
    showToast('A+B layout: 10 tables × 6 chairs + 120 loose chairs (wall removed)');
  }
  const h=document.getElementById('fp-hint');
  if(h&&data.fpPieces.length) h.style.display='none';
  fpRender(); fpUpdateCounters(); fpUpdateCap(); fpUpdateDragHandles();
}
export function fpClear(){
  data.fpPieces=[];fpSelId=null;
  fpRender();fpUpdateCounters();fpUpdateCap();fpUpdateDragHandles();
  const h=document.getElementById('fp-hint');if(h)h.style.display='block';
}

// ── TEXT LABEL TOOL ──────────────────────────────────────────────────────────
export function fpActivateTextTool(){
  data.fpTextMode = !data.fpTextMode;
  const btn = document.getElementById('tb-text-btn');
  if(btn){
    btn.classList.toggle('active', data.fpTextMode);
    btn.title = data.fpTextMode ? 'Click on the map to place a text label' : '';
  }
  const canvas = document.getElementById('fp-canvas');
  if(canvas) canvas.style.cursor = data.fpTextMode ? 'text' : 'default';
  if(data.fpTextMode) showToast('Click anywhere on the map to place a text label', 3000);
}

export function fpAddTextLabel(x, y){
  const id = 'fp'+(++data.fpIdN);
  data.fpPieces.push({id, type:'textlabel', x, y, text:'Label', rot:0});
  // Deactivate text mode after placing
  data.fpTextMode = false;
  const btn = document.getElementById('tb-text-btn');
  if(btn) btn.classList.remove('active');
  const canvas = document.getElementById('fp-canvas');
  if(canvas) canvas.style.cursor = 'default';
  const h = document.getElementById('fp-hint');
  if(h) h.style.display='none';
  fpRender(); fpUpdateCounters(); fpUpdateCap();
  // Auto-open edit mode on the newly placed label
  setTimeout(()=>fpEditLabel(id), 50);
}

export function fpEditLabel(id){
  const el = document.querySelector('.fp-textlabel[data-id="'+id+'"]');
  if(!el) return;
  el.classList.add('editing');
  const input = el.querySelector('.tl-edit');
  const box   = el.querySelector('.tl-box');
  if(!input) return;
  const p = data.fpPieces.find(p=>p.id===id);
  input.value = p ? p.text : '';
  input.focus();
  input.select();
  input.onblur = ()=>fpSaveLabel(id);
  input.onkeydown = (e)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();fpSaveLabel(id);} if(e.key==='Escape'){el.classList.remove('editing');} };
}

export function fpSaveLabel(id){
  const el = document.querySelector('.fp-textlabel[data-id="'+id+'"]');
  if(!el) return;
  const input = el.querySelector('.tl-edit');
  const p = data.fpPieces.find(p=>p.id===id);
  if(p && input) p.text = input.value || 'Label';
  el.classList.remove('editing');
  fpRender();
}

// ── PARTITION TOGGLE ─────────────────────────────────────────────────────────
export function fpTogglePartition(){
  data.showPartition = (data.showPartition === false) ? true : false;
  const shown = data.showPartition !== false;
  const btn = document.getElementById('tb-partition-btn');
  if(btn){
    btn.classList.toggle('active', shown);
    btn.textContent = shown ? '🧱 Wall visible' : '⬜ Wall hidden';
  }
  // Remove overlay immediately for instant feedback
  const oldWall = document.getElementById('fp-wall-overlay');
  if(oldWall) oldWall.remove();
  // Redraw map (will re-add overlay if shown=true)
  fpDrawBaseMap();
  showToast(shown
    ? 'Partition wall restored'
    : 'Partition wall removed — rooms A & B open as one space');
}

export function fpExitStep(dir){
  // Called from floor plan nav buttons — exit full-screen, go back or forward
  const fp=document.getElementById('fp-page');if(fp)fp.remove();
  document.getElementById('form-screen').style.display='';
  document.getElementById('progress-wrap').style.display='';
  if(dir===1){state.cur++;} else {state.cur--;}
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
}

export function initFP(){
  const canvas=document.getElementById('fp-canvas');if(!canvas)return;
  // NB: dragover/drop are already wired via inline ondragover/ondrop in step4()'s
  // markup — registering them again here would fire fpDrop twice and double every
  // dropped piece. Only the click handler needs wiring.
  canvas.addEventListener('click',(e)=>{
    if(data.fpTextMode){
      // Place a new text label where user clicked (include scroll offset)
      const r=canvas.getBoundingClientRect();
      fpAddTextLabel(e.clientX-r.left+canvas.scrollLeft, e.clientY-r.top+canvas.scrollTop);
      return;
    }
    fpSelId=null; fpRender();
  });
  // Small delay so the browser has laid out the full-screen div and we can read real dimensions
  setTimeout(()=>{
    fpDrawBaseMap();
    fpRender();fpUpdateCounters();fpUpdateCap();fpUpdateDragHandles();
    if(data.fpPieces.length>0){const h=document.getElementById('fp-hint');if(h)h.style.display='none';}
    // Redraw on resize
    window.onresize=()=>fpDrawBaseMap();
  },50);
}

export function fpDrawBaseMap(){
  const svg=document.getElementById('fp-svg-base');if(!svg)return;
  const isAB=data.room==='ab';
  const W=svg.clientWidth||window.innerWidth||1200;
  // Room is shifted right so the Main entrance + STAIRS sit in a left wing,
  // outside the room — matching the venue sketch.
  const RX=118;                  // room left wall
  const RMARGIN=26;              // gap to the right edge
  const rw=W-RX-RMARGIN;         // room width
  const RCX=RX+rw/2;             // room horizontal centre
  const RR=RX+rw;                // room right wall
  const TOTAL_H=1200;

  // ── KEY CHANGE: one continuous room box from top to bottom ──
  // When wall is shown, a floating overlay div marks the partition.
  // When wall is hidden, the whole space is open — no structural break.
  const ROOM_TOP  = 22;
  const STAGE_H   = 24;
  const ROOM_A_BOT= 520;   // where Room A content area ends
  const PART_Y    = ROOM_A_BOT + 14;  // partition overlay sits here
  const ROOM_B_TOP= PART_Y + 22;      // Room B content starts here
  const ROOM_BOT  = ROOM_B_TOP + 580; // bottom of the unified room

  svg.setAttribute('viewBox','0 0 '+W+' '+TOTAL_H);
  svg.style.height=TOTAL_H+'px';

  const dimBHatch='#6e6660';

  svg.innerHTML=`
  <defs>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${dimBHatch}" stroke-width="1"/>
    </pattern>
    <filter id="shadow" x="-5%" y="-5%" width="112%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity=".08"/>
    </filter>
  </defs>

  <!-- Accessible (top, centred over the room) -->
  <text x="${RCX}" y="16" text-anchor="middle" font-size="13" fill="#1a1612" font-family="DM Sans,sans-serif">Accessible</text>

  <!-- Main floor entrance (top-left, outside the room) -->
  <rect x="4" y="18" width="90" height="78" rx="1" fill="#ffffff" stroke="#2a2420" stroke-width="1.6"/>
  <text x="49" y="52" text-anchor="middle" font-size="13" fill="#1a1612" font-family="DM Sans,sans-serif">Main floor</text>
  <text x="49" y="68" text-anchor="middle" font-size="13" fill="#1a1612" font-family="DM Sans,sans-serif">entrance</text>
  <!-- STAIRS column connecting the entrance to the room's upper-left -->
  <rect x="${RX-26}" y="52" width="26" height="130" fill="#ffffff" stroke="#2a2420" stroke-width="1.6"/>
  <text x="${RX-13}" y="117" text-anchor="middle" font-size="16" fill="#1a1612" font-family="DM Sans,sans-serif" letter-spacing="1" transform="rotate(-90,${RX-13},117)">STAIRS</text>

  <!-- ══ ROOM BOX (shifted right; left wing holds entrance + stairs) ══ -->
  <rect x="${RX}" y="${ROOM_TOP}" width="${rw}" height="${ROOM_BOT-ROOM_TOP}"
    fill="white" stroke="#2a2420" stroke-width="2.4" rx="1"/>

  <!-- ── ROOM A ── -->
  <text x="${RX+18}" y="${ROOM_TOP+26}" font-size="13" fill="#1a1612" font-family="DM Sans,sans-serif">south side. room A</text>
  <!-- Screen (wide bar near the top) -->
  <rect x="${RCX-rw*0.22}" y="${ROOM_TOP+32}" width="${rw*0.44}" height="28" rx="1" fill="#ffffff" stroke="#2a2420" stroke-width="1.6"/>
  <text x="${RCX}" y="${ROOM_TOP+52}" text-anchor="middle" font-size="17" fill="#1a1612" font-family="DM Sans,sans-serif">Screen</text>
  <!-- Podium A (ellipse, left side near the entrance door) -->
  <ellipse cx="${RX+120}" cy="${ROOM_TOP+150}" rx="58" ry="19" fill="#ffffff" stroke="#2a2420" stroke-width="1.4"/>
  <text x="${RX+120}" y="${ROOM_TOP+155}" text-anchor="middle" font-size="12.5" fill="#1a1612" font-family="DM Sans,sans-serif">Podium A</text>

  <!-- Entrance / Exit (upper, left wall) with door-swing arc -->
  <text x="${RX-86}" y="${ROOM_TOP+176}" font-size="11" fill="#1a1612" font-family="DM Sans,sans-serif">Entrance/ Exit</text>
  <line x1="${RX}" y1="${ROOM_TOP+184}" x2="${RX+32}" y2="${ROOM_TOP+184}" stroke="#2a2420" stroke-width="1.6"/>
  <path d="M${RX+32} ${ROOM_TOP+184} A 32 32 0 0 1 ${RX} ${ROOM_TOP+216}" fill="none" stroke="#2a2420" stroke-width="1.1"/>

  <!-- Partition wall divider (line + label) — hidden when the wall is toggled off -->
  ${data.showPartition!==false ? `<line x1="${RX}" y1="${PART_Y+8}" x2="${RR}" y2="${PART_Y+8}" stroke="#2a2420" stroke-width="1.6"/><text x="${RCX}" y="${PART_Y+2}" text-anchor="middle" font-size="12" fill="#1a1612" font-family="DM Sans,sans-serif">Partition wall divider</text>` : `<text x="${RCX}" y="${PART_Y+2}" text-anchor="middle" font-size="11" fill="#9a9286" font-style="italic" font-family="DM Sans,sans-serif">partition wall removed — open space</text>`}

  <!-- ── ROOM B ── -->
  <text x="${RX+50}" y="${ROOM_B_TOP+34}" font-size="13" fill="#1a1612" font-family="DM Sans,sans-serif">south side. room B</text>
  <!-- Small structural box, top-left wall -->
  <rect x="${RX}" y="${ROOM_B_TOP}" width="34" height="120" fill="#ffffff" stroke="#2a2420" stroke-width="1.2"/>

  <!-- Open event floor — flexible area for chairs & tables -->
  <rect x="${RX+86}" y="${ROOM_B_TOP+46}" width="${rw-150}" height="150" rx="4" fill="none" stroke="#bdb6aa" stroke-width="1" stroke-dasharray="6 5"/>
  <text x="${RX+86+(rw-150)/2}" y="${ROOM_B_TOP+126}" text-anchor="middle" font-size="11" fill="#9a9286" font-family="DM Sans,sans-serif" font-style="italic">Open event floor — drag chairs &amp; tables here</text>

  <!-- Balcony sitting (left wall, above the fixed seating) -->
  <rect x="${RX}" y="${ROOM_B_TOP+150}" width="22" height="96" rx="11" fill="#ffffff" stroke="#2a2420" stroke-width="1"/>
  <text x="${RX+11}" y="${ROOM_B_TOP+198}" text-anchor="middle" font-size="9" fill="#1a1612" font-family="DM Sans,sans-serif" transform="rotate(-90,${RX+11},${ROOM_B_TOP+198})">Balcony sitting</text>

  <!-- Entrance / Exit (lower, left wall — above the fixed seating) -->
  <text x="${RX-86}" y="${ROOM_B_TOP+268}" font-size="11" fill="#1a1612" font-family="DM Sans,sans-serif">Entrance/ Exit</text>
  <line x1="${RX}" y1="${ROOM_B_TOP+276}" x2="${RX+32}" y2="${ROOM_B_TOP+276}" stroke="#2a2420" stroke-width="1.6"/>
  <path d="M${RX+32} ${ROOM_B_TOP+276} A 32 32 0 0 1 ${RX} ${ROOM_B_TOP+308}" fill="none" stroke="#2a2420" stroke-width="1.1"/>

  <!-- Fixed tiered seating for 130 — spans the full room width, with the
       staircases running up each side of the stepped bleacher seating. -->
  <rect x="${RX}" y="${ROOM_B_TOP+318}" width="${rw}" height="150" fill="#ffffff" stroke="#2a2420" stroke-width="1.4"/>
  <!-- centre: stepped seating, drawn as tiers -->
  <rect x="${RX+34}" y="${ROOM_B_TOP+318}" width="${rw-68}" height="150" fill="#bdb7ae" stroke="#2a2420" stroke-width="1.2"/>
  <line x1="${RX+34}" y1="${ROOM_B_TOP+344}" x2="${RR-34}" y2="${ROOM_B_TOP+344}" stroke="#8d877d" stroke-width=".8"/>
  <line x1="${RX+34}" y1="${ROOM_B_TOP+370}" x2="${RR-34}" y2="${ROOM_B_TOP+370}" stroke="#8d877d" stroke-width=".8"/>
  <line x1="${RX+34}" y1="${ROOM_B_TOP+422}" x2="${RR-34}" y2="${ROOM_B_TOP+422}" stroke="#8d877d" stroke-width=".8"/>
  <line x1="${RX+34}" y1="${ROOM_B_TOP+448}" x2="${RR-34}" y2="${ROOM_B_TOP+448}" stroke="#8d877d" stroke-width=".8"/>
  <text x="${RCX}" y="${ROOM_B_TOP+398}" text-anchor="middle" font-size="14" fill="#1a1612" font-family="DM Sans,sans-serif">Fixed seating for 130</text>
  <!-- left staircase (up the side of the seating) -->
  <text x="${RX+17}" y="${ROOM_B_TOP+393}" text-anchor="middle" font-size="12" fill="#1a1612" font-family="DM Sans,sans-serif" letter-spacing="1" transform="rotate(-90,${RX+17},${ROOM_B_TOP+393})">STAIRS</text>
  <!-- right staircase -->
  <text x="${RR-17}" y="${ROOM_B_TOP+393}" text-anchor="middle" font-size="12" fill="#1a1612" font-family="DM Sans,sans-serif" letter-spacing="1" transform="rotate(-90,${RR-17},${ROOM_B_TOP+393})">STAIRS</text>

  <!-- Main double doors at the bottom wall, with swing arcs -->
  <line x1="${RCX-54}" y1="${ROOM_BOT}" x2="${RCX-4}" y2="${ROOM_BOT}" stroke="#2a2420" stroke-width="2"/>
  <line x1="${RCX+4}" y1="${ROOM_BOT}" x2="${RCX+54}" y2="${ROOM_BOT}" stroke="#2a2420" stroke-width="2"/>
  <path d="M${RCX-54} ${ROOM_BOT} A 50 50 0 0 0 ${RCX-4} ${ROOM_BOT+50}" fill="none" stroke="#2a2420" stroke-width="1.1"/>
  <path d="M${RCX+54} ${ROOM_BOT} A 50 50 0 0 1 ${RCX+4} ${ROOM_BOT+50}" fill="none" stroke="#2a2420" stroke-width="1.1"/>
  `;

  // The partition is now drawn inline in the SVG (above), so the old floating
  // HTML overlay is no longer needed — clear any leftover instance.
  const oldWall = document.getElementById('fp-wall-overlay');
  if(oldWall) oldWall.remove();

  // Drop zone used by presets — the open area of Room A, in the shifted geometry.
  window.FP_SAFE = {
    x1: RX+28, y1: ROOM_TOP+124,
    x2: RR-28, y2: ROOM_A_BOT-20,
    midX: RCX, midY: (ROOM_TOP+124 + ROOM_A_BOT-20)/2,
    PART_Y, ROOM_B_TOP, ROOM_A_BOT
  };
}

export function fpDragStart(e,t){
  const el=document.getElementById('fi-'+t);
  if(el&&el.classList.contains('disabled')){e.preventDefault();return;}
  fpDragType=t;fpMovingId=null;e.dataTransfer.setData('text',t);
}

export function fpDrop(e){
  e.preventDefault();
  const canvas=document.getElementById('fp-canvas');if(!canvas)return;
  const r=canvas.getBoundingClientRect();
  // Add scroll offset so pieces land where dropped even when scrolled to Room B.
  const x=e.clientX-r.left+canvas.scrollLeft, y=e.clientY-r.top+canvas.scrollTop;
  if(fpMovingId){
    const p=data.fpPieces.find(p=>p.id===fpMovingId);
    if(p){p.x=x-fpOffX;p.y=y-fpOffY;}
    fpMovingId=null;fpDragType=null;fpRender();return;
  }
  const t=fpDragType||e.dataTransfer.getData('text');
  if(!t||t==='move')return;
  const lim=LIMITS[data.room]||LIMITS.a;
  const isRound = t==='round';
  const isRect  = t==='rect'||t==='rect0';   // rect0 = rectangle with no chairs
  // Round and rectangle tables have independent limits, so rect tables can be
  // added even once the round-table limit is reached.
  if(isRound && data.fpPieces.filter(p=>p.type==='round').length>=lim.tables){
    showToast('Max '+lim.tables+' round tables for '+roomLabel()+'. Remove one first.');fpDragType=null;return;
  }
  if(isRect && data.fpPieces.filter(p=>p.type==='rect').length>=lim.rect){
    showToast('Max '+lim.rect+' rectangle tables. Remove one first.');fpDragType=null;return;
  }
  if(t==='chair'&&data.fpPieces.filter(p=>p.type==='chair').reduce((s,p)=>s+(p.qty||1),0)>=lim.looseChairs){
    showToast('Max '+lim.looseChairs+' loose chairs for '+roomLabel()+'.');fpDragType=null;return;
  }
  if(t==='cruiser'&&data.fpPieces.filter(p=>p.type==='cruiser').reduce((s,p)=>s+(p.qty||1),0)>=lim.cruisers){
    showToast('Max '+lim.cruisers+' cruiser tables.');fpDragType=null;return;
  }
  const np={id:'fp'+(++data.fpIdN),type:isRect?'rect':t,x,y,rot:0};
  if(isRound) np.chairs=6;
  else if(isRect){ np.chairs = t==='rect0'?0:6; np.chairSide='both'; }
  else np.qty=1;
  data.fpPieces.push(np);
  fpDragType=null;
  const h=document.getElementById('fp-hint');if(h)h.style.display='none';
  fpRender();fpUpdateCounters();fpUpdateCap();fpUpdateDragHandles();
}

export function fpAddChairGroup(){
  const inp=document.getElementById('chair-qty-input');
  const qty=Math.max(1,Math.min(105,parseInt(inp.value)||1));
  const lim=LIMITS[data.room]||LIMITS.a;
  const current=data.fpPieces.filter(p=>p.type==='chair').reduce((s,p)=>s+(p.qty||1),0);
  const allowed=Math.min(qty, lim.looseChairs-current);
  if(allowed<=0){showToast('Loose chair limit reached ('+lim.looseChairs+') for '+roomLabel()+'.');return;}
  const canvas=document.getElementById('fp-canvas');
  const cx=canvas?canvas.offsetWidth/2:400, cy=canvas?canvas.offsetHeight/3:200;
  data.fpPieces.push({id:'fp'+(++data.fpIdN),type:'chair',x:cx,y:cy,qty:allowed,rot:0});
  if(allowed<qty) showToast('Added '+allowed+' chairs (limit reached for '+roomLabel()+').');
  const h=document.getElementById('fp-hint');if(h)h.style.display='none';
  fpRender();fpUpdateCounters();fpUpdateCap();fpUpdateDragHandles();
}

export function fpRender(){
  const canvas=document.getElementById('fp-canvas');if(!canvas)return;
  canvas.querySelectorAll('.fp-dp').forEach(e=>e.remove());
  canvas.querySelectorAll('.fp-textlabel').forEach(e=>e.remove());
  data.fpPieces.forEach(p=>{
    // ── TEXT LABEL ──
    if(p.type==='textlabel'){
      const el=document.createElement('div');
      el.className='fp-textlabel'+(p.id===fpSelId?' sel':'');
      el.setAttribute('data-id',p.id);
      el.style.cssText=`left:${p.x}px;top:${p.y}px`;
      el.innerHTML=`
        <div class="tl-box">${(p.text||'Label').split('\n').join('<br>')}</div>
        <textarea class="tl-edit" rows="2">${p.text||'Label'}</textarea>`;
      // Delete button
      const db=document.createElement('button');
      db.className='fp-delbtn';db.textContent='×';
      db.addEventListener('click',ev=>{ev.stopPropagation();fpRemove(p.id);});
      el.appendChild(db);
      // Drag to reposition
      el.draggable=true;
      el.addEventListener('dragstart',ev=>{
        ev.stopPropagation();fpMovingId=p.id;fpDragType=null;
        const b=el.getBoundingClientRect();
        fpOffX=ev.clientX-b.left-b.width/2;fpOffY=ev.clientY-b.top-b.height/2;
        ev.dataTransfer.setData('text','move');
      });
      // Single click = select; double click = edit
      el.addEventListener('click',ev=>{
        ev.stopPropagation();
        fpSelId=(fpSelId===p.id)?null:p.id;
        fpRender();
      });
      el.addEventListener('dblclick',ev=>{
        ev.stopPropagation();
        fpSelId=p.id;
        fpRender();
        fpEditLabel(p.id);
      });
      canvas.appendChild(el);
      return; // skip the regular piece rendering below
    }

    // ── REGULAR FURNITURE PIECE ──
    const el=document.createElement('div');
    el.className='fp-dp'+(p.id===fpSelId?' sel':'');
    el.style.cssText=`left:${p.x}px;top:${p.y}px`;
    const svgWrap=document.createElement('div');
    svgWrap.className='fp-piece-svg';
    svgWrap.style.transform=`rotate(${p.rot||0}deg)`;
    svgWrap.innerHTML=fpSVG(p);
    el.appendChild(svgWrap);
    // Chair count controls (tables)
    if(p.type==='round'||p.type==='rect'){
      const ctrl=document.createElement('div');ctrl.className='fp-ctrls';
      ctrl.innerHTML=`<button class="fp-cadj" onclick="fpAdj('${p.id}',-1)">−</button><span class="fp-cnum">${p.chairs??6}</span><button class="fp-cadj" onclick="fpAdj('${p.id}',1)">+</button>`;
      el.appendChild(ctrl);
    } else {
      const ctrl=document.createElement('div');ctrl.className='fp-ctrls';
      ctrl.innerHTML=`<button class="fp-cadj" onclick="fpAdj('${p.id}',-1)">−</button><span class="fp-cnum">${p.qty||1}</span><button class="fp-cadj" onclick="fpAdj('${p.id}',1)">+</button>`;
      el.appendChild(ctrl);
    }
    // Rectangle tables: toggle whether chairs sit on both sides or one side
    if(p.type==='rect' && (p.chairs??6)>0){
      const sb=document.createElement('div');sb.className='fp-sidetoggle';
      const oneSide=(p.chairSide||'both')==='one';
      sb.innerHTML=`<button class="fp-sbtn" onclick="fpToggleSide('${p.id}')" title="Switch which side the chairs sit on">⇅ ${oneSide?'One side':'Both sides'}</button>`;
      el.appendChild(sb);
    }
    // Rotation controls
    const rot=document.createElement('div');rot.className='fp-rotate';
    rot.innerHTML=`<button class="fp-rbtn" onclick="fpRotate('${p.id}',-15)" title="Rotate left">↺</button><span class="fp-rlbl">${p.rot||0}°</span><button class="fp-rbtn" onclick="fpRotate('${p.id}',15)" title="Rotate right">↻</button>`;
    el.appendChild(rot);
    // Delete
    const db=document.createElement('button');db.className='fp-delbtn';db.textContent='×';
    db.addEventListener('click',ev=>{ev.stopPropagation();fpRemove(p.id);});
    el.appendChild(db);
    el.draggable=true;
    el.addEventListener('dragstart',ev=>{
      ev.stopPropagation();fpMovingId=p.id;fpDragType=null;
      const b=el.getBoundingClientRect();
      fpOffX=ev.clientX-b.left-b.width/2;fpOffY=ev.clientY-b.top-b.height/2;
      ev.dataTransfer.setData('text','move');
    });
    el.addEventListener('click',ev=>{ev.stopPropagation();fpSelId=(fpSelId===p.id)?null:p.id;fpRender();});
    canvas.appendChild(el);
  });
}

// Render a bulk group of loose chairs as a grid of small chair icons (one icon
// per chair), with the total labelled underneath. Scales to any count (e.g. the
// 105 / 120 loose-chair maximums) by wrapping at 10 chairs per row.
function chairGridSVG(n){
  const cols=Math.min(10,Math.max(1,n));
  const rows=Math.ceil(n/cols);
  const cell=14, padX=8, padTop=8, labelH=17;
  const gridW=cols*cell, gridH=rows*cell;
  const W=gridW+padX*2, H=gridH+padTop+labelH+6;
  let icons='', drawn=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols&&drawn<n;c++,drawn++){
      const gx=padX+c*cell, gy=padTop+r*cell;
      icons+=`<g transform="translate(${gx},${gy})">`
        +`<rect x="2.5" y="2" width="9" height="6.5" rx="1.6" fill="rgba(45,106,45,.28)" stroke="#2d6a2d" stroke-width="1"/>`
        +`<rect x="4" y="8.4" width="6" height="2.3" rx="1" fill="#2d6a2d" opacity=".55"/>`
        +`</g>`;
    }
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x="1" y="1" width="${W-2}" height="${gridH+padTop+4}" rx="3" fill="rgba(45,106,45,.05)" stroke="#2d6a2d" stroke-width="1.2"/>${icons}<text x="${W/2}" y="${H-4}" text-anchor="middle" font-size="9.5" fill="#1a4a1a" font-weight="700" font-family="DM Sans,sans-serif">${n} chairs</text></svg>`;
}

export function fpSVG(p){
  if(p.type==='round'){
    const n=Math.min(p.chairs??6,6);let cs='';
    for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2-Math.PI/2;const cx=26+Math.cos(a)*22,cy=26+Math.sin(a)*22;cs+=`<rect x="${cx-4.5}" y="${cy-3.5}" width="9" height="7" rx="2" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8" transform="rotate(${(i/n)*360},${cx},${cy})"/>`;}
    return`<svg width="64" height="64" viewBox="0 0 52 52"><circle cx="26" cy="26" r="14" fill="rgba(26,61,107,.15)" stroke="#1a3d6b" stroke-width="2"/><text x="26" y="30" text-anchor="middle" font-size="7.5" fill="#1a3d6b" font-weight="700">R 5′</text>${cs}</svg>`;
  }
  if(p.type==='rect'){
    const n=Math.min(p.chairs??6,6);
    const side=p.chairSide||'both';
    const chair=(x,y)=>`<rect x="${x}" y="${y}" width="9" height="7" rx="2" fill="rgba(45,106,45,.65)" stroke="#2d6a2d" stroke-width=".8"/>`;
    let cs='';
    if(side==='one'){                       // all chairs on one side (e.g. a check-in station)
      for(let i=0;i<n;i++){ cs+=chair(12+i*(44/(n+1)),1); }
    } else {                                 // split top / bottom
      const top=Math.ceil(n/2),bot=Math.floor(n/2);
      for(let i=0;i<top;i++){ cs+=chair(12+i*(44/(top+1)),1); }
      for(let i=0;i<bot;i++){ cs+=chair(12+i*(44/(bot+1)),40); }
    }
    return`<svg width="82" height="60" viewBox="0 0 66 48"><rect x="7" y="10" width="52" height="28" rx="3" fill="rgba(83,74,183,.16)" stroke="#534AB7" stroke-width="2"/><text x="33" y="28" text-anchor="middle" font-size="7.5" fill="#534AB7" font-weight="700">Rect 6′</text>${cs}</svg>`;
  }
  if(p.type==='chair'){
    const q=p.qty||1;
    // A single loose chair = one chair icon; a bulk group = a grid of chair icons.
    if(q>1) return chairGridSVG(q);
    return`<svg width="38" height="38" viewBox="0 0 30 30"><rect x="1" y="1" width="24" height="17" rx="3" fill="rgba(45,106,45,.2)" stroke="#2d6a2d" stroke-width="1.6"/><rect x="5" y="18" width="15" height="6" rx="2" fill="#2d6a2d" opacity=".4"/></svg>`;
  }
  if(p.type==='chairzone'){
    return chairGridSVG(p.qty||1);
  }
  if(p.type==='cruiser'){
    const q=p.qty||1;
    return`<svg width="46" height="46" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="rgba(184,134,11,.16)" stroke="#b8860b" stroke-width="1.6"/><text x="18" y="22" text-anchor="middle" font-size="9" fill="#b8860b" font-weight="700">CR</text>${q>1?`<circle cx="30" cy="6" r="7" fill="#b8860b"/><text x="30" y="10" text-anchor="middle" font-size="7.5" fill="white" font-weight="700">${q}</text>`:''}</svg>`;
  }
  return'';
}

export function fpAdj(id,d){
  const p=data.fpPieces.find(p=>p.id===id);if(!p)return;
  const lim=LIMITS[data.room]||LIMITS.a;
  const isT=p.type==='round'||p.type==='rect';
  if(isT){p.chairs=Math.max(0,Math.min(6,(p.chairs??6)+d));}
  else{
    const maxQ=p.type==='chair'?lim.looseChairs:lim.cruisers;
    const other=data.fpPieces.filter(x=>x.id!==p.id&&x.type===p.type).reduce((s,x)=>s+(x.qty||1),0);
    const nq=Math.max(1,(p.qty||1)+d);
    if(d>0&&other+nq>maxQ){showToast('Max '+maxQ+' '+(p.type==='chair'?'loose chairs':'cruisers')+' for '+roomLabel()+'.');return;}
    p.qty=Math.max(1,Math.min(maxQ-other,(p.qty||1)+d));
  }
  fpRender();fpUpdateCounters();fpUpdateCap();
}

export function fpRotate(id,deg){
  const p=data.fpPieces.find(p=>p.id===id);if(!p)return;
  p.rot=((p.rot||0)+deg+360)%360;
  fpRender();
}

// Toggle whether a rectangle table's chairs sit on both sides or all on one side.
export function fpToggleSide(id){
  const p=data.fpPieces.find(p=>p.id===id);if(!p||p.type!=='rect')return;
  p.chairSide=(p.chairSide||'both')==='one'?'both':'one';
  fpRender();
}

export function fpRemove(id){
  data.fpPieces=data.fpPieces.filter(p=>p.id!==id);
  if(fpSelId===id)fpSelId=null;
  fpRender();fpUpdateCounters();fpUpdateCap();fpUpdateDragHandles();
  if(!data.fpPieces.length){const h=document.getElementById('fp-hint');if(h)h.style.display='block';}
}

export function fpUpdateCounters(){
  const tables=data.fpPieces.filter(p=>p.type==='round'||p.type==='rect');
  const chr=data.fpPieces.filter(p=>p.type==='chair'||p.type==='chairzone');
  const cru=data.fpPieces.filter(p=>p.type==='cruiser');
  const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  s('fpc-tables',tables.length);
  s('fpc-chairs',tables.reduce((a,p)=>a+(p.chairs??0),0));
  s('fpc-c',chr.reduce((a,p)=>a+(p.qty||1),0));
  s('fpc-cr',cru.reduce((a,p)=>a+(p.qty||1),0));
}

export function fpUpdateCap(){
  const cap=CAPS[data.room]||105;
  const total=data.fpPieces.reduce((s,p)=>{
    if(p.type==='textlabel') return s;
    if(p.type==='chair'||p.type==='chairzone') return s+(p.qty||1);
    if(p.type==='round'||p.type==='rect') return s+(p.chairs||0);
    return s;
  },0);
  const el=document.getElementById('fp-cap');if(!el)return;
  if(total===0){el.textContent='Cap: '+cap;el.className='cap-badge';}
  else if(total>cap){el.textContent='⚠ Over cap! ('+total+'/'+cap+')';el.className='cap-badge over';}
  else if(total>cap*.85){el.textContent=total+'/'+cap+' seats';el.className='cap-badge warn';}
  else{el.textContent=total+'/'+cap+' seats';el.className='cap-badge';}
}

export function fpUpdateDragHandles(){
  const lim=LIMITS[data.room]||LIMITS.a;
  const rounds=data.fpPieces.filter(p=>p.type==='round').length;
  const rects=data.fpPieces.filter(p=>p.type==='rect').length;
  const chairs=data.fpPieces.filter(p=>p.type==='chair').reduce((s,p)=>s+(p.qty||1),0);
  const cruisers=data.fpPieces.filter(p=>p.type==='cruiser').reduce((s,p)=>s+(p.qty||1),0);
  const set=(id,d)=>{const e=document.getElementById(id);if(!e)return;e.classList.toggle('disabled',d);e.draggable=!d;};
  set('fi-round',rounds>=lim.tables);
  set('fi-rect',rects>=lim.rect); set('fi-rect0',rects>=lim.rect);
  set('fi-chair',chairs>=lim.looseChairs);set('fi-cruiser',cruisers>=lim.cruisers);
  const lbl=document.getElementById('fp-fi-limits');
  if(lbl)lbl.textContent=data.room==='ab'
    ?'Max: 10 round · 5 rect · 120 loose chairs · 9 cruisers'
    :'Max: 8 round · 5 rect · 105 loose chairs · 9 cruisers';
}
