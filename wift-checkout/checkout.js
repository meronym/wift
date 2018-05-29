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
    app.className = 'wift-checkout-app';
    app.src = path + '/app/app.html';
    app.style.display = 'none';
    appWindow = app || app.contentWindow;
    document.body.appendChild(app);

    // inject the checkout button
    const amount = parseInt(script.getAttribute('data-amount'));
    const btn = document.createElement('button');
    btn.innerHTML = '<span>Pay with Crypto</span>';
    btn.className = 'wift-button-el';
    btn.onclick = function(e) {
        // show app in waiting state
        app.contentWindow.postMessage({type: 'wift-rpc', action: 'loading'}, '*');
        setTimeout(() => { app.style.display = 'block'; }, 50);

        // retrieve an associated chargeId
        fetch('http://api.wift.local/demo/charge', {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            mode: 'cors',
            body: JSON.stringify({
                key: script.getAttribute('data-key'),
                amount: amount
            })
        })
        .then((resp) => resp.json())
        .then((data) => {
            console.log(data);
            
            // inject hidden input in form
            const chargeInput = document.createElement('input');
            chargeInput.hidden = true;
            chargeInput.name = 'wiftCharge';
            chargeInput.value = data.id;
            form.appendChild(chargeInput);

            // show app modal
            const chargeDetails = {
                type: 'wift-rpc',
                action: 'init',
                company: script.getAttribute('data-name'),
                description: script.getAttribute('data-description'),
                amount: data.amount,
                address: data.address,
                uri: data.uri,
                charge: data.id
            };
            app.contentWindow.postMessage(chargeDetails, '*');
        });

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

        if (event.data.action === 'completed') {
            app.style.display = 'none';
            form.submit();
        }
    }
    window.addEventListener('message', receiveMessage, false);
})();
