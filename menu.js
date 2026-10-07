/* ============================================================
   БУКВОЕЖКИ — menu.js  (меню-лес, ЭТАП 3)
   Тропинка-алфавит: свайп вверх/вниз листает буквы, буквы загораются
   по прохождению, ёжик ПЕРЕКАТЫВАЕТСЯ к текущей букве; через 0.7 с
   замирания — превращается в сидящего и звучит слово.
   Карточка = слово, собранное из буквенных PNG (для знаков — одна буква).
   Тап по карточке → startGame (для Ъ/Ь/Ы пока ничего — механика позже).
   Грузить ПОСЛЕ splash.js. app.js не трогается.
   ============================================================ */
(function () {
  'use strict';

  var MENU_ASSETS = {
    logo:    'ui/splash/logo.png',
    bg:      'ui/menu/bg.PNG',
    grass:   'ui/menu/grass.PNG',
    trees:   'ui/menu/trees_side.PNG',
    frame:   'ui/menu/frame.PNG',
    hogIdle: 'ui/menu/hedgehog_idle.PNG',
    hogBall: 'ui/menu/hedgehog_ball.PNG'
  };

function aurl(p){ if(!p) return ''; return (typeof assetURL==='function') ? assetURL(p)
      : ((typeof ASSET_BASE==='string'?ASSET_BASE:'')+p); }
  function nodes(){ return (typeof PATH_NODES!=='undefined' && PATH_NODES) ? PATH_NODES : []; }

  // прелоадим фон меню сразу, пока человек смотрит заставку — переход станет мгновенным
  (function preloadMenuAssets(){
    Object.keys(MENU_ASSETS).forEach(function(k){ var im=new Image(); im.src=aurl(MENU_ASSETS[k]); });
  })();

  var built=false, menuEl=null;
  var cur=0, chips=[], hog=null, hogImg=null, hogX=null, cards=[], cardTimer=null, animating=false;
  var settleTimer=null, curAudio=null, wheelLock=0;

  /* ---- разметка тропинки: 2 ряда змейкой (2-й справа налево) ---- */
  function pathHTML(){
    var N=nodes(), r1=[], r2=[];
    N.forEach(function(n,i){ (i<17?r1:r2).push(i); });
    r2.reverse();
    function row(a){ return '<div class="m-path-row">'+a.map(function(i){
      return '<span class="m-letter" data-i="'+i+'">'+N[i].letter+'</span>'; }).join('')+'</div>'; }
    return '<div class="m-path" id="mPath">'+row(r1)+row(r2)+'</div>';
  }

  function buildMenu(){
    if(built) return;
    menuEl=document.getElementById('menu'); if(!menuEl) return;

    menuEl.innerHTML=
      '<img class="m-bg" alt="">'+
      '<img class="m-grass" alt="">'+
      '<div class="m-card" data-pos="-1"><img class="m-frame" alt=""><div class="m-card-content"></div></div>'+
      '<div class="m-card" data-pos="0" id="mCard"><img class="m-frame" alt=""><div class="m-card-content"></div></div>'+
      '<div class="m-card" data-pos="1"><img class="m-frame" alt=""><div class="m-card-content"></div></div>'+
      '<img class="m-trees" alt="">'+
      pathHTML()+
      '<img class="m-logo" alt="Буквоежки">'+
      '<div class="m-hog" id="mHog"><span class="m-hog-flip">'+
        '<img class="m-hog-img" id="mHogImg" alt=""></span></div>';

    menuEl.querySelector('.m-bg').src    = aurl(MENU_ASSETS.bg);
    menuEl.querySelector('.m-grass').src = aurl(MENU_ASSETS.grass);
    menuEl.querySelector('.m-trees').src = aurl(MENU_ASSETS.trees);
    cards=[...menuEl.querySelectorAll('.m-card')];
    cards.forEach(card=>{ card.querySelector('.m-frame').src=aurl(MENU_ASSETS.frame); });
    menuEl.querySelector('.m-logo').src  = aurl(MENU_ASSETS.logo);

    chips=[];
    menuEl.querySelectorAll('.m-letter').forEach(function(el){ chips[parseInt(el.dataset.i,10)]=el; });
    hog=document.getElementById('mHog'); hogImg=document.getElementById('mHogImg');

    bindInput();
    built=true;

    cur=0; hogX=null;
    fillCards();
    updateLighting();
    placeHog(0,false);
    scheduleSettle();
  }

  /* ---- карточка: слово из буквенных PNG / для знака — одна буква ---- */
  function fillCard(card,node){
    var c=card.querySelector('.m-card-content'); if(!c) return;
    if(!node){ c.innerHTML=''; card.style.visibility='hidden'; return; }
    card.style.visibility='visible';
    var html;
    if(node.sign){
      html='<div class="m-sign"><img src="'+aurl(LETTER_IMAGES[node.letter])+'" alt=""></div>';
    } else {
      var word=node.words[0].word;
      html='<div class="m-word-letters">'+word.split('').map(function(ch){
        var s=(typeof LETTER_IMAGES!=='undefined')?LETTER_IMAGES[ch]:null;
        return s?'<img src="'+aurl(s)+'" alt="">':''; }).join('')+'</div>';
    }
    c.innerHTML=html;
    card.dataset.index=String(nodes().indexOf(node));
  }

  function cardSpacing(){ return Math.min(menuEl.clientWidth*.8,360)*.86; }
  function positionCard(card,pos,drag){
    var scale=pos===0?1:.82;
    card.style.transform='translate(-50%,-50%) translateX('+(pos*cardSpacing()+drag)+'px) scale('+scale+')';
    card.style.opacity=Math.abs(pos)>1.5?'0':(pos===0?'1':'.72');
    card.style.zIndex=pos===0?'3':'2';
    card.style.pointerEvents=Math.abs(pos)>1.5?'none':'auto';
  }
  function fillCards(){
    cards.forEach(function(card,i){ var pos=i-1; fillCard(card,nodes()[cur+pos]); card.style.transition='none'; positionCard(card,pos,0); });
    sizeLetters();
    requestAnimationFrame(function(){ cards.forEach(function(card){card.style.transition='';}); });
  }

  // подгоняем плитки-буквы под ширину карточки (длинные слова — мельче)
  function sizeLetters(){
    cards.forEach(function(card){
      var row=card.querySelector('.m-word-letters'); if(!row) return;
      var n=row.children.length; if(!n) return;
      var avail=row.clientWidth || (menuEl?menuEl.clientWidth*0.6:200);
      var gap=4, tile=Math.min((avail-(n-1)*gap)/n, 52);
      for(var i=0;i<n;i++) row.children[i].style.width=tile+'px';
    });
  }

  function updateLighting(){
    for(var i=0;i<chips.length;i++){ if(!chips[i]) continue;
      chips[i].classList.toggle('lit', i<=cur);
      chips[i].classList.toggle('cur', i===cur);
    }
  }

  function chipCenter(i){
    var ch=chips[i]; if(!ch||!menuEl) return {x:0,y:0};
    var m=menuEl.getBoundingClientRect(), r=ch.getBoundingClientRect();
    return { x:r.left-m.left+r.width/2, y:r.top-m.top+r.height/2 };
  }

  function setHogSprite(kind){
    if(!hogImg) return;
    var u=(kind==='ball')?aurl(MENU_ASSETS.hogBall):aurl(MENU_ASSETS.hogIdle);
    if(hogImg.getAttribute('src')!==u) hogImg.src=u;
  }

  function placeHog(i,animate){
    if(!hog) return;
    var c=chipCenter(i);
    if(hogX===null) hogX=c.x;
    if(c.x>hogX+1) hog.classList.add('face-right');       // едет вправо → зеркалим
    else if(c.x<hogX-1) hog.classList.remove('face-right');
    setHogSprite('ball');                                  // в движении — комочек
    if(animate){
      hog.style.transition='';
      hogImg.classList.remove('rolling'); void hogImg.offsetWidth; hogImg.classList.add('rolling');
      hog.style.left=c.x+'px'; hog.style.top=c.y+'px';
    } else {
      hog.style.transition='none';
      hog.style.left=c.x+'px'; hog.style.top=c.y+'px';
      void hog.offsetWidth; hog.style.transition='';
    }
    hogX=c.x;
  }

  // через 0.7 с после остановки: ёжик садится + звучит слово
  function scheduleSettle(){
    clearTimeout(settleTimer);
    settleTimer=setTimeout(function(){
      if(hogImg) hogImg.classList.remove('rolling');
      setHogSprite('idle');
      playAudio(nodes()[cur]);
    },700);
  }

  function stopAudio(){ if(curAudio){ try{curAudio.pause();}catch(e){} curAudio=null; } }
  function playAudio(node){
    if(!node) return; stopAudio();
    var src = node.sign
      ? ((typeof LETTER_SOUNDS!=='undefined')?aurl(LETTER_SOUNDS[node.letter]):'')
      : (node.words[0]&&node.words[0].audio&&aurl(node.words[0].audio.word));
    if(!src) return;
    try{ curAudio=new Audio(src); curAudio.play().catch(function(){}); }catch(e){}
  }

  function goTo(i){
    var max=nodes().length-1;
    i=Math.max(0,Math.min(max,i));
    if(i===cur||animating) return;
    var dir=i>cur?1:-1;
    if(Math.abs(i-cur)>1){ cur=i; stopAudio(); fillCards(); updateLighting(); placeHog(i,true); scheduleSettle(); return; }
    animating=true; stopAudio();
    cards.forEach(function(card,j){ positionCard(card,j-1-dir,0); });
    cur=i;
    updateLighting();
    placeHog(i,true);
    scheduleSettle();
    clearTimeout(cardTimer);
    cardTimer=setTimeout(function(){ fillCards(); animating=false; },390);
  }

  function menuVisible(){ return menuEl && !menuEl.classList.contains('hidden'); }

  function bindInput(){
    var sx=0,sy=0,moved=false,downT=null,dragging=false,activePointer=null;
    menuEl.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0) return;
      activePointer=e.pointerId; sx=e.clientX;sy=e.clientY;moved=false;downT=e.target;
      menuEl.setPointerCapture(e.pointerId);
    });
    menuEl.addEventListener('pointermove',function(e){
      if(activePointer!==e.pointerId) return;
      var dx=e.clientX-sx,dy=e.clientY-sy;
      if(Math.abs(dx)>8||Math.abs(dy)>8) moved=true;
      if(animating||Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)) return;
      dragging=true;
      cards.forEach(function(card,j){card.style.transition='none'; positionCard(card,j-1,Math.max(-cardSpacing(),Math.min(cardSpacing(),dx*.65)));});
    });
    menuEl.addEventListener('pointerup',function(e){
      if(activePointer!==e.pointerId) return;
      activePointer=null;
      var dx=e.clientX-sx, dy=e.clientY-sy;
      if(dragging){ dragging=false; cards.forEach(function(card){card.style.transition='';}); }
      if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)){ goTo(cur+(dx<0?1:-1)); return; }
      cards.forEach(function(card,j){positionCard(card,j-1,0);});
      if(!moved){
        var card=downT&&downT.closest('.m-card');
        if(card){
          var index=parseInt(card.dataset.index,10);
          if(index!==cur){goTo(index);return;}
          var node=nodes()[index];
          if(node && !node.sign && node.words[0] && typeof startGame==='function') startGame(node.words[0]);
          /* знак Ъ/Ь/Ы: механика будет в отдельном чате — здесь хук */
        }
      }
    });
    menuEl.addEventListener('pointercancel',function(e){
      if(activePointer!==e.pointerId) return;
      activePointer=null; dragging=false;
      cards.forEach(function(card,j){card.style.transition='';positionCard(card,j-1,0);});
    });
    menuEl.addEventListener('wheel',function(e){
      var now=Date.now(); if(now-wheelLock<420||Math.abs(e.deltaY)<4) return;
      wheelLock=now; goTo(cur+(e.deltaY>0?1:-1));
    },{passive:true});
    window.addEventListener('resize',function(){
      if(!built||!menuVisible()) return;
      cards.forEach(function(card,j){card.style.transition='none';positionCard(card,j-1,0);});
      sizeLetters();
      var c=chipCenter(cur); if(!hog) return;
      hog.style.transition='none'; hog.style.left=c.x+'px'; hog.style.top=c.y+'px'; hogX=c.x;
      void hog.offsetWidth; hog.style.transition='';
    });
  }

  // «Дверца» splash → menu. Показываем экран ДО построения (нужны реальные размеры).
  window.showMenu=function(){
    menuEl=document.getElementById('menu');
    var sc=document.querySelectorAll('.screen');
    for(var i=0;i<sc.length;i++) sc[i].classList.add('hidden');
    if(menuEl) menuEl.classList.remove('hidden');
    if(!built){ buildMenu(); }
    else { sizeLetters(); placeHog(cur,false); updateLighting(); scheduleSettle(); }
  };
})();
