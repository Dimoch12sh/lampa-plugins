(function () {
    'use strict';

    var NAME = 'uafilm';
    var HOST = 'https://klon.fun';

    var networks = [];
    var LAMPA_VERSION = (typeof Lampa !== 'undefined' && Lampa.Manifest && Lampa.Manifest.app_digital) || 0;

    function grep(html, re) {
        var m = html.match(re);
        return m ? (m[1] || m[0]) : '';
    }

    function decodeHtml(s) {
        if (!s) return '';
        return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
                .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
                .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
    }

    function newNetwork() {
        var n = new Lampa.Reguest();
        networks.push(n);
        return n;
    }

    function clearNetworks() {
        networks.forEach(function (n) { n.clear(); });
        networks = [];
    }

    // Компонент пошуку/відтворення
    var component = function () {
        var network = newNetwork();
        var data = {};

        this.create = function () {
            var activity = Lampa.Activity.active();
            if (!activity || !activity.movie) return;

            var movie = activity.movie;
            var title = movie.title || movie.name || '';
            var year = (movie.year || movie.release_date || '').toString().slice(0, 4);

            // Шукаємо на klon.fun
            var searchUrl = HOST + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(title);

            network.timeout(15000);
            network.native(searchUrl, function (html) {
                if (!html) { noResult(); return; }

                // Шукаємо посилання на фільм
                var cards = html.match(/<a href="(https:\/\/klon\.fun\/(?:filmy|serialy)\/[0-9]+-[^"]+\.html)" class="short-news__small-card__link">([\s\S]*?)<\/a>/g) || [];

                var found = null;
                for (var i = 0; i < cards.length; i++) {
                    var href = grep(cards[i], /href="(https:\/\/klon\.fun\/[^"]+\.html)"/);
                    var cardTitle = grep(cards[i], /class="card-link__text[^"]*">([^<]+)</) || grep(cards[i], /alt="([^"]+)"/);
                    if (href && (!found || cardTitle.toLowerCase().indexOf(title.toLowerCase()) >= 0)) {
                        found = { url: href, title: cardTitle };
                    }
                }

                if (!found) { noResult(); return; }

                // Завантажуємо сторінку фільму
                var network2 = newNetwork();
                network2.timeout(15000);
                network2.native(found.url, function (html2) {
                    if (!html2) { noResult(); return; }

                    var playerUrl = '';
                    var fm = html2.match(/<div class="film-player"[^>]*>([\s\S]*?)<\/div>/);
                    if (fm) {
                        var ifr = fm[1].match(/data-src="([^"]+)"/) || fm[1].match(/src="([^"]+)"/);
                        if (ifr) playerUrl = ifr[1];
                    }

                    var poster = grep(html2, /<meta property="og:image" content="([^"]+)"/) || grep(html2, /class="poster-block__poster"[^>]*><img[^>]*src="([^"]+)"/);
                    var desc = grep(html2, /<meta property="og:description" content="([^"]+)"/);

                    if (playerUrl) {
                        Lampa.Player.play({ url: playerUrl, title: 'UA-Kino: ' + decodeHtml(cardTitle || found.title) });
                        if (Lampa.Noty) Lampa.Noty.show('UA-Kino: плеєр завантажено');
                    } else {
                        noResult();
                    }
                }, function () { noResult(); });
            }, function () { noResult(); });
        };

        function noResult() {
            if (Lampa.Noty) Lampa.Noty.show('UA-Kino: не знайдено на klon.fun');
        }

        this.destroy = function () {
            clearNetworks();
        };
    };

    // Старт плагіна
    function startPlugin() {
        window.uafilm_plugin = true;

        var manifest = {
            type: 'video',
            version: '1.0.0',
            name: 'UA-Kino (klon.fun)',
            description: 'Пошук та перегляд фільмів з klon.fun',
            component: NAME,
            onContextMenu: function (object) {
                return { name: 'Дивитись на UA-Kino', description: 'Пошук на klon.fun' };
            },
            onContextLauch: function (object) {
                Lampa.Component.add(NAME, component);
                Lampa.Activity.push({
                    url: '',
                    title: 'UA-Kino',
                    component: NAME,
                    movie: object,
                    page: 1
                });
            }
        };
        Lampa.Manifest.plugins = manifest;

        // Кнопка на сторінці фільму (як у fx.js)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector" data-subtitle="UA-Kino v1.0.0">' +
                    '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
                    '<span>UA-Kino</span></div>');
                btn.on('hover:enter', function () {
                    Lampa.Component.add(NAME, component);
                    Lampa.Activity.push({
                        url: '',
                        title: 'UA-Kino',
                        component: NAME,
                        movie: e.data.movie,
                        page: 1
                    });
                });
                var target = e.object.activity.render().find('.view--torrent, .view--online, .full-start__button').first();
                if (target.length) target.after(btn);
                else e.object.activity.render().find('.full-start').append(btn);
            }
        });

        // Налаштування (як у fx.js через SettingsApi)
        if (typeof Lampa.SettingsApi !== 'undefined' && Lampa.SettingsApi.addComponent) {
            Lampa.SettingsApi.addComponent({
                component: NAME,
                name: 'UA-Kino',
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
            });
            Lampa.Template.add('settings_uafilm', '<div><div class="settings-param"><div class="settings-param__name">UA-Kino (klon.fun)</div><div class="settings-param__value">v1.0.0</div></div></div>');
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == NAME) {}
            });
        }
    }

    // Запуск
    if (!window.uafilm_plugin && LAMPA_VERSION >= 155) startPlugin();

})();