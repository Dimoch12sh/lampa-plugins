(function () {
    'use strict';

    var SOURCE_NAME = 'uafilm';
    var SOURCE_TITLE = 'UA-Kino';
    var HOST = 'https://klon.fun';

    var network = new Lampa.Reguest();

    function decodeHtml(s) {
        if (!s) return '';
        return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
                .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
    }

    function grep(html, re) {
        var m = html.match(re);
        return m ? (m[1] || m[0]) : '';
    }

    // === ПОШУК ===
    function search(params, oncomplite, onerror) {
        var query = encodeURIComponent(params.query);
        var url = HOST + '/index.php?do=search&subaction=search&story=' + query;

        network.timeout(15000);
        network.native(url, function (html) {
            if (!html) { onerror('no data'); return; }

            var items = [];
            var cards = html.match(/<a href="(https:\/\/klon\.fun\/(?:filmy|serialy)\/[0-9]+-[^"]+\.html)" class="short-news__small-card__link">([\s\S]*?)<\/a>/g) || [];

            for (var i = 0; i < cards.length; i++) {
                var href = grep(cards[i], /href="(https:\/\/klon\.fun\/[^"]+\.html)"/);
                var img = grep(cards[i], /src="([^"]+\.(?:jpg|webp|jpeg|png))"/);
                var title = grep(cards[i], /class="card-link__text[^"]*">([^<]+)</) || grep(cards[i], /alt="([^"]+)"/);
                if (href) {
                    items.push({
                        id: href,
                        title: decodeHtml(title || href),
                        url: href,
                        img: img ? (img.indexOf('http') === 0 ? img : HOST + img) : '',
                        source: SOURCE_NAME
                    });
                }
            }

            if (!items.length) { onerror('not found'); return; }
            oncomplite({ results: items, has_more: false });
        }, onerror);
    }

    // === СТОРІНКА ФІЛЬМУ ===
    function full(data, oncomplite, onerror) {
        var url = data.url || data.id;
        network.native(url, function (html) {
            if (!html) { onerror('no data'); return; }

            var playerUrl = '';
            var fm = html.match(/<div class="film-player"[^>]*>([\s\S]*?)<\/div>/);
            if (fm) {
                var ifr = fm[1].match(/data-src="([^"]+)"/) || fm[1].match(/src="([^"]+)"/);
                if (ifr) playerUrl = ifr[1];
            }

            var title = grep(html, /<title>([^<]+)</);
            var poster = grep(html, /<meta property="og:image" content="([^"]+)"/) || grep(html, /class="poster-block__poster"[^>]*><img[^>]*src="([^"]+)"/);
            var desc = grep(html, /<meta property="og:description" content="([^"]+)"/);
            var year = grep(html, /<div class="table-info__item[^"]*">\s*([0-9]{4})/);

            oncomplite({
                title: decodeHtml((title || '').split(' дивитись')[0]),
                img: poster ? (poster.indexOf('http') === 0 ? poster : HOST + poster) : '',
                desc: decodeHtml(desc),
                year: year,
                source: SOURCE_NAME,
                player: playerUrl
            });
        }, onerror);
    }

    function detail(data, oncomplite, onerror) {
        full(data, oncomplite, onerror);
    }

    var UA = {
        SOURCE_NAME: SOURCE_NAME,
        SOURCE_TITLE: SOURCE_TITLE,
        search: search,
        full: full,
        detail: detail,
        main: function () {},
        menu: function () {},
        list: function () {}
    };

    function addPlugin() {
        if (Lampa.Api.sources[SOURCE_NAME]) {
            if (Lampa.Noty) Lampa.Noty.show('UA-Kino вже встановлено');
            return;
        }

        Lampa.Api.sources[SOURCE_NAME] = UA;
        Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, {
            get: function () { return UA; }
        });

        var sources = {};
        if (Lampa.Params.values && Lampa.Params.values['source']) {
            Lampa.Arrays.extend(sources, Lampa.Params.values['source']);
            sources[SOURCE_NAME] = SOURCE_TITLE;
        } else {
            sources[SOURCE_NAME] = SOURCE_TITLE;
        }
        Lampa.Params.select('source', sources, SOURCE_NAME);

        if (Lampa.Notifi) Lampa.Notifi.show({ title: 'UA-Kino', text: 'Джерело додано', time: 2500 });
    }

    function startPlugin() {
        if (window.appready) addPlugin();
        else Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') addPlugin();
        });
    }

    if (!window.uafilm_plugin) startPlugin();
    window.uafilm_plugin = true;

})();