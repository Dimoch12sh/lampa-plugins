(function () {
    'use strict';

    var NAME = 'uafilm';
    var KEY = 'uafilm_enabled';

    function isEnabled() {
        return Lampa.Storage.get(KEY, true) !== false;
    }

    function addPlugin() {
        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін увімкнено', time: 2500 });
        }

        Lampa.Events.on('full', function () {
            if (!isEnabled()) return;

            var tries = 0;
            var maxTries = 40; // до 20 c

            var start = function () {
                var iframe = document.querySelector('.film-player iframe');
                if (!iframe) { retry(); return; }

                var url = iframe.getAttribute('data-src') || iframe.getAttribute('src');
                if (!url) { retry(); return; }

                // Якщо плеєр ще не завантажився — підставляємо src примусово
                if (!iframe.getAttribute('src')) {
                    iframe.setAttribute('src', url);
                    if (Lampa.Notifi) Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плеєр завантажено', time: 2000 });
                }
            };

            var retry = function () {
                tries++;
                if (tries < maxTries) setTimeout(start, 500);
                else if (Lampa.Notifi) Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плеєр не знайдено', time: 3000 });
            };

            // Стежимо за появою плеєра
            var observer = new MutationObserver(function () {
                var iframe = document.querySelector('.film-player iframe');
                if (iframe) {
                    var url = iframe.getAttribute('data-src') || iframe.getAttribute('src');
                    if (url && !iframe.getAttribute('src')) {
                        iframe.setAttribute('src', url);
                        observer.disconnect();
                        if (Lampa.Notifi) Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плеєр завантажено', time: 2000 });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            start();
            setTimeout(function () { observer.disconnect(); }, 20000);
        });
    }

    if (window.appready) addPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addPlugin(); });

})();