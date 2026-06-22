/* ============================================================
   БУКВОЕЖКИ — логика игры. Данные и ассеты — в words.js
   ============================================================ */

/* ---------- Звук: файл (если есть) → иначе браузерный голос ---------- */
let ruVoice=null;
function pickVoice(){ const vs=speechSynthesis.getVoices(); ruVoice=vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith('ru'))||null; }
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }

function playFile(url){ const a=new Audio(url); a.play().catch(()=>{}); return a; }
function speak(text,rate=0.9){
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  if(ruVoice) u.voice=ruVoice;
  u.lang='ru-RU'; u.rate=rate; u.pitch=1.15;
  speechSynthesis.speak(u);
}
function playLetter(ch){ const f=LETTER_SOUNDS[ch]; f?playFile(assetURL(f)):speak(ch,0.8); }
function playWord(item){ const f=item.audio&&item.audio.word; f?playFile(assetURL(f)):speak(item.word,0.85); }

/* ---------- Утилиты ---------- */
const $=s=>document.querySelector(s);
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ============================================================
   ЭКРАН ВЫБОРА
   ============================================================ */
function buildPicker(){
  const box=$('#wordTiles'); box.innerHTML='';
  WORDS.forEach(item=>{
    const t=document.createElement('button');
    t.className='word-tile';
    t.innerHTML=`<span class="pic">${(item.object&&item.object.emoji)||'❓'}</span><span class="lbl">${item.word}</span>`;
    t.onclick=()=>startGame(item);
    box.appendChild(t);
  });
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
  $('#nextbar').classList.add('hidden');

  // слоты с призрачными целевыми буквами
  const slots=$('#slots'); slots.innerHTML=''; slotEls=[];
  [...item.word].forEach(ch=>{
    const s=document.createElement('div');
    s.className='slot target'; s.textContent=ch; s.dataset.letter=ch; s.dataset.filled='0';
    slots.appendChild(s); slotEls.push(s);
  });

  // буквы в лотке (перемешаны)
  const tray=$('#tray'); tray.innerHTML='';
  let order=shuffle([...item.word]);
  if(order.join('')===item.word && item.word.length>1) order=shuffle(order);
  order.forEach((ch,i)=>{
    const l=document.createElement('div');
    l.className='letter'; l.dataset.letter=ch;
    const src=LETTER_IMAGES[ch];
    if(src){ l.classList.add('img'); l.innerHTML=`<img src="${assetURL(src)}" alt="${ch}" draggable="false">`; }
    else { l.textContent=ch; l.style.background=`var(--c${(i%6)+1})`; }
    attachDrag(l);
    tray.appendChild(l);
  });

  setTimeout(()=>playWord(item),300);
}

/* ---------- Перетаскивание (pointer events: тач + мышь) ---------- */
function attachDrag(el){
  let homeRect=null, offX=0, offY=0, dragging=false;
  el.addEventListener('pointerdown', e=>{
    if(el.classList.contains('placed')) return;
    dragging=true;
    playLetter(el.dataset.letter);
    el.classList.add('wiggle'); setTimeout(()=>el.classList.remove('wiggle'),400);
    homeRect=el.getBoundingClientRect();
    offX=e.clientX-homeRect.left; offY=e.clientY-homeRect.top;
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    el.style.position='fixed';
    el.style.width=homeRect.width+'px'; el.style.height=homeRect.height+'px';
    moveTo(e.clientX,e.clientY);
  });
  el.addEventListener('pointermove', e=>{ if(dragging) moveTo(e.clientX,e.clientY); });
  el.addEventListener('pointerup', e=>{
    if(!dragging) return; dragging=false;
    el.classList.remove('dragging');
    const slot=slotUnder(e.clientX,e.clientY);
    slotEls.forEach(s=>s.classList.remove('over'));
    if(slot && slot.dataset.filled==='0' && slot.dataset.letter===el.dataset.letter){ placeInSlot(el,slot); }
    else { returnHome(); }
  });
  function moveTo(x,y){
    el.style.left=(x-offX)+'px'; el.style.top=(y-offY)+'px';
    const s=slotUnder(x,y);
    slotEls.forEach(o=>o.classList.toggle('over', o===s && s.dataset.filled==='0' && s.dataset.letter===el.dataset.letter));
  }
  function returnHome(){
    el.style.transition='left .22s ease, top .22s ease';
    el.style.left=homeRect.left+'px'; el.style.top=homeRect.top+'px';
    el.addEventListener('transitionend', function clr(){ el.style.cssText=''; el.removeEventListener('transitionend',clr); },{once:true});
  }
}

