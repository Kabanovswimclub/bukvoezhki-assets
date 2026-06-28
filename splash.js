/* ============================================================
   БУКВОЕЖКИ — splash.js  (заставка)
   Логотип fade-in → на 2-й секунде появляется кнопка «Начать игру»
   → тап → showMenu(). Показывается один раз за сессию (F5 пропускает).
   Зависит только от конвенции экранов: <section class="screen">,
   скрытие через класс .hidden. app.js НЕ трогается.
   ============================================================ */
(function () {
  'use strict';

  var SEEN_KEY = 'bukvoezhki_splash_seen';

  // Показать один экран по id, остальные .screen — спрятать.
  function setScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.add('hidden');
    var el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  // «Дверца» splash → menu. Когда появится menu.js, он переопределит
  // window.showMenu (добавит инициализацию меню) — он грузится позже и победит.
  window.showMenu = function () { setScreen('menu'); };

  function initSplash() {
    var seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}

    // Уже видели в этой сессии (например, F5) → сразу в меню.
    if (seen) { showMenu(); return; }

    setScreen('splash');

    // Подставляем логотип через общий assetURL (из words.js).
    var logo = document.getElementById('splashLogo');
    if (logo) {
      var url = (typeof assetURL === 'function')
        ? assetURL('ui/splash/logo.png')
        : ((typeof ASSET_BASE === 'string' ? ASSET_BASE : '') + 'ui/splash/logo.png');
      logo.src = url;
    }

    var btn = document.getElementById('splashStart');

    // Кнопка появляется на 2-й секунде от загрузки.
    setTimeout(function () {
      if (btn) btn.classList.add('show');
    }, 2000);

    if (btn) {
      btn.addEventListener('click', function () {
        try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
        showMenu();
      });
    }
  }

  // Запуск, даже если DOM уже готов.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
  } else {
    initSplash();
  }
})();
