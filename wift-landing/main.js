(function() {
    function selectTab(lang) {
        document.querySelector(`pre[data-lang=${lang}]`).classList.remove('hidden');
            
        let others = document.querySelectorAll(`pre:not([data-lang=${lang}])`);
        [].forEach.call(others, (elem) => {
            elem.classList.add('hidden');
        });
    }

    const tabs = document.querySelectorAll('ul.language-toggle input');
    [].forEach.call(tabs, (tab) => {
        tab.onchange = (e) => {
            let lang = e.target.getAttribute('id');
            selectTab(lang);            
        }
    });

    const activeLang = document.querySelector('input[name=language-toggle]:checked').getAttribute('id');
    selectTab(activeLang);
})();
