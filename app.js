/* ============================================================
   БУКВОЕЖКИ — логика игры. Данные и ассеты — в words.js
   ============================================================ */

const IDLE_MIN=4000, IDLE_MAX=6000;
const WAKE_MIN=150,  WAKE_MAX=520;
const SPEED={vowel:55, sonor:45, voiced:60, voiceless:66, hiss:50, sign:24};

const FAMILY={};
'АЕЁИОУЫЭЮЯ'.split('').forEach(c=>FAMILY[c]='vowel');
'ЛМНРЙ'.split('').forEach(c=>FAMILY[c]='sonor');
'БВГДЗ'.split('').forEach(c=>FAMILY[c]='voiced');
'КПСТФХЦ'.split('').forEach(c=>FAMILY[c]='voiceless');
'ЖЧШЩ'.split('').forEach(c=>FAMILY[c]='hiss');
'ЪЬ'.split('').forEach(c=>FAMILY[c]='sign');
function familyOf(ch){ return FAMILY[ch]||'voiceless'; }

const COSTUMES={ vowel:'costumes/wings.png', voiceless:'costumes/fins.png',
  sonor:'costumes/critter.png', voiced:'costumes/beetle.png', hiss:'costumes/snake.png' };

/* ---------- Аудио ---------- */
const audioCache={};
function getAudio(url){ if(!audioCache[url]){ const a=new Audio(url); a.preload='auto'; audioCache[url]=a; } return audioCache[url]; }
function preloadFor(item){
  [...new Set(item.word)].forEach(ch=>{
    const f=LETTER_SOUNDS[ch]; if(f) getAudio(assetURL(f)).load();
    const cos=COSTUMES[familyOf(ch)]; if(cos){ const im=new Image(); im.src=assetURL(cos); }
  });
  const w=item.audio&&item.audio.word; if(w) getAudio(assetURL(w)).load();
  if(item.syllableAudio) Object.values(item.syllableAudio).forEach(p=>getAudio(assetURL(p)).load());
  const o=item.object||{}; if(o.image){ const im=new Image(); im.src=assetURL(o.image); }
}

let ruVoice=null;
function pickVoice(){ const vs=speechSynthesis.getVoices(); ruVoice=vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith('ru'))||null; }
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function speak(text,rate=0.9){
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  if(ruVoice) u.voice=ruVoice;
  u.lang='ru-RU'; u.rate=rate; u.pitch=1.15; speechSynthesis.speak(u);
}

let heldAudio=null;
function startLetterLoop(ch){ stopLetterLoop(); const f=LETTER_SOUNDS[ch];
  if(f){ const a=getAudio(assetURL(f)); a.loop=true; a.currentTime=0; a.play().catch(()=>{}); heldAudio=a; } else speak(ch,0.8); }
function stopLetterLoop(){ if(heldAudio){ heldAudio.pause(); heldAudio.loop=false; heldAudio=null; } }

function playWord(item){ const f=item.audio&&item.audio.word;
  if(f){ const a=getAudio(assetURL(f)); a.loop=false; a.currentTime=0; a.play().catch(()=>{}); } else speak(item.word,0.85); }
let heldWordAudio=null;
function startWordLoop(item){ stopWordLoop(); const f=item.audio&&item.audio.word;
  if(f){ const a=getAudio(assetURL(f)); a.loop=true; a.currentTime=0; a.play().catch(()=>{}); heldWordAudio=a; } else speak(item.word,0.85); }
function stopWordLoop(){ if(heldWordAudio){ heldWordAudio.pause(); heldWordAudio.loop=false; heldWordAudio=null; } }
let heldSyl=null;
function startSylLoop(syl){ stopSylLoop(); const f=current.syllableAudio&&current.syllableAudio[syl];
  if(f){ const a=getAudio(assetURL(f)); a.loop=true; a.currentTime=0; a.play().catch(()=>{}); heldSyl=a; } }
function stopSylLoop(){ if(heldSyl){ heldSyl.pause(); heldSyl.loop=false; heldSyl=null; } }

