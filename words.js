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

/* ---------- Звуки букв — весь алфавит (letter_voice/<Буква>.mp3) ---------- */
const LETTER_SOUNDS={};
'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('').forEach(ch=>{ LETTER_SOUNDS[ch]='letter_voice/'+ch+'.mp3'; });

/* ---------- Слова ----------
   image  — гифка предмета: video/<слово>.gif (кириллица, строчные)
   audio  — звук слова: words_voice/<Слово>.mp3 (кириллица, с заглавной)
   emoji  — запасной вариант, если гифка не загрузится */
const WORD_LIST=[
  {w:'дом', emoji:'🏠'}, {w:'мяч', emoji:'⚽'}, {w:'сом', emoji:'🐟'}, {w:'ком', emoji:'⚪'},
  {w:'кот', emoji:'🐱'}, {w:'кит', emoji:'🐳'}, {w:'рот', emoji:'👄'}, {w:'нос', emoji:'👃'},
  {w:'лес', emoji:'🌲'}, {w:'сок', emoji:'🧃'}, {w:'сыр', emoji:'🧀'}, {w:'мак', emoji:'🌺'}
];
const WORDS=WORD_LIST.map(({w,emoji})=>{
  const up=w.toUpperCase(), cap=w[0].toUpperCase()+w.slice(1);
  return {
    id:w, word:up, syllables:[up], level:1,
    object:{ emoji, image:'video/'+w+'.gif', video:null },
    audio:{ word:'words_voice/'+cap+'.mp3', sentence:null },
    sentence:null
  };
});
