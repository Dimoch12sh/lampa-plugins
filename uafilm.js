(function () {
    'use strict';

    var NAME = 'uafilm';
    var KEY = 'uafilm_enabled';

    function isEnabled() {
        return Lampa.Storage.get(KEY, true) !== false;
    }

    function addPlugin() {
        // Повідомлення про завантаження
        if (Lampa.Noty) {
            Lampa.Noty.show('UA-Kino: плагін активний');
        } else if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін активний' });
        }

        // 1) Пункт у налаштуваннях (викликаємо ТІЛЬКИ після app:ready)
        try {
            if (Lampa.Settings && Lampa.Settings.add) {
                Lampa.Settings.add({
                    name: 'UA-Kino (uafilm)',
                    component: NAME,
                    icon: 'favorite',
                    page: {
                        info: 'Парсер потоку з ua-kino / klon.fun',
                        items: [
                            {
                                name: 'Увімкнути плагін',
                                description: 'Автоматично підставляти відео в плеєр',
                                type: 'toggle',
                                default: true,
                                onChange: function (val) { Lampa.Storage.set(KEY, val); }
                            }
                        ]
                    }
                });
            }
        } catch (e) {
            console.log('[uafilm] Settings.add err: ' + e);
        }

        // 2) Пункт у головному меню (якщо доступно)
        try {
            if (Lampa.MainPage && Array.isArray(Lampa.MainPage.list)) {
                var exists = Lampa.MainPage.list.filter(function (i) { return i.component === NAME; }).length;
                if (!exists) {
                    Lampa.MainPage.list.push({ title: 'UA-Kino', icon: 'favorite', component: NAME });
                }
            }
        } catch (e) {
            console.log('[uafilm] MainPage err: ' + e);
        }

        // 3) Логіка парсингу
        Lampa.Events.on('full', function () {
            if (!isEnabled()) return;

            var observer = new MutationObserver(function (muts, obs) {
                var iframe = document.querySelector('.film-player iframe');
                var url = iframe ? (iframe.getAttribute('data-src') || iframe.getAttribute('src')) : null;
                if (url) {
                    Lampa.Player.play({ url: url, title: 'UA-Kino Stream' });
                    obs.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(function () { observer.disconnect(); }, 10000);
        });
    }

    // Чекаємо повної готовності додатку (як у реальних плагінів)
    if (window.appready) {
        addPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') addPlugin();
        });
    }

})();