/* настоящая фонема буквы — разово, в момент установки в слот/ячейку */
function playPhoneme(ch){ const f=LETTER_PHONEMES[ch];
  if(f){ const a=getAudio(assetURL(f)); a.loop=false; a.currentTime=0; a.play().catch(()=>{}); } }

/* ---------- Утилиты ---------- */
const $=s=>document.querySelector(s);
function rand(a,b){ return a+Math.random()*(b-a); }
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rotEl(el){ return el.querySelector('.l-rot'); }
function costumeEl(el){ return el.querySelector('.l-costume'); }
function showArrows(){ $('#btnPrev').classList.remove('hidden'); $('#btnNext').classList.remove('hidden'); }
function hideArrows(){ $('#btnPrev').classList.add('hidden'); $('#btnNext').classList.add('hidden'); }
function hideWordHold(){ $('#wordHold').classList.add('hidden'); }
function showWordHoldOver(target){
  const stg=document.querySelector('#game .stage').getBoundingClientRect();
  const sl=target.getBoundingClientRect(), pad=34, wh=$('#wordHold');
  wh.style.left=(sl.left-stg.left-pad)+'px'; wh.style.top=(sl.top-stg.top-pad)+'px';
  wh.style.width=(sl.width+pad*2)+'px'; wh.style.height=(sl.height+pad*2)+'px';
  wh.classList.remove('hidden');
}

/* ---------- Экран выбора ---------- */
function buildPicker(){
  const box=$('#wordTiles'); box.innerHTML='';
  WORDS.forEach(item=>{
    const t=document.createElement('button');
    t.className='word-tile'; t.style.touchAction='manipulation';
    t.innerHTML=`<span class="lbl">${item.word}</span>`;
    t.addEventListener('pointerup', e=>{ e.preventDefault(); startGame(item); });
    box.appendChild(t);
  });
  WORDS.slice(0,3).forEach(preloadFor);
}

/* ============================================================
   ИГРА — общий вход
   ============================================================ */
let current=null, slotEls=[], filledCount=0;
let phase=0, sylBlocks=[], recvSlots=[];

function makeLetterEl(ch,i){
  const fam=familyOf(ch), src=LETTER_IMAGES[ch], cos=COSTUMES[fam];
  const l=document.createElement('div');
  l.className='letter'+(src?' img':''); l.dataset.letter=ch; l.dataset.fam=fam;
  const glyph = src?`<img class="glyph" src="${assetURL(src)}" alt="${ch}" draggable="false">`:`<span class="glyph">${ch}</span>`;
  l.innerHTML=`<div class="l-rot">${cos?`<div class="l-costume"><img src="${assetURL(cos)}" alt=""></div>`:''}<div class="l-squash">${glyph}</div></div>`;
  if(!src) l.style.background=`var(--c${(i%6)+1})`;
  attachDrag(l); return l;
}

function startGame(item){
  current=item; filledCount=0; phase=0;
  $('#picker').classList.add('hidden'); $('#game').classList.remove('hidden');
  $('#reward').className='reward'; $('#reward').innerHTML='';
  hideArrows(); hideWordHold();
  stopLetterLoop(); stopWordLoop(); stopSylLoop(); kickIdle();
  $('#slots').innerHTML=''; slotEls=[];
  $('#sylLayer').innerHTML=''; sylBlocks=[];
  $('#receiver').innerHTML=''; $('#receiver').classList.add('hidden'); recvSlots=[];
  $('#scatter').innerHTML=''; $('#scatter').style.pointerEvents=''; $('#sylLayer').style.zIndex='';
  preloadFor(item);
  if(item.mode==='syllables') buildSyllableStage(item);
  else buildLetterStage(item);
}

/* ---------- Режим БУКВЫ ---------- */
function buildLetterStage(item){
  const slots=$('#slots');
  [...item.word].forEach(ch=>{
    const s=document.createElement('div');
    s.className='slot target'; s.textContent=ch; s.dataset.letter=ch; s.dataset.filled='0';
    slots.appendChild(s); slotEls.push(s);
  });
  const sc=$('#scatter');
  let order=shuffle([...item.word]);
  if(order.join('')===item.word && item.word.length>1) order=shuffle(order);
  const els=order.map((ch,i)=>{ const l=makeLetterEl(ch,i); sc.appendChild(l); return l; });
  requestAnimationFrame(()=>{ scatterLetters(els); scheduleWander(); });
}

