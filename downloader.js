(function () {
    'use strict';

    function startPlugin() {
        // Проверяем наличие Lampa, ContextMenu и метода show
        if (window.Lampa && Lampa.ContextMenu && Lampa.ContextMenu.show) {
            try {
                console.log('Downloader plugin v1.3:', 'Loaded');
                Lampa.Noty.show('Downloader plugin v1.3 loaded!');

                // Сохраняем оригинальную функцию
                var original_show = Lampa.ContextMenu.show;

                // Переопределяем функцию
                Lampa.ContextMenu.show = function (params) {
                    try {
                        var item = params.item || {};
                        var url = item.url || (item.file ? item.file : null) || item.video;

                        if (url && typeof url === 'string') {
                            params.items.push({
                                title: 'Скачать',
                                icon: 'download',
                                onSelect: function () {
                                    try {
                                        if (typeof Lampa.Android !== 'undefined' && Lampa.Android.open) {
                                            Lampa.Android.open(url);
                                        } else {
                                            window.open(url, '_blank');
                                        }
                                    } catch (e) {
                                        Lampa.Noty.show('Download error: ' + e.message);
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Downloader plugin error in ContextMenu:', e);
                    }
                    
                    original_show.apply(this, arguments);
                };
            } catch (e) {
                Lampa.Noty.show('Plugin crash: ' + e.message);
            }

        } else {
            // Если что-то не готово, ждем
            setTimeout(startPlugin, 200);
        }
    }

    if (!window.plugin_downloader_ready) {
        window.plugin_downloader_ready = true;
        startPlugin();
    }
})();