/* ============================================================
   БУКВОЕЖКИ — данные и конфигурация
   Этот файл меняется чаще всего. Логика игры — в app.js.
   ============================================================ */

/* База, откуда берутся ассеты (буквы, звуки, видео).
   jsDelivr раздаёт файлы из твоего GitHub-репозитория. */
const ASSET_BASE = 'https://cdn.jsdelivr.net/gh/Kabanovswimclub/bukvoezhki-assets@main/';

/* Собирает полный адрес ассета и кодирует кириллицу/пробелы автоматически. */
function assetURL(p){ return p ? encodeURI(ASSET_BASE + p) : null; }

/* Часто используемый ассет — гифка (пока одолжена для демо КОТ) */
const CAT_WEBP = 'video/9bd83fbf16e59510f70ace195d09d634bbdbe1cfa91368147667a720baec1692_500.webp';

/* ---------- Пластилиновые буквы (картинки), все 33 ---------- */
const LETTER_IMAGES = {
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

/* ---------- Звуки букв (пока записаны только нужные для 3 слов) ----------
   Чего нет в карте — озвучивается браузерным голосом-заглушкой. */
const LETTER_SOUNDS = {
  'К':'letter_voice/К.mp3','О':'letter_voice/О.mp3','Т':'letter_voice/Т.mp3',
  'Д':'letter_voice/Д.mp3','М':'letter_voice/М.mp3','Я':'letter_voice/Я.mp3',
  'Ч':'letter_voice/Ч.mp3'
};

/* ---------- Слова ----------
   object   — что слово означает (показывается ПОСЛЕ сборки): image / video / emoji
   audio    — звук слова целиком (и предложения — для экрана 3)
   sentence/sentenceVideo — данные для будущего экрана 3
   syllables/level — на будущее (чтение по слогам, порядок/сложность) */
const WORDS = [
  {
    id:'kot', word:'КОТ', syllables:['КОТ'], level:1,
    object:{ emoji:'🐱', image:CAT_WEBP, video:null },   // demo: гифка из папки video
    audio:{ word:'words_voice/Кот.mp3', sentence:null },
    sentence:'Кот очень любит рыбу.',
    sentenceVideo:CAT_WEBP
    // sentenceWords: [...]  // заполним на экране 3
  },
  {
    id:'dom', word:'ДОМ', syllables:['ДОМ'], level:1,
    object:{ emoji:'🏠', image:null, video:null },
    audio:{ word:'words_voice/Дом.mp3', sentence:null },
    sentence:'Дом стоит на горе.',
    sentenceVideo:null
  },
  {
    id:'myach', word:'МЯЧ', syllables:['МЯЧ'], level:1,
    object:{ emoji:'⚽', image:null, video:null },
    audio:{ word:'words_voice/Мяч.mp3', sentence:null },
    sentence:'Мяч прыгает высоко.',
    sentenceVideo:null
  }
];
