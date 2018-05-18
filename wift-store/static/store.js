(function() {
    function genUID() {
        let uuid = '';
        for (let i = 0; i < 32; i++) {
            uuid += (Math.random() * 16 | 0).toString(16);
        }
        return uuid;
    }
    
    document.addEventListener('DOMContentLoaded', (e) => {
        // get or create a new anonymous userId

        // localStorage.clear();
        let userId = localStorage.getItem('wiftStoreUserId');

        if (!userId) {
            userId = genUID();
            localStorage.setItem('wiftStoreUserId', userId);
        }

        // inject the userId in the checkout form
        let input = document.createElement('input');
        input.hidden = true;
        input.name = 'userid';
        input.value = userId;
        document.querySelector('form').appendChild(input);

        console.log(userId);
        // 
    });

})();