Lampa.Plugins.add('uafilm', {
    name: 'UA-Kino (uafilm)',
    version: '1.0.1',
    type: 'video',
    component: 'uafilm',
    onReady: function(){
        var KEY = 'uafilm_enabled';

        // Повідомлення про успішне завантаження (видно без консолі)
        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін завантажено', time: 3000 });
        }

        // Меню налаштувань
        Lampa.Settings.add({
            name: 'UA-Kino (uafilm)',
            component: 'uafilm',
            icon: 'favorite',
            page: {
                info: 'Парсер потоку з ua-kino / klon.fun',
                items: [
                    {
                        name: 'Увімкнути плагін',
                        description: 'Автоматично підставляти відео в плеєр',
                        type: 'toggle',
                        default: true,
                        onChange: function(val){ Lampa.Storage.set(KEY, val); }
                    }
                ]
            }
        });

        // Логіка
        Lampa.Events.on('full', function(){
            if (Lampa.Storage.get(KEY, true) === false) return;

            var observer = new MutationObserver(function(muts, obs){
                var iframe = document.querySelector('.film-player iframe');
                var url = iframe ? (iframe.getAttribute('data-src') || iframe.getAttribute('src')) : null;
                if (url) {
                    Lampa.Player.play({ url: url, title: 'UA-Kino Stream' });
                    obs.disconnect();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(function(){ observer.disconnect(); }, 10000);
        });
    }
});