/* ---------- Режим СЛОГИ ---------- */
function buildSyllableStage(item){
  phase=1;
  const layer=$('#sylLayer');
  item.syllables.forEach((syl,bi)=>{
    const b=document.createElement('div'); b.className='syl-block'; b.dataset.syl=syl; b.dataset.bi=bi; b.dataset.ready='0';
    [...syl].forEach(ch=>{
      const cell=document.createElement('div'); cell.className='syl-cell'; cell.dataset.letter=ch; cell.dataset.filled='0'; cell.textContent=ch;
      b.appendChild(cell);
    });
    layer.appendChild(b); sylBlocks.push(b);
  });
  const sc=$('#scatter');
  const order=shuffle([...item.syllables.join('')]);
  const els=order.map((ch,i)=>{ const l=makeLetterEl(ch,i); sc.appendChild(l); return l; });
  requestAnimationFrame(()=>{ scatterBlocks(); scatterLetters(els); scheduleWander(); });
}

function scatterBlocks(){
  const lay=$('#sylLayer'), W=lay.clientWidth, H=lay.clientHeight, n=sylBlocks.length;
  sylBlocks.forEach((b,i)=>{
    const bw=b.offsetWidth, bh=b.offsetHeight;
    let left=((i+0.5)/n)*W - bw/2 + rand(-18,18);
    let top=(i%2===0?rand(0.05,0.15):rand(0.20,0.30))*H;
    left=Math.max(6,Math.min(W-bw-6,left)); top=Math.max(6,Math.min(H-bh-6,top));
    b.style.left=left+'px'; b.style.top=top+'px';
  });
}

function scatterLetters(els){
  const sc=$('#scatter'), W=sc.clientWidth, H=sc.clientHeight, lw=84, lh=96;
  els.forEach((el,i)=>{
    const topRegion=(i%2===0);
    const top=topRegion?rand(0.34,0.52):rand(0.60,0.88);
    const left=rand(0.04,0.80), rot=rand(-16,16);
    el.dataset.homeRot=rot;
    el.style.left=(left*(W-lw))+'px'; el.style.top=(top*(H-lh))+'px';
    rotEl(el).style.transform=`rotate(${rot}deg)`;
  });
}

/* ============================================================
   БЛУЖДАНИЕ + костюмы
   ============================================================ */
let wandering=false, wanderRAF=null, idleTimer=null, movers=[], zone=null, lastT=0, wanderStartTime=0;

function kickIdle(){ stopWander(); if(idleTimer){ clearTimeout(idleTimer); idleTimer=null; } }
function scheduleWander(){ if(idleTimer) clearTimeout(idleTimer); idleTimer=setTimeout(startWander, rand(IDLE_MIN,IDLE_MAX)); }

function startWander(){
  const els=[...document.querySelectorAll('#scatter .letter:not(.placed)')];
  if(els.length===0) return;
  const sc=$('#scatter'), W=sc.clientWidth, H=sc.clientHeight;
  let ax=-9999, ay=-9999, aw=0, ah=0;
  const target = (phase===2)?$('#receiver'):(slotEls.length?$('#slots'):null);
  if(target){ const scR=sc.getBoundingClientRect(), r=target.getBoundingClientRect(); ax=r.left-scR.left-30; ay=r.top-scR.top-30; aw=r.width+60; ah=r.height+60; }
  zone={ x:ax, y:ay, w:aw, h:ah, W, H };
  let wake=0;
  movers=shuffle(els).map((el,idx)=>{
    const fam=el.dataset.fam, sp=SPEED[fam]||50, ang=rand(0,Math.PI*2);
    if(idx>0) wake+=rand(WAKE_MIN,WAKE_MAX);
    return { el, fam, sp, x:parseFloat(el.style.left)||0, y:parseFloat(el.style.top)||0,
             vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp,
             baseRot:parseFloat(el.dataset.homeRot)||0, phase:rand(0,Math.PI*2),
             wakeAt:(idx===0?0:wake), awake:false };
  });
  wandering=true; wanderStartTime=performance.now(); lastT=wanderStartTime;
  wanderRAF=requestAnimationFrame(wanderFrame);
}

