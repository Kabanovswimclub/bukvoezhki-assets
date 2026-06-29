/* ============================================================
   БУКВОЕЖКИ — данные и конфигурация. Логика — в app.js
   ============================================================ */
const ASSET_BASE='https://kabanovswimclub.github.io/bukvoezhki-assets/';
function assetURL(p){ return p ? encodeURI(ASSET_BASE+p) : null; }

/* ---------- Пластилиновые буквы (картинки), все 33 ---------- */
const LETTER_IMAGES={
  'А':'letters/01_A.png','Б':'letters/02_B.png','В':'letters/03_V.png','Г':'letters/04_G.png',
  'Д':'letters/05_D.png','Е':'letters/06_E.png','Ё':'letters/07_YO.png','Ж':'letters/08_ZH.png',
  'З':'letters/09_Z.png','И':'letters/10_I.png','Й':'letters/11_IY.png','К':'letters/12_K.png',
  'Л':'letters/13_L.png','М':'letters/14_M.png','Н':'letters/15_N.png','О':'letters/16_O.png',
  'П':'letters/17_P.png','Р':'letters/18_R.png','С':'letters/19_S.png','Т':'letters/20_T.png',
  'У':'letters/21_U.png','Ф':'letters/22_F.png','Х':'letters/23_KH.png','Ц':'letters/24_TS.png',
  'Ч':'letters/25_CH.png','Ш':'letters/26_SH.png','Щ':'letters/27_SHCH.png','Ъ':'letters/28_HARD.png',
  'Ы':'letters/29_YERU.png','Ь':'letters/30_SOFT.png','Э':'letters/31_EH.png','Ю':'letters/32_YU.png',
  'Я':'letters/33_YA.png'
};
/* ---------- Звуки букв — весь алфавит ---------- */
const LETTER_SOUNDS={};
'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('').forEach(ch=>{ LETTER_SOUNDS[ch]='letter_voice/'+ch+'.mp3'; });
function cap(s){ return s[0].toUpperCase()+s.slice(1).toLowerCase(); }

/* ---------- Конструкторы слов (форма для app.js не меняется) ---------- */
function makeLetterWord({w,emoji}){
  const up=w.toUpperCase();
  return { id:w, word:up, mode:'letters', syllables:[up], level:1,
    object:{emoji,image:'video/'+w+'.gif',video:null},
    audio:{word:'words_voice/'+cap(w)+'.mp3',sentence:null}, sentence:null };
}
function makeSyllWord({w,emoji,syl}){
  const up=w.toUpperCase(), sa={};
  syl.forEach(s=>{ sa[s.toUpperCase()]='syllables_voice/'+cap(s)+'.mp3'; });
  return { id:w, word:up, mode:'syllables', syllables:syl.map(s=>s.toUpperCase()), level:2,
    object:{emoji,image:'video/'+w+'.gif',video:null},
    audio:{word:'words_voice/'+cap(w)+'.mp3',sentence:null},
    syllableAudio:sa, sentence:null };
}

/* ---------- Алфавит-тропинка: буква → слова ----------
   Первое слово = превью в меню. Пустой список = знак (на карточке только буква). */
const LETTER_WORDS={
  'А':['аист'],'Б':['бак'],'В':['волк'],'Г':['гусь'],'Д':['дом'],
  'Е':['еда'],'Ё':['ёж'],'Ж':['жарко'],'З':['змея'],'И':['идея'],
  'Й':['йогурт'],'К':['кот','кит','коза','ком'],'Л':['лук','луна','лето'],
  'М':['мама','море','молоко','мяч'],'Н':['нос','нюхать'],'О':['обед','остров'],
  'П':['папа','палец'],'Р':['рот','рыба'],'С':['сок','сом','сыр'],
  'Т':['танец','топать'],'У':['ухо','утюг'],'Ф':['филин','фрукт'],
  'Х':['холод','хлеб'],'Ц':['цапля','цветок'],'Ч':['чашка','чай'],
  'Ш':['шар','шагать'],'Щ':['щетка','щипать'],
  'Ъ':[],'Ы':[],'Ь':[],            /* знаки — отдельная механика (другой чат) */
  'Э':['эму','этаж'],'Ю':['юла','юмор'],'Я':['язык','яблоко']
};

/* запасной значок для игры (в меню не используется — там буквы-картинки) */
const WORD_EMOJI={
  аист:'🐦',бак:'🛢️',волк:'🐺',гусь:'🦢',дом:'🏠',еда:'🍽️',ёж:'🦔',жарко:'🥵',змея:'🐍',идея:'💡',
  йогурт:'🥛',кот:'🐱',кит:'🐳',коза:'🐐',ком:'☃️',лук:'🧅',луна:'🌙',лето:'☀️',мама:'👩',море:'🌊',
  молоко:'🥛',мяч:'⚽',нос:'👃',нюхать:'👃',обед:'🍲',остров:'🏝️',папа:'👨',палец:'☝️',рот:'👄',рыба:'🐟',
  сок:'🧃',сом:'🐟',сыр:'🧀',танец:'💃',топать:'🦶',ухо:'👂',утюг:'🔌',филин:'🦉',фрукт:'🍎',холод:'🥶',
  хлеб:'🍞',цапля:'🐦',цветок:'🌸',чашка:'☕',чай:'🍵',шар:'🎈',шагать:'🚶',щетка:'🪥',щипать:'🤏',эму:'🦤',
  этаж:'🏢',юла:'🌀',юмор:'😄',язык:'👅',яблоко:'🍏'
};

/* Узлы тропинки в порядке алфавита (33 шт). Для меню. */
const PATH_NODES='АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('').map(function(ch){
  var ws=LETTER_WORDS[ch]||[];
  return {
    letter:ch,
    sign:ws.length===0,
    words:ws.map(function(w){ return makeLetterWord({w:w, emoji:WORD_EMOJI[w]||'⭐'}); })
  };
});

/* Плоский список слов — на случай, если app.js его использует */
const WORDS=[];
PATH_NODES.forEach(function(n){ n.words.forEach(function(w){ WORDS.push(w); }); });
