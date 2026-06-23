/* ============================================================
   БУКВОЕЖКИ — логика игры. Данные и ассеты — в words.js
   ============================================================ */

/* ---------- Настройки ---------- */
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

const COSTUMES={
  vowel:'costumes/wings.png', voiceless:'costumes/fins.png',
  sonor:'costumes/critter.png', voiced:'costumes/beetle.png', hiss:'costumes/snake.png'
};

/* ---------- Аудио ---------- */
const audioCache={};
function getAudio(url){ if(!audioCache[url]){ const a=new Audio(url); a.preload='auto'; audioCache[url]=a; } return audioCache[url]; }
function preloadFor(item){
  [...new Set(item.word)].forEach(ch=>{
    const f=LETTER_SOUNDS[ch]; if(f) getAudio(assetURL(f)).load();
    const cos=COSTUMES[familyOf(ch)]; if(cos){ const im=new Image(); im.src=assetURL(cos); }
  });
  const w=item.audio&&item.audio.word; if(w) getAudio(assetURL(w)).load();
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

/* звук буквы по кругу, пока держат */
let heldAudio=null;
function startLetterLoop(ch){
  stopLetterLoop();
  const f=LETTER_SOUNDS[ch];
  if(f){ const a=getAudio(assetURL(f)); a.loop=true; a.currentTime=0; a.play().catch(()=>{}); heldAudio=a; }
  else { speak(ch,0.8); }
}
function stopLetterLoop(){ if(heldAudio){ heldAudio.pause(); heldAudio.loop=false; heldAudio=null; } }

/* слово: один раз, и отдельно — по кругу на удержании */
function playWord(item){
  const f=item.audio&&item.audio.word;
  if(f){ const a=getAudio(assetURL(f)); a.loop=false; a.currentTime=0; a.play().catch(()=>{}); }
  else speak(item.word,0.85);
}
let heldWordAudio=null;
function startWordLoop(item){
  stopWordLoop();
  const f=item.audio&&item.audio.word;
  if(f){ const a=getAudio(assetURL(f)); a.loop=true; a.currentTime=0; a.play().catch(()=>{}); heldWordAudio=a; }
  else speak(item.word,0.85);
}
function stopWordLoop(){ if(heldWordAudio){ heldWordAudio.pause(); heldWordAudio.loop=false; heldWordAudio=null; } }

/* ---------- Утилиты ---------- */
const $=s=>document.querySelector(s);
function rand(a,b){ return a+Math.random()*(b-a); }
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rotEl(el){ return el.querySelector('.l-rot'); }
function costumeEl(el){ return el.querySelector('.l-costume'); }
function showArrows(){ $('#btnPrev').classList.remove('hidden'); $('#btnNext').classList.remove('hidden'); }
function hideArrows(){ $('#btnPrev').classList.add('hidden'); $('#btnNext').classList.add('hidden'); }
function hideWordHold(){ $('#wordHold').classList.add('hidden'); }
function showWordHold(){
  const stg=document.querySelector('#game .stage').getBoundingClientRect();
  const sl=$('#slots').getBoundingClientRect(), pad=34, wh=$('#wordHold');
  wh.style.left=(sl.left-stg.left-pad)+'px'; wh.style.top=(sl.top-stg.top-pad)+'px';
  wh.style.width=(sl.width+pad*2)+'px'; wh.style.height=(sl.height+pad*2)+'px';
  wh.classList.remove('hidden');
}

/* ============================================================
   ЭКРАН ВЫБОРА
   ============================================================ */
function buildPicker(){
  const box=$('#wordTiles'); box.innerHTML='';
  WORDS.forEach(item=>{
    const t=document.createElement('button');
    t.className='word-tile'; t.style.touchAction='manipulation';
    t.innerHTML=`<span class="lbl">${item.word}</span>`;
    t.addEventListener('pointerup', e=>{ e.preventDefault(); startGame(item); });
    box.appendChild(t);
  });
  WORDS.slice(0,4).forEach(preloadFor);
}

/* ============================================================
   ИГРА
   ============================================================ */
let current=null, slotEls=[], filledCount=0;

function startGame(item){
  current=item; filledCount=0;
  $('#picker').classList.add('hidden');
  $('#game').classList.remove('hidden');
  $('#reward').className='reward'; $('#reward').innerHTML='';
  hideArrows(); hideWordHold();
  stopLetterLoop(); stopWordLoop(); kickIdle();
  preloadFor(item);

  const slots=$('#slots'); slots.innerHTML=''; slotEls=[];
  [...item.word].forEach(ch=>{
    const s=document.createElement('div');
    s.className='slot target'; s.textContent=ch; s.dataset.letter=ch; s.dataset.filled='0';
    slots.appendChild(s); slotEls.push(s);
  });

  const sc=$('#scatter'); sc.innerHTML='';
  let order=shuffle([...item.word]);
  if(order.join('')===item.word && item.word.length>1) order=shuffle(order);
  const els=[];
  order.forEach((ch,i)=>{
    const fam=familyOf(ch), src=LETTER_IMAGES[ch], cos=COSTUMES[fam];
    const l=document.createElement('div');
    l.className='letter'+(src?' img':''); l.dataset.letter=ch; l.dataset.fam=fam;
    const glyph = src?`<img class="glyph" src="${assetURL(src)}" alt="${ch}" draggable="false">`:`<span class="glyph">${ch}</span>`;
    l.innerHTML=`<div class="l-rot">${cos?`<div class="l-costume"><img src="${assetURL(cos)}" alt=""></div>`:''}<div class="l-squash">${glyph}</div></div>`;
    if(!src) l.style.background=`var(--c${(i%6)+1})`;
    attachDrag(l); sc.appendChild(l); els.push(l);
  });
  requestAnimationFrame(()=>{ scatterLetters(els); scheduleWander(); });
}

function scatterLetters(els){
  const sc=$('#scatter'), W=sc.clientWidth, H=sc.clientHeight, lw=84, lh=96;
  els.forEach((el,i)=>{
    const topRegion=(i%2===0);
    const top=topRegion?rand(0.04,0.26):rand(0.60,0.84);
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
  const scR=sc.getBoundingClientRect(), slR=$('#slots').getBoundingClientRect();
  zone={ x:slR.left-scR.left-30, y:slR.top-scR.top-30, w:slR.width+60, h:slR.height+60, W, H };
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
    if(!m.awake){
      if(now-wanderStartTime>=m.wakeAt){ m.awake=true; const c=costumeEl(m.el); if(c) c.classList.add('show'); }
      else return;
    }
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

/* ---------- Перетаскивание + squash ---------- */
function attachDrag(el){
  let dragging=false, offX=0, offY=0;
  el.addEventListener('pointerdown', e=>{
    if(el.classList.contains('placed')) return;
    dragging=true; kickIdle();
    el.setPointerCapture(e.pointerId);
    startLetterLoop(el.dataset.letter);
    const c=costumeEl(el); if(c) c.classList.remove('show');
    const r0=rotEl(el); r0.style.transition='transform .15s'; r0.style.transform='rotate(0deg)';
    el.classList.add('squashing','dragging');
    el.style.zIndex=60;
    const r=el.getBoundingClientRect(); offX=e.clientX-r.left; offY=e.clientY-r.top;
    moveTo(e.clientX,e.clientY);
  });
  el.addEventListener('pointermove', e=>{ if(dragging) moveTo(e.clientX,e.clientY); });
  el.addEventListener('pointerup', e=>{
    if(!dragging) return; dragging=false; stopLetterLoop();
    el.classList.remove('squashing','dragging'); el.style.zIndex='';
    const slot=slotUnder(e.clientX,e.clientY);
    slotEls.forEach(s=>s.classList.remove('over'));
    if(slot && slot.dataset.filled==='0' && slot.dataset.letter===el.dataset.letter){ placeInSlot(el,slot); }
    else { restAt(el); }
    if(filledCount<current.word.length) scheduleWander();
  });
  el.addEventListener('lostpointercapture', ()=>{ if(dragging){ dragging=false; stopLetterLoop(); el.classList.remove('squashing','dragging'); el.style.zIndex=''; restAt(el); scheduleWander(); } });
  function moveTo(x,y){
    const sc=$('#scatter').getBoundingClientRect();
    el.style.left=(x-sc.left-offX)+'px'; el.style.top=(y-sc.top-offY)+'px';
    const s=slotUnder(x,y);
    slotEls.forEach(o=>o.classList.toggle('over', o===s && s.dataset.filled==='0' && s.dataset.letter===el.dataset.letter));
  }
}

function restAt(el){
  const r=rotEl(el); r.style.transition='transform .2s ease'; r.style.transform=`rotate(${el.dataset.homeRot||0}deg)`;
}

function slotUnder(x,y){
  for(const s of slotEls){ const r=s.getBoundingClientRect(); if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return s; }
  return null;
}

function placeInSlot(el,slot){
  const sc=$('#scatter').getBoundingClientRect(), r=slot.getBoundingClientRect();
  el.style.transition='left .15s ease, top .15s ease';
  el.style.left=(r.left-sc.left)+'px'; el.style.top=(r.top-sc.top)+'px';
  el.style.width=r.width+'px'; el.style.height=r.height+'px';
  const rr=rotEl(el); rr.style.transition='transform .15s'; rr.style.transform='rotate(0deg)';
  const c=costumeEl(el); if(c) c.classList.remove('show');
  slot.dataset.filled='1'; slot.classList.add('filled'); slot.textContent='';
  el.classList.add('placed');
  sparkle(r.left+r.width/2, r.top+r.height/2);
  filledCount++;
  if(filledCount===current.word.length) setTimeout(playWordAnim,250);
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

/* ---------- «Оживление» слова ---------- */
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

/* автопоказ один раз после сборки */
function playWordAnim(){
  kickIdle();
  const letters=placedLetters();
  letters.forEach((el,i)=> setTimeout(()=>{
    const r=rotEl(el); r.style.transition='transform .3s cubic-bezier(.2,1.5,.4,1)';
    r.style.transform='translateY(-16px) scale(1.12)';
    setTimeout(()=> r.style.transform='translateY(0) scale(1)', 300);
  }, i*90));
  const jumpDone=letters.length*90+360;
  setTimeout(spreadLetters, jumpDone);
  const objAt=jumpDone+460;
  setTimeout(()=>{ showRewardObject(); playWord(current); }, objAt);
  const o=current.object||{}; const hold=(o.image||o.video)?5000:2200; const holdEnd=objAt+hold;
  setTimeout(()=>{ hideRewardObject(); reformLetters(); }, holdEnd);
  setTimeout(()=>{ showArrows(); showWordHold(); }, holdEnd+650);
}

/* удержание собранного слова: гифка + звук по кругу, пока держишь */
let wordHeld=false;
function bindWordHold(){
  const wh=$('#wordHold');
  wh.addEventListener('pointerdown', e=>{
    e.preventDefault(); wordHeld=true; wh.setPointerCapture(e.pointerId);
    kickIdle(); spreadLetters(); showRewardObject(); startWordLoop(current);
  });
  const end=()=>{ if(!wordHeld) return; wordHeld=false; stopWordLoop(); hideRewardObject(); reformLetters(); };
  wh.addEventListener('pointerup', e=>{ e.preventDefault(); end(); });
  wh.addEventListener('pointercancel', end);
  wh.addEventListener('lostpointercapture', end);
}

/* ---------- Кнопки (pointerup — срабатывают с первого раза) ---------- */
function onTap(sel, fn){ $(sel).addEventListener('pointerup', e=>{ e.preventDefault(); fn(e); }); }
function gotoWord(delta){ const i=WORDS.findIndex(w=>w.id===current.id); const n=(i+delta+WORDS.length)%WORDS.length; startGame(WORDS[n]); }
onTap('#btnReplay', ()=>current&&playWord(current));
onTap('#btnHome', ()=>{ stopLetterLoop(); stopWordLoop(); kickIdle(); hideWordHold(); $('#game').classList.add('hidden'); $('#picker').classList.remove('hidden'); });
onTap('#btnPrev', ()=>gotoWord(-1));
onTap('#btnNext', ()=>gotoWord(1));

bindWordHold();
buildPicker();
