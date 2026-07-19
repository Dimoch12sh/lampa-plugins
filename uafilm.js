Lampa.Plugins.add('uafilm', {
    name: 'UA-Kino (uafilm)',
    version: '1.0.2',
    type: 'video',
    component: 'uafilm',
    onReady: function(){
        var KEY = 'uafilm_enabled';

        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін завантажено v1.0.2', time: 3000 });
        }

        // 1) Пункт у головних налаштуваннях (через component + page)
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

        // 2) Окремий компонент з власним меню (на випадок, якщо Settings не показує)
        Lampa.Component.add('uafilm', {
            name: 'UA-Kino',
            icon: 'favorite',
            onBack: function(){
                Lampa.Activity.back();
            },
            onRender: function(){
                var enabled = Lampa.Storage.get(KEY, true);
                this.wid('main').html(
                    '<div style="padding:40px;color:#fff;font-size:20px;">' +
                    '<h2>UA-Kino (uafilm)</h2>' +
                    '<p>Статус: <b>' + (enabled ? 'Увімкнено' : 'Вимкнено') + '</b></p>' +
                    '<button id="uafilm_toggle" style="padding:12px 20px;font-size:18px;">' +
                    (enabled ? 'Вимкнути' : 'Увімкнути') + '</button>' +
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