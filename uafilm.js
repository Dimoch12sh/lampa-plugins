(function() {
    function isEnabled() {
        return localStorage.getItem('ua_kino_enabled') !== 'false';
    }

    Lampa.Plugins.add("uafilm_parser", {
        name: "UA-Kino Fix Improved",
        onReady: function() {
            Lampa.Settings.add({
                name: 'UA-Kino',
                component: 'ua_kino_settings',
                items: [
                    {
                        name: 'Увімкнути плагін',
                        type: 'toggle',
                        default: true,
                        onSave: function(value) {
                            localStorage.setItem('ua_kino_enabled', value);
                        }
                    }
                ]
            });

            Lampa.Events.on("full", function(data) {
                if (!isEnabled()) return;
                
                console.log("UA-Kino: Event 'full' triggered, starting observer...");

                const observer = new MutationObserver((mutations, obs) => {
                    const iframe = document.querySelector(".film-player iframe");
                    const url = iframe ? (iframe.getAttribute("data-src") || iframe.getAttribute("src")) : null;
                    
                    if (url) {
                        console.log("UA-Kino: Found URL:", url);
                        Lampa.Player.play({ url: url, title: "UA-Kino Stream" });
                        obs.disconnect();
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });
                
                setTimeout(() => {
                    observer.disconnect();
                }, 10000);
            });
        }
    });
})();