function stopWander(){
  wandering=false;
  if(wanderRAF){ cancelAnimationFrame(wanderRAF); wanderRAF=null; }
  movers.forEach(m=>{ const r=rotEl(m.el); if(r){ r.style.transition='transform .25s ease'; r.style.transform=`rotate(${m.baseRot}deg)`; } });
  movers=[];
}

function wanderFrame(now){
  if(!wandering) return;
  let dt=(now-lastT)/1000; lastT=now; if(dt>0.05) dt=0.05;
  const t=now/1000, lw=78, lh=90, maxX=zone.W-lw, maxY=zone.H-lh;
  movers.forEach(m=>{
    if(!m.awake){ if(now-wanderStartTime>=m.wakeAt){ m.awake=true; const c=costumeEl(m.el); if(c) c.classList.add('show'); } else return; }
    if(m.fam==='voiceless'){ const a=Math.atan2(m.vy,m.vx)+rand(-0.7,0.7)*dt; m.vx=Math.cos(a)*m.sp; m.vy=Math.sin(a)*m.sp; }
    if(m.fam==='voiced'){ m.vx+=rand(-50,50)*dt; m.vy+=rand(-50,50)*dt; }
    const cx=m.x+lw/2, cy=m.y+lh/2;
    if(cx>zone.x && cx<zone.x+zone.w && cy>zone.y && cy<zone.y+zone.h){
      const zx=zone.x+zone.w/2, zy=zone.y+zone.h/2; let dx=cx-zx, dy=cy-zy; const d=Math.hypot(dx,dy)||1;
      m.vx+=(dx/d)*140*dt; m.vy+=(dy/d)*140*dt;
    }
    const v=Math.hypot(m.vx,m.vy)||1; m.vx=m.vx/v*m.sp; m.vy=m.vy/v*m.sp;
    m.x+=m.vx*dt; m.y+=m.vy*dt;
    if(m.x<0){m.x=0;m.vx=Math.abs(m.vx);} if(m.x>maxX){m.x=maxX;m.vx=-Math.abs(m.vx);}
    if(m.y<0){m.y=0;m.vy=Math.abs(m.vy);} if(m.y>maxY){m.y=maxY;m.vy=-Math.abs(m.vy);}
    let ox=0, oy=0, rot=m.baseRot;
    switch(m.fam){
      case 'vowel':     oy=Math.sin(t*1.6+m.phase)*5;  rot+=Math.sin(t*1.3+m.phase)*7; break;
      case 'sonor':     oy=Math.sin(t*2.2+m.phase)*2;  rot+=Math.sin(t*2.2+m.phase)*7; break;
      case 'voiced':    ox=Math.sin(t*26+m.phase)*2.5; rot+=Math.sin(t*30+m.phase)*5; break;
      case 'voiceless': rot=m.baseRot+Math.atan2(m.vy,m.vx)*180/Math.PI*0.12; break;
      case 'hiss': { const a=Math.atan2(m.vy,m.vx), px=-Math.sin(a), py=Math.cos(a), w=Math.sin(t*5+m.phase)*8; ox=px*w; oy=py*w; rot+=Math.sin(t*5+m.phase)*12; } break;
      case 'sign':      ox=Math.sin(t*9+m.phase)*1.5; break;
    }
    m.el.style.left=m.x+'px'; m.el.style.top=m.y+'px';
    const r=rotEl(m.el); r.style.transition=''; r.style.transform=`translate(${ox}px,${oy}px) rotate(${rot}deg)`;
  });
  wanderRAF=requestAnimationFrame(wanderFrame);
}

