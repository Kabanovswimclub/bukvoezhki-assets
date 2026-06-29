/* ============================================================
   БУКВОЕЖКИ — menu.js  (меню-лес)
   ЭТАП 2: статика сцены + статичная полоса алфавита + карточка слова.
   Тропинка — пока ВИЗУАЛ (буквы приглушены). Ёжик/загорание/листание/
   привязка слов к буквам — этап 3. Ранний стык: тап по карточке → игра.
   app.js не трогается. Грузить ПОСЛЕ splash.js (переопределяет showMenu).
   ============================================================ */
(function () {
  'use strict';

  /* ===== ИМЕНА ФАЙЛОВ В РЕПО (регистр важен на GitHub Pages!) ===== */
  var MENU_ASSETS = {
    logo:  'ui/splash/logo.png',      // логотип (та же картинка, что на сплеше) — .png
    bg:    'ui/menu/bg.PNG',          // фон: небо + дальний лес
    grass: 'ui/menu/grass.PNG',       // травяной пол (низ)
    trees: 'ui/menu/trees_side.PNG',  // боковые деревья (полноширинный PNG)
    frame: 'ui/menu/frame.PNG'        // рамка-табличка слова
  };

  var ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

  function aurl(p) {
    if (!p) return '';
    return (typeof assetURL === 'function')
      ? assetURL(p)
      : ((typeof ASSET_BASE === 'string' ? ASSET_BASE : '') + p);
  }
  function resolveArt(p) { return !p ? '' : (/^https?:/i.test(p) ? p : aurl(p)); }

  var built = false, menuEl = null;

  function currentItem() {
    return (typeof WORDS !== 'undefined' && WORDS && WORDS.length) ? WORDS[0] : null;
  }

  // Полоса алфавита «змейкой» в 2 ряда (2-й ряд справа налево). Пока статична.
  function pathHTML() {
    var letters = ALPHABET.split('');
    var row1 = letters.slice(0, 17);
    var row2 = letters.slice(17).reverse();
    function row(arr) {
      return '<div class="m-path-row">' + arr.map(function (ch) {
        return '<span class="m-letter">' + ch + '</span>';
      }).join('') + '</div>';
    }
    return '<div class="m-path">' + row(row1) + row(row2) + '</div>';
  }

  function buildMenu() {
    if (built) return;
    menuEl = document.getElementById('menu');
    if (!menuEl) return;

    menuEl.innerHTML =
      '<img class="m-bg" alt="">' +
      '<img class="m-grass" alt="">' +
      '<div class="m-card" id="mCard">' +
        '<img class="m-frame" alt="">' +
        '<div class="m-card-content">' +
          '<div class="m-word-art" id="mWordArt"></div>' +
          '<div class="m-word-text" id="mWordText"></div>' +
        '</div>' +
      '</div>' +
      '<img class="m-trees" alt="">' +
      pathHTML() +
      '<img class="m-logo" alt="Буквоежки">';

    menuEl.querySelector('.m-bg').src    = aurl(MENU_ASSETS.bg);
    menuEl.querySelector('.m-grass').src = aurl(MENU_ASSETS.grass);
    menuEl.querySelector('.m-trees').src = aurl(MENU_ASSETS.trees);
    menuEl.querySelector('.m-frame').src = aurl(MENU_ASSETS.frame);
    menuEl.querySelector('.m-logo').src  = aurl(MENU_ASSETS.logo);

    renderCard(currentItem());

    // Ранний стык: тап по полянке → в игру (доведём на этапе 5).
    var card = document.getElementById('mCard');
    if (card) card.addEventListener('click', function () {
      var it = currentItem();
      if (it && typeof startGame === 'function') startGame(it);
    });

    built = true;
  }

  function renderCard(item) {
    var art = document.getElementById('mWordArt');
    var txt = document.getElementById('mWordText');
    if (!art || !txt) return;
    if (!item) { art.innerHTML = ''; txt.textContent = ''; return; }

    var img = item.object && item.object.image;
    var emoji = item.object && item.object.emoji;
    if (img) {
      art.innerHTML = '<img class="m-word-img" alt="">';
      art.querySelector('img').src = resolveArt(img);
    } else {
      art.innerHTML = '<span class="m-word-emoji">' + (emoji || '') + '</span>';
    }
    txt.textContent = item.word || '';
  }

  // «Дверца» splash → menu (переопределяет заглушку из splash.js).
  window.showMenu = function () {
    buildMenu();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.add('hidden');
    if (menuEl) menuEl.classList.remove('hidden');
  };
})();
