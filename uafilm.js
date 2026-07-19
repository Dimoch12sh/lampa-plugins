Lampa.Plugins.add('uafilm', {
    name: 'UA-Kino (uafilm)',
    version: '1.0.3',
    type: 'video',
    component: 'uafilm',
    onReady: function(){
        var KEY = 'uafilm_enabled';

        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін завантажено v1.0.3', time: 3000 });
        }

        // Додаємо пункт прямо в головне меню Lampa
        function addToMenu(){
            if (!Lampa.MainPage || !Lampa.MainPage.list) return;
            var exists = Lampa.MainPage.list.filter(function(i){ return i.component === 'uafilm'; }).length;
            if (exists) return;
            Lampa.MainPage.list.push({
                title: 'UA-Kino',
                icon: 'favorite',
                component: 'uafilm'
            });
        }
        addToMenu();
        setTimeout(addToMenu, 1000);

        // Власний компонент з меню налаштувань
        Lampa.Component.add('uafilm', {
            name: 'UA-Kino',
            icon: 'favorite',
            onBack: function(){ Lampa.Activity.back(); },
            onRender: function(){
                var enabled = Lampa.Storage.get(KEY, true);
                this.wid('main').html(
                    '<div style="padding:40px;color:#fff;">' +
                    '<h1 style="margin-bottom:20px;">UA-Kino (uafilm)</h1>' +
                    '<p style="font-size:20px;margin-bottom:20px;">Статус: <b>' + (enabled ? 'Увімкнено' : 'Вимкнено') + '</b></p>' +
                    '<button id="uafilm_toggle" style="padding:14px 24px;font-size:18px;border:none;border-radius:6px;background:#e74c3c;color:#fff;">' +
                    (enabled ? 'Вимкнути плагін' : 'Увімкнути плагін') + '</button>' +
                    '</div>'
                );
                var self = this;
                this.wid('main').find('#uafilm_toggle').on('click', function(){
                    var now = !Lampa.Storage.get(KEY, true);
                    Lampa.Storage.set(KEY, now);
                    self.onRender();
                });
            }
        });

        // Логіка парсингу
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