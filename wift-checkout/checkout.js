(function() {
    const script = document.querySelector('script.wift-button');
    const path = script.src.replace(/\/[^\/]+$/, '');
    const form = script.parentElement;

    // inject the checkout css
    const head = document.getElementsByTagName('head')[0];
    const checkoutCSS = document.createElement('link');
    checkoutCSS.setAttribute('type', 'text/css');
    checkoutCSS.setAttribute('rel', 'stylesheet');
    checkoutCSS.setAttribute('href', path + '/checkout.css');
    head.appendChild(checkoutCSS);

    // inject the checkout app iframe
    const app = document.createElement('iframe');
    app.className = 'wift_checkout_app';
    app.src = path + '/app/app.html';
    app.style.display = 'none';
    appWindow = app || app.contentWindow;
    document.body.appendChild(app);

    // inject the checkout button
    const btn = document.createElement('button');
    btn.innerHTML = '<span>Wift Crypto</span>';
    btn.className = 'wift-button-el';
    btn.onclick = function(e) {
        const chargeDetails = {
            'type': 'wift-rpc',
            'name': script.getAttribute('data-name'),
            'description': script.getAttribute('data-description'),
            'amount': parseInt(script.getAttribute('data-amount'))
        };
        app.contentWindow.postMessage(chargeDetails, '*');;
        app.style.display = 'block';
        e.preventDefault();
    }
    form.appendChild(btn);

    // setup rpc flow between the main window and the checkout iframe
    function receiveMessage(event) {
        if (event.origin !== "http://checkout.wift.local")
            return;

        if (event.data.type !== 'wift-rpc')
            return;

        if (event.data.action === 'close') {
            app.style.display = 'none';
        }
    }
    window.addEventListener('message', receiveMessage, false);

})();
