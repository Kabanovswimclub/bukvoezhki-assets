/* ============================================================
   БУКВОЕЖКИ — данные и конфигурация. Логика — в app.js
   ============================================================ */

const ASSET_BASE='https://cdn.jsdelivr.net/gh/Kabanovswimclub/bukvoezhki-assets@main/';
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

/* ---------- Простые слова (буквы → слово) ---------- */
const SIMPLE=[
  {w:'дом',emoji:'🏠'},{w:'мяч',emoji:'⚽'},{w:'сом',emoji:'🐟'},{w:'ком',emoji:'⚪'},
  {w:'кот',emoji:'🐱'},{w:'кит',emoji:'🐳'},{w:'рот',emoji:'👄'},{w:'нос',emoji:'👃'},
  {w:'лес',emoji:'🌲'},{w:'сок',emoji:'🧃'},{w:'сыр',emoji:'🧀'},{w:'мак',emoji:'🌺'}
];
/* ---------- Слоговые слова (буквы → слоги → слово) ---------- */
const SYLL=[
  {w:'мама',emoji:'👩',syl:['МА','МА']},
  {w:'папа',emoji:'👨',syl:['ПА','ПА']},
  {w:'рыба',emoji:'🐟',syl:['РЫ','БА']},
  {w:'коза',emoji:'🐐',syl:['КО','ЗА']},
  {w:'молоко',emoji:'🥛',syl:['МО','ЛО','КО']}
];

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

/* поток: после каждых двух простых слов — одно слоговое */
const WORDS=[]; let _si=0;
SIMPLE.forEach((sw,i)=>{
  WORDS.push(makeLetterWord(sw));
  if((i+1)%2===0 && _si<SYLL.length) WORDS.push(makeSyllWord(SYLL[_si++]));
});
while(_si<SYLL.length) WORDS.push(makeSyllWord(SYLL[_si++]));
