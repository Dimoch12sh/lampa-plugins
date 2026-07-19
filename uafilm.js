(function () {
    'use strict';

    var SOURCE_NAME = 'uafilm';
    var SOURCE_TITLE = 'UA-Kino';
    var HOST = 'https://klon.fun';
    var network = new Lampa.Reguest();

    // Допоміжні
    function q(html, re) { var m = html.match(re); return m ? m[1] : ''; }
    function qa(html, re) { return html.match(re) || []; }

    // === ПОШУК ===
    function search(params, oncomplite, onerror) {
        var query = encodeURIComponent(params.query);
        var url = HOST + '/index.php?do=search&subaction=search&story=' + query;

        network.timeout(15000);
        network.native(url, function (html) {
            if (!html) { onerror('no data'); return; }

            var items = [];
            // Реальна структура klon.fun: <a class="short-news__small-card__link" href="...">
            var cards = qa(html, /<a href="(https:\/\/klon\.fun\/(?:filmy|serialy)\/[0-9]+-[^"]+\.html)" class="short-news__small-card__link">([\s\S]*?)<\/a>/g);
            for (var i = 0; i < cards.length; i += 2) {
                var href = cards[i + 1];
                var blk = cards[i + 2] || '';
                var img = q(blk, /src="([^"]+\.(?:jpg|webp|jpeg|png))"/);
                var title = q(blk, /class="card-link__text[^"]*">([^<]+)</) || q(blk, /alt="([^"]+)"/);
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
            // Якщо не знайшли по картках — запасний варіант
            if (!items.length) {
                var links = qa(html, /<a href="(https:\/\/klon\.fun\/(?:filmy|serialy)\/[0-9]+-[^"]+\.html)"[^>]*>/g);
                for (var l = 0; l < links.length; l += 2) {
                    if (links[l + 1]) items.push({ id: links[l + 1], title: decodeHtml(links[l + 1]), url: links[l + 1], img: '', source: SOURCE_NAME });
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
            var m = html.match(/<div class="film-player"[^>]*>([\s\S]*?)<\/div>/);
            if (m) {
                var iframe = m[1].match(/data-src="([^"]+)"/) || m[1].match(/src="([^"]+)"/);
                if (iframe) playerUrl = iframe[1];
            }

            var title = q(html, /<title>([^<]+)</);
            var poster = q(html, /<meta property="og:image" content="([^"]+)"/) || q(html, /class="poster-block__poster"[^>]*><img[^>]*src="([^"]+)"/);
            var desc = q(html, /<meta property="og:description" content="([^"]+)"/);
            var year = q(html, /<div class="table-info__item[^"]*">\s*([0-9]{4})/);

            var movie = {
                title: decodeHtml(title.split(' дивитись')[0] || title),
                img: poster ? (poster.indexOf('http') === 0 ? poster : HOST + poster) : '',
                desc: decodeHtml(desc),
                year: year,
                source: SOURCE_NAME,
                player: playerUrl
            };

            oncomplite(movie);
        }, onerror);
    }

    // === ДЕТАЛІ (для каталогу) ===
    function detail(data, oncomplite, onerror) {
        full(data, oncomplite, onerror);
    }

    // Декодування HTML-сутностей
    function decodeHtml(s) {
        if (!s) return '';
        return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
                .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
    }

    // === РЕЄСТРАЦІЯ ===
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

    if (window.appready) addPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addPlugin(); });

})();