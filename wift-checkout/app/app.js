(function() {
    function receiveMessage(event) {
        if (event.data.type !== 'wift-rpc')
            return;
        document.querySelector('.name').innerHTML = event.data.name;
        document.querySelector('.description').innerHTML = event.data.description;
        document.querySelector('.pay-button').innerHTML = 'Pay $' + event.data.amount / 100; 
    }
    
    window.addEventListener('message', receiveMessage, false);

    document.querySelector('.wift-app-close').onclick = function() {
        const parent = window.parent;
        parent.postMessage({'type': 'wift-rpc', 'action': 'close'}, '*');
    }

    document.querySelector('.pay-button').onclick = function(e) {
        // retrieve payment details
        fetch('http://api.wift.local/v1/charge/1234', {'mode': 'cors'})
            .then(r => r.json())
            .then(data => {
                console.log(data);
            })
        // show next screen
        document.querySelector('.screen-welcome').style.display = 'none';
        const ns = document.querySelector('.screen-address');
        ns.style.display = 'block';
        e.preventDefault();
    }
})();