/* ---------- Перетаскивание буквы + squash ---------- */
function attachDrag(el){
  let dragging=false, offX=0, offY=0;
  el.addEventListener('pointerdown', e=>{
    if(el.classList.contains('placed')) return;
    dragging=true; kickIdle();
    el.setPointerCapture(e.pointerId);
    startLetterLoop(el.dataset.letter);
    const c=costumeEl(el); if(c) c.classList.remove('show');
    const r0=rotEl(el); r0.style.transition='transform .15s'; r0.style.transform='rotate(0deg)';
    el.classList.add('squashing','dragging'); el.style.zIndex=60;
    const r=el.getBoundingClientRect(); offX=e.clientX-r.left; offY=e.clientY-r.top;
    moveTo(e.clientX,e.clientY);
  });
  el.addEventListener('pointermove', e=>{ if(dragging) moveTo(e.clientX,e.clientY); });
  el.addEventListener('pointerup', e=>{
    if(!dragging) return; dragging=false; stopLetterLoop();
    el.classList.remove('squashing','dragging'); el.style.zIndex='';
    slotEls.forEach(s=>s.classList.remove('over')); sylBlocks.forEach(b=>b.classList.remove('over'));
    if(current.mode==='syllables'){
      const block=blockUnder(e.clientX,e.clientY,el.dataset.letter);
      if(block) placeLetterInBlock(el,block); else restAt(el);
      if(!allBlocksReady()) scheduleWander();
    } else {
      const slot=slotUnder(e.clientX,e.clientY);
      if(slot && slot.dataset.filled==='0' && slot.dataset.letter===el.dataset.letter){ placeInSlot(el,slot); }
      else { restAt(el); }
      if(!slotEls.every(s=>s.dataset.filled==='1')) scheduleWander();
    }
  });
el.addEventListener('lostpointercapture', ()=>{ if(dragging){ dragging=false; stopLetterLoop(); el.classList.remove('squashing','dragging'); el.style.zIndex=''; restAt(el); scheduleWander(); } });
  el.addEventListener('pointercancel', ()=>{ if(dragging){ dragging=false; stopLetterLoop(); el.classList.remove('squashing','dragging'); el.style.zIndex=''; restAt(el); scheduleWander(); } });
  function moveTo(x,y){
    const sc=$('#scatter').getBoundingClientRect();
    el.style.left=(x-sc.left-offX)+'px'; el.style.top=(y-sc.top-offY)+'px';
    if(current.mode==='syllables'){
      const b=blockUnder(x,y,el.dataset.letter); sylBlocks.forEach(o=>o.classList.toggle('over', o===b));
    } else {
      const s=slotUnder(x,y);
      slotEls.forEach(o=>o.classList.toggle('over', o===s && s.dataset.filled==='0' && s.dataset.letter===el.dataset.letter));
    }
  }
}

function restAt(el){ const r=rotEl(el); r.style.transition='transform .2s ease'; r.style.transform=`rotate(${el.dataset.homeRot||0}deg)`; }

function slotUnder(x,y){ for(const s of slotEls){ const r=s.getBoundingClientRect(); if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return s; } return null; }

function placeInSlot(el,slot){
  const sc=$('#scatter').getBoundingClientRect(), r=slot.getBoundingClientRect();
  el.style.transition='left .15s ease, top .15s ease';
  el.style.left=(r.left-sc.left)+'px'; el.style.top=(r.top-sc.top)+'px';
  el.style.width=r.width+'px'; el.style.height=r.height+'px';
  const rr=rotEl(el); rr.style.transition='transform .15s'; rr.style.transform='rotate(0deg)';
  const c=costumeEl(el); if(c) c.classList.remove('show');
  slot.dataset.filled='1'; slot.classList.add('filled'); slot.textContent='';
  el.classList.add('placed');
  playPhoneme(el.dataset.letter);
  sparkle(r.left+r.width/2, r.top+r.height/2);
filledCount++;
  if(slotEls.every(s=>s.dataset.filled==='1')) setTimeout(playWordAnim,250);
}

