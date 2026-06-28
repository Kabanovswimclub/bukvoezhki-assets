/* ============================================================
   БУКВОЕЖКИ — menu.js  (меню-лес)
   ЭТАП 2: статика слоёв + карточка слова из WORDS[0].
   Ранний стык: тап по карточке → startGame(item).
   Тропинка/ёжик/листание/параллакс — будущие этапы (3–4).
   app.js не трогается. Грузить ПОСЛЕ splash.js (переопределяет showMenu).
   ============================================================ */
(function () {
  'use strict';

  /* ===== ИМЕНА ФАЙЛОВ В РЕПО — ПРОВЕРЬ И ПОПРАВЬ ПОД СВОИ =====
     Если в ui/menu/ файлы названы иначе — меняй только эти строки. */
  var MENU_ASSETS = {
    logo:   'ui/splash/logo.png',        // тот же логотип, что на сплеше
    bg:     'ui/menu/bg.png',            // фон: небо + дальний лес
    grass:  'ui/menu/grass.png',         // травяной пол (низ)
    trees:  'ui/menu/trees_side.png',    // боковые деревья (полноширинный PNG, центр прозрачный)
    bushes: 'ui/menu/bushes_side.png',   // боковые кустики (ближний план)
    frame:  'ui/menu/frame.png'          // рамка-табличка слова
  };

  function aurl(p) {
    if (!p) return '';
    return (typeof assetURL === 'function')
      ? assetURL(p)
      : ((typeof ASSET_BASE === 'string' ? ASSET_BASE : '') + p);
  }
  // картинка слова в данных может быть уже готовым URL или относительным путём
  function resolveArt(p) {
    if (!p) return '';
    return /^https?:/i.test(p) ? p : aurl(p);
  }

  var built = false, menuEl = null;

  function currentItem() {
    return (typeof WORDS !== 'undefined' && WORDS && WORDS.length) ? WORDS[0] : null;
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
      '<img class="m-bushes" alt="">' +
      '<img class="m-logo" alt="Буквоежки">';

    menuEl.querySelector('.m-bg').src     = aurl(MENU_ASSETS.bg);
    menuEl.querySelector('.m-grass').src  = aurl(MENU_ASSETS.grass);
    menuEl.querySelector('.m-trees').src  = aurl(MENU_ASSETS.trees);
    menuEl.querySelector('.m-bushes').src = aurl(MENU_ASSETS.bushes);
    menuEl.querySelector('.m-frame').src  = aurl(MENU_ASSETS.frame);
    menuEl.querySelector('.m-logo').src   = aurl(MENU_ASSETS.logo);

    renderCard(currentItem());

    // Ранний стык: тап по полянке → в игру (доведём на этапе 5).
    var card = document.getElementById('mCard');
    if (card) {
      card.addEventListener('click', function () {
        var it = currentItem();
        if (it && typeof startGame === 'function') startGame(it);
      });
    }

    built = true;
  }

  function renderCard(item) {
    var art = document.getElementById('mWordArt');
    var txt = document.getElementById('mWordText');
    if (!art || !txt) return;
    if (!item) { art.innerHTML = ''; txt.textContent = ''; return; }

    var img   = item.object && item.object.image;
    var emoji = item.object && item.object.emoji;

    if (img) {
      art.innerHTML = '<img class="m-word-img" alt="">';
      art.querySelector('img').src = resolveArt(img);
    } else {
      art.innerHTML = '<span class="m-word-emoji">' + (emoji || '') + '</span>';
    }
    txt.textContent = item.word || '';
  }

  // «Дверца» splash → menu. Переопределяет заглушку из splash.js
  // (menu.js грузится позже → эта версия побеждает).
  window.showMenu = function () {
    buildMenu();
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.add('hidden');
    if (menuEl) menuEl.classList.remove('hidden');
  };
})();