function slotUnder(x,y){
  for(const s of slotEls){ const r=s.getBoundingClientRect(); if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return s; }
  return null;
}

function placeInSlot(el,slot){
  const r=slot.getBoundingClientRect();
  el.style.transition='left .15s ease, top .15s ease';
  el.style.left=r.left+'px'; el.style.top=r.top+'px';
  el.style.width=r.width+'px'; el.style.height=r.height+'px';
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

/* ---------- «Оживление» слова (уровень B: буквы оживают) ---------- */
function placedLetters(){ return [...document.querySelectorAll('.letter.placed')]; }

function showRewardObject(){
  const r=$('#reward'); r.className='reward'; r.innerHTML='';
  const o=current.object||{};
  if(o.video){ const v=document.createElement('video'); v.src=assetURL(o.video); v.autoplay=true; v.playsInline=true; r.appendChild(v); }
  else if(o.image){ const img=document.createElement('img'); img.src=assetURL(o.image); img.alt=current.word; r.appendChild(img); }
  else { const p=document.createElement('div'); p.className='word-pic'; p.textContent=o.emoji||'❓'; r.appendChild(p); }
  r.classList.add('show');
}

function playWordAnim(){
  const letters=placedLetters();

  // 1) радостный подскок
  letters.forEach((el,i)=> setTimeout(()=>{
    el.style.transition='transform .3s cubic-bezier(.2,1.5,.4,1)';
    el.style.transform='translateY(-16px) scale(1.12)';
    setTimeout(()=> el.style.transform='translateY(0) scale(1)', 300);
  }, i*90));
  const jumpDone=letters.length*90+360;

  // 2) буквы разъезжаются, освобождая центр
  setTimeout(()=>{
    const rects=letters.map(el=>el.getBoundingClientRect());
    const cx=rects.reduce((s,r)=>s+r.left+r.width/2,0)/rects.length;
    letters.forEach((el,i)=>{
      const r=rects[i], lc=r.left+r.width/2;
      const dir=lc<cx-2?-1:(lc>cx+2?1:(i%2?1:-1));
      const dx=dir*(80+Math.abs(lc-cx)*0.7), dy=-34-Math.random()*28, rot=dir*(8+Math.random()*10);
      el.style.transition='transform .45s cubic-bezier(.2,.9,.3,1), opacity .45s';
      el.style.transform=`translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.68)`;
      el.style.opacity='.85';
    });
  }, jumpDone);

  // 3) в центре появляется предмет + звук слова
  const objAt=jumpDone+480;
  setTimeout(()=>{ showRewardObject(); playWord(current); }, objAt);

  // 4) предмет уходит, буквы возвращаются и снова складываются в слово
  const holdEnd=objAt+2200;
  setTimeout(()=>{
    const r=$('#reward'); r.classList.remove('show'); r.classList.add('out');
    letters.forEach((el,i)=> setTimeout(()=>{
      el.style.transition='transform .5s cubic-bezier(.2,1.2,.3,1), opacity .4s';
      el.style.transform='translate(0,0) rotate(0) scale(1)'; el.style.opacity='1';
    }, i*70));
  }, holdEnd);

  // 5) убираем предмет, показываем кнопки
  setTimeout(()=>{ const r=$('#reward'); r.className='reward'; r.innerHTML=''; $('#nextbar').classList.remove('hidden'); }, holdEnd+750);
}

/* ---------- Кнопки ---------- */
$('#btnReplay').onclick=()=>current&&playWord(current);
$('#btnHome').onclick=()=>{ $('#game').classList.add('hidden'); $('#picker').classList.remove('hidden'); };
$('#btnAgain').onclick=()=>current&&startGame(current);
$('#btnNext').onclick=()=>{ const i=WORDS.findIndex(w=>w.id===current.id); startGame(WORDS[(i+1)%WORDS.length]); };

buildPicker();