/* ---------- Слоги: буква в блок ---------- */
function blockUnder(x,y,ch){
  for(const b of sylBlocks){ if(b.dataset.ready==='1') continue; const r=b.getBoundingClientRect();
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){
      if([...b.querySelectorAll('.syl-cell')].some(c=>c.dataset.filled==='0'&&c.dataset.letter===ch)) return b;
    } }
  return null;
}
function placeLetterInBlock(el,block){
  const ch=el.dataset.letter;
  const cell=[...block.querySelectorAll('.syl-cell')].find(c=>c.dataset.filled==='0'&&c.dataset.letter===ch);
  if(!cell){ restAt(el); return; }
  const r=cell.getBoundingClientRect();
  sparkle(r.left+r.width/2, r.top+r.height/2);
  el.classList.add('placed'); el.style.pointerEvents='none';
  el.style.transition=''; el.style.left='0'; el.style.top='0'; el.style.width='100%'; el.style.height='100%';
  const rr=rotEl(el); rr.style.transition=''; rr.style.transform='rotate(0deg)';
  const c=costumeEl(el); if(c) c.classList.remove('show');
  cell.textContent=''; cell.appendChild(el); cell.dataset.filled='1';   // буква теперь внутри блока
  playPhoneme(ch);
  if([...block.querySelectorAll('.syl-cell')].every(c=>c.dataset.filled==='1')) syllableReady(block);
}
function allBlocksReady(){ return sylBlocks.length>0 && sylBlocks.every(b=>b.dataset.ready==='1'); }
function syllableReady(block){
  block.dataset.ready='1'; block.classList.add('ready');
  block.style.animation='sylpop .5s ease'; setTimeout(()=>{ block.style.animation=''; },520);
  attachSyllableDrag(block);
  if(allBlocksReady()) setTimeout(startPhase2,600);
}
function startPhase2(){
  phase=2; kickIdle();
  $('#scatter').style.pointerEvents='none';   // буквы все расставлены — не мешают
  $('#sylLayer').style.zIndex='4';            // слоги выше букв, но ниже картинки слова
  const recv=$('#receiver'); recv.innerHTML=''; recvSlots=[];
  current.syllables.forEach((syl,i)=>{
    const s=document.createElement('div'); s.className='recv-slot'; s.dataset.syl=syl; s.dataset.filled='0'; s.textContent=syl;
    const b=sylBlocks[i]; if(b){ s.style.width=b.offsetWidth+'px'; s.style.height=b.offsetHeight+'px'; }
    recv.appendChild(s); recvSlots.push(s);
  });
  recv.classList.remove('hidden');
}

