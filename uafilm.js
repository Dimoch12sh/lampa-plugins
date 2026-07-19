(function () {
    'use strict';

    var NAME = 'uafilm';
    var KEY = 'uafilm_enabled';

    function isEnabled() {
        return Lampa.Storage.get(KEY, true) !== false;
    }

    // Усі можливі селектори, де може бути плеєр/посилання
    var SELECTORS = [
        '.film-player iframe',
        '.player iframe',
        '.video-player iframe',
        'iframe[src*="player"]',
        'iframe[src*="embed"]',
        'iframe[src*="video"]',
        '.full__player iframe',
        '.view--player iframe',
        'video source',
        'video'
    ];

    function extractUrl() {
        for (var i = 0; i < SELECTORS.length; i++) {
            var el = document.querySelector(SELECTORS[i]);
            if (!el) continue;

            if (el.tagName === 'IFRAME') {
                var u = el.getAttribute('data-src') || el.getAttribute('src');
                if (u && u.indexOf('http') === 0) return u;
            } else if (el.tagName === 'SOURCE') {
                var s = el.getAttribute('src');
                if (s && s.indexOf('http') === 0) return s;
            } else if (el.tagName === 'VIDEO') {
                var v = el.getAttribute('src') || (el.currentSrc) || '';
                if (v && v.indexOf('http') === 0) return v;
            }
        }
        return null;
    }

    function addPlugin() {
        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін увімкнено', time: 2500 });
        }

        Lampa.Events.on('full', function () {
            if (!isEnabled()) return;

            var tries = 0;
            var maxTries = 40; // до 20 сек

            var check = function () {
                var url = extractUrl();
                if (url) {
                    if (Lampa.Notifi) {
                        Lampa.Notifi.show({ title: 'UA-Kino', text: 'Знайдено потік', time: 2000 });
                    }
                    Lampa.Player.play({ url: url, title: 'UA-Kino Stream' });
                    return;
                }
                tries++;
                if (tries < maxTries) {
                    setTimeout(check, 500);
                } else {
                    if (Lampa.Notifi) {
                        Lampa.Notifi.show({ title: 'UA-Kino', text: 'Потік не знайдено (інший сайт?)', time: 3000 });
                    }
                }
            };

            // Спроба через MutationObserver + таймер
            var observer = new MutationObserver(function () {
                var url = extractUrl();
                if (url) {
                    observer.disconnect();
                    if (Lampa.Notifi) Lampa.Notifi.show({ title: 'UA-Kino', text: 'Знайдено потік', time: 2000 });
                    Lampa.Player.play({ url: url, title: 'UA-Kino Stream' });
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            check(); // паралельна перевірка таймером
            setTimeout(function () { observer.disconnect(); }, 20000);
        });
    }

    if (window.appready) addPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addPlugin(); });

})();