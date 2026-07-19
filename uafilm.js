(function(){
    let plugin_name = 'uafilm';

    // Зареєструвати плагін
    Lampa.Plugins.add(plugin_name, {
        name: 'UA-Kino (uafilm)',
        version: '1.0.0',
        type: 'video',
        component: plugin_name,
        onReady: function(){
            // Додаємо окремий пункт у налаштуваннях Lampa
            Lampa.Settings.add({
                name: 'UA-Kino (uafilm)',
                component: plugin_name,
                icon: 'favorite',
                page: {
                    // Це відкриє окрему сторінку налаштувань плагіна
                    info: 'Парсер відео з ua-kino / klon.fun',
                    items: [
                        {
                            name: 'Увімкнути плагін',
                            description: 'Автоматично підставляти потік у плеєр',
                            type: 'toggle',
                            default: true,
                            onChange: function(value){
                                Lampa.Storage.set(plugin_name + '_enabled', value);
                            }
                        },
                        {
                            name: 'Статус',
                            description: 'Поточний стан плагіна',
                            type: 'trigger',
                            value: 'Активний',
                            onClick: function(){ Lampa.Notifi.show({ title: 'UA-Kino', text: 'Плагін працює' }); }
                        }
                    ]
                }
            });

            // Логіка парсингу
            Lampa.Events.on('full', function(){
                if (Lampa.Storage.get(plugin_name + '_enabled', true) === false) return;

                let observer = new MutationObserver(function(mutations, obs){
                    let iframe = document.querySelector('.film-player iframe');
                    let url = iframe ? (iframe.getAttribute('data-src') || iframe.getAttribute('src')) : null;

                    if (url) {
                        Lampa.Player.play({ url: url, title: 'UA-Kino Stream' });
                        obs.disconnect();
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });

                setTimeout(function(){ observer.disconnect(); }, 10000);
            });

            console.log('[uafilm] plugin loaded');
        }
    });
})(window.Lampa);