/* ---------- Слоги: блок в приёмник + удержание-звук ---------- */
function recvUnder(x,y,syl){
  for(const s of recvSlots){ if(s.dataset.filled==='1') continue; if(s.dataset.syl!==syl) continue;
    const r=s.getBoundingClientRect(); if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return s; }
  return null;
}
function attachSyllableDrag(block){
  let dragging=false, moved=false, offX=0, offY=0, startX=0, startY=0, homeL=0, homeT=0;
  block.addEventListener('pointerdown', e=>{
    if(block.dataset.placed==='1') return;
    block.setPointerCapture(e.pointerId);
    dragging=true; moved=false; startX=e.clientX; startY=e.clientY;
    const lay=$('#sylLayer').getBoundingClientRect(), r=block.getBoundingClientRect();
    offX=e.clientX-r.left; offY=e.clientY-r.top; homeL=r.left-lay.left; homeT=r.top-lay.top;
    startSylLoop(block.dataset.syl);   // касание готового слога — звук по кругу
    block.style.zIndex=70;
  });
  block.addEventListener('pointermove', e=>{
    if(!dragging) return;
    if(!moved && Math.hypot(e.clientX-startX,e.clientY-startY)>8){ moved=true; block.classList.add('dragging'); }
    if(moved){
      const lay=$('#sylLayer').getBoundingClientRect();
      block.style.left=(e.clientX-lay.left-offX)+'px'; block.style.top=(e.clientY-lay.top-offY)+'px';
      const rs=recvUnder(e.clientX,e.clientY,block.dataset.syl); recvSlots.forEach(s=>s.classList.toggle('over', s===rs));
    }
  });
  block.addEventListener('pointerup', e=>{
    if(!dragging) return; dragging=false; block.style.zIndex='';
    if(!moved){ stopSylLoop(); return; }      // был только звук-удержание
   block.classList.remove('dragging'); stopSylLoop();
    const rs=recvUnder(e.clientX,e.clientY,block.dataset.syl); recvSlots.forEach(s=>s.classList.remove('over'));
    if(rs) placeBlockInRecv(block,rs); else returnBlock(block,homeL,homeT);
  });
 block.addEventListener('lostpointercapture', ()=>{ if(dragging){ dragging=false; stopSylLoop(); if(moved) returnBlock(block,homeL,homeT); } });
  block.addEventListener('pointercancel', ()=>{ if(dragging){ dragging=false; stopSylLoop(); if(moved) returnBlock(block,homeL,homeT); } });
}
function returnBlock(block,L,T){ block.style.transition='left .22s ease, top .22s ease'; block.style.left=L+'px'; block.style.top=T+'px'; }
function placeBlockInRecv(block,slot){
  const lay=$('#sylLayer').getBoundingClientRect(), r=slot.getBoundingClientRect(), b=block.getBoundingClientRect();
  block.style.transition='left .15s ease, top .15s ease';
  block.style.left=(r.left+r.width/2 - b.width/2 - lay.left)+'px';
  block.style.top=(r.top+r.height/2 - b.height/2 - lay.top)+'px';
  block.dataset.placed='1'; block.classList.add('placed');
  slot.dataset.filled='1'; slot.classList.add('filled'); slot.textContent='';
  sparkle(r.left+r.width/2, r.top+r.height/2);
  if(recvSlots.every(s=>s.dataset.filled==='1')) setTimeout(wordCompleteSyll,350);
}
function wordCompleteSyll(){
  kickIdle(); showArrows();                    // стрелки сразу
  confettiAt('#receiver');
  showRewardObject(); playWord(current);
  const o=current.object||{}, hold=(o.image||o.video)?5000:2200;
  setTimeout(hideRewardObject, hold);
  setTimeout(()=>{ showWordHoldOver($('#receiver')); }, hold+650);
}

function sparkle(x,y){
  const marks=['✨','⭐','🌟'];
  for(let i=0;i<5;i++){
    const sp=document.createElement('div'); sp.className='spark'; sp.textContent=marks[i%marks.length];
    sp.style.left=x+'px'; sp.style.top=y+'px';
    sp.style.setProperty('--dx',(Math.random()*120-60)+'px');
    sp.style.setProperty('--dy',(-40-Math.random()*70)+'px');
    document.body.appendChild(sp); setTimeout(()=>sp.remove(),900);
  }
}

/* конфетти — на сборку слова и предложения */
function confetti(x,y){
  const cols=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)'];
  for(let i=0;i<30;i++){
    const p=document.createElement('div'); p.className='confetti-piece';
    p.style.left=x+'px'; p.style.top=y+'px'; p.style.background=cols[i%cols.length];
    p.style.setProperty('--dx',(Math.random()*360-180)+'px');
    p.style.setProperty('--dy',(120+Math.random()*230)+'px');
    p.style.setProperty('--rot',(Math.random()*720-360)+'deg');
    p.style.animationDelay=(Math.random()*0.09).toFixed(2)+'s';
    document.body.appendChild(p); setTimeout(()=>p.remove(),1400);
  }
}
function confettiAt(sel){ const el=$(sel); if(!el) return; const r=el.getBoundingClientRect(); confetti(r.left+r.width/2, r.top+r.height/2); }

/* ---------- «Оживление» слова (буквы) ---------- */
function placedLetters(){ return [...document.querySelectorAll('.letter.placed')]; }

function showRewardObject(){
  const r=$('#reward'); r.className='reward'; r.innerHTML='';
  const o=current.object||{};
  if(o.video){ const v=document.createElement('video'); v.src=assetURL(o.video); v.autoplay=true; v.loop=true; v.playsInline=true; r.appendChild(v); }
  else if(o.image){ const img=document.createElement('img'); img.src=assetURL(o.image); img.alt=current.word; img.onerror=()=>{ r.innerHTML=`<div class="word-pic">${o.emoji||'❓'}</div>`; }; r.appendChild(img); }
  else { const p=document.createElement('div'); p.className='word-pic'; p.textContent=o.emoji||'❓'; r.appendChild(p); }
  r.classList.add('show');
}
function hideRewardObject(){
  const r=$('#reward'); r.classList.remove('show'); r.classList.add('out');
  setTimeout(()=>{ if(!$('#reward').classList.contains('show')){ $('#reward').className='reward'; $('#reward').innerHTML=''; } }, 360);
}
function spreadLetters(){
  const letters=placedLetters();
  const rects=letters.map(el=>el.getBoundingClientRect());
  const cx=rects.reduce((s,r)=>s+r.left+r.width/2,0)/Math.max(rects.length,1);
  letters.forEach((el,i)=>{
    const rc=rects[i], lc=rc.left+rc.width/2;
    const dir=lc<cx-2?-1:(lc>cx+2?1:(i%2?1:-1));
    const dx=dir*(80+Math.abs(lc-cx)*0.7), dy=-34-Math.random()*28, rot=dir*(8+Math.random()*10);
    const r=rotEl(el); r.style.transition='transform .4s cubic-bezier(.2,.9,.3,1), opacity .4s';
    r.style.transform=`translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.68)`;
    el.style.opacity='.85';
  });
}
function reformLetters(){
  placedLetters().forEach((el,i)=> setTimeout(()=>{
    const rr=rotEl(el); rr.style.transition='transform .5s cubic-bezier(.2,1.2,.3,1)'; el.style.transition='opacity .4s';
    rr.style.transform='translate(0,0) rotate(0) scale(1)'; el.style.opacity='1';
  }, i*60));
}

function playWordAnim(){
  kickIdle(); showArrows();                     // стрелки сразу
  const letters=placedLetters();
  letters.forEach((el,i)=> setTimeout(()=>{
    const r=rotEl(el); r.style.transition='transform .3s cubic-bezier(.2,1.5,.4,1)';
    r.style.transform='translateY(-16px) scale(1.12)'; setTimeout(()=> r.style.transform='translateY(0) scale(1)', 300);
  }, i*90));
  const jumpDone=letters.length*90+360;
  setTimeout(spreadLetters, jumpDone);
  const objAt=jumpDone+460;
  setTimeout(()=>{ confettiAt('#slots'); showRewardObject(); playWord(current); }, objAt);
  const o=current.object||{}, hold=(o.image||o.video)?5000:2200, holdEnd=objAt+hold;
  setTimeout(()=>{ hideRewardObject(); reformLetters(); }, holdEnd);
  setTimeout(()=>{ showWordHoldOver($('#slots')); }, holdEnd+650);
}

/* ---------- Удержание собранного слова ---------- */
let wordHeld=false;
function bindWordHold(){
  const wh=$('#wordHold');
  wh.addEventListener('pointerdown', e=>{
    e.preventDefault(); wordHeld=true; wh.setPointerCapture(e.pointerId);
    kickIdle(); if(current.mode!=='syllables') spreadLetters(); showRewardObject(); startWordLoop(current);
  });
  const end=()=>{ if(!wordHeld) return; wordHeld=false; stopWordLoop(); hideRewardObject(); if(current.mode!=='syllables') reformLetters(); };
  wh.addEventListener('pointerup', e=>{ e.preventDefault(); end(); });
  wh.addEventListener('pointercancel', end);
  wh.addEventListener('lostpointercapture', end);
}

/* ---------- Кнопки ---------- */
function onTap(sel, fn){ $(sel).addEventListener('pointerup', e=>{ e.preventDefault(); fn(e); }); }
function gotoWord(delta){ const i=WORDS.findIndex(w=>w.id===current.id); const n=(i+delta+WORDS.length)%WORDS.length; startGame(WORDS[n]); }
onTap('#btnReplay', ()=>current&&playWord(current));
onTap('#btnHome', ()=>{ stopLetterLoop(); stopWordLoop(); stopSylLoop(); kickIdle(); hideWordHold(); $('#game').classList.add('hidden'); showMenu(); });
onTap('#btnPrev', ()=>gotoWord(-1));
onTap('#btnNext', ()=>gotoWord(1));

bindWordHold();
buildPicker();
