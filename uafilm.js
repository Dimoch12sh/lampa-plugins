Lampa.Plugins.add('uafilm', {
    name: 'UA-Kino (uafilm)',
    version: '1.0.4',
    type: 'video',
    component: 'uafilm',
    onReady: function(){
        var KEY = 'uafilm_enabled';

        if (Lampa.Notifi) {
            Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін завантажено v1.0.4', time: 3000 });
        }

        // --- САМОДІАГНОСТИКА: що існує у вашій Lampa ---
        var diag = [];
        diag.push('Settings: ' + (typeof Lampa.Settings));
        diag.push('MainPage: ' + (typeof Lampa.MainPage));
        diag.push('Component: ' + (typeof Lampa.Component));
        diag.push('Activity: ' + (typeof Lampa.Activity));
        diag.push('Storage: ' + (typeof Lampa.Storage));
        console.log('[uafilm] DIAG: ' + diag.join(' | '));

        // --- Спроба додати в головне меню (якщо є) ---
        try {
            if (Lampa.MainPage && Array.isArray(Lampa.MainPage.list)) {
                Lampa.MainPage.list.push({ title: 'UA-Kino', icon: 'favorite', component: 'uafilm' });
            }
        } catch(e) { console.log('[uafilm] menu err: ' + e); }

        // --- Спроба зареєструвати компонент (якщо є) ---
        try {
            if (typeof Lampa.Component !== 'undefined' && Lampa.Component.add) {
                Lampa.Component.add('uafilm', {
                    name: 'UA-Kino', icon: 'favorite',
                    onBack: function(){ if (Lampa.Activity) Lampa.Activity.back(); },
                    onRender: function(){
                        var enabled = Lampa.Storage.get(KEY, true);
                        this.wid('main').html(
                            '<div style="padding:40px;color:#fff;">' +
                            '<h1>UA-Kino</h1>' +
                            '<p>Статус: <b>' + (enabled ? 'Увімкнено' : 'Вимкнено') + '</b></p>' +
                            '<button id="ut" style="padding:14px 24px;">' +
                            (enabled ? 'Вимкнути' : 'Увімкнути') + '</button></div>'
                        );
                        var self = this;
                        this.wid('main').find('#ut').on('click', function(){
                            Lampa.Storage.set(KEY, !Lampa.Storage.get(KEY, true));
                            self.onRender();
                        });
                    }
                });
            }
        } catch(e) { console.log('[uafilm] component err: ' + e); }

        // --- ФОЛБЕК: кнопка прямо в картці фільму (не залежить від меню) ---
        Lampa.Events.on('full', function(){
            // чекаємо появу контейнера картки
            var tryAdd = function(){
                var box = document.querySelector('.full-start__btn, .watch, .view--player, .full__body');
                if (!box) { setTimeout(tryAdd, 500); return; }
                if (document.getElementById('uafilm_btn')) return;

                var btn = document.createElement('div');
                btn.id = 'uafilm_btn';
                btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:#e74c3c;color:#fff;padding:10px 14px;border-radius:8px;font-size:16px;cursor:pointer;';
                var render = function(){
                    var on = Lampa.Storage.get(KEY, true);
                    btn.textContent = 'UA-Kino: ' + (on ? 'УВІМК' : 'ВИМК');
                };
                render();
                btn.onclick = function(){
                    Lampa.Storage.set(KEY, !Lampa.Storage.get(KEY, true));
                    render();
                };
                document.body.appendChild(btn);
            };
            tryAdd();

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