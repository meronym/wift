(function() {
  const overlay = document.querySelector('.overlay');
  const main = document.querySelector('.main');
  const spinner = document.querySelector('.spinner');
  const testAlert = document.querySelector('.test-alert');
  
  function showLoading() {
    overlay.style.display = 'none';
    main.style.display = 'none';
    testAlert.style.display = 'none';

    overlay.classList.add('faded');
    main.classList.add('faded');
    testAlert.classList.add('faded');
    spinner.classList.remove('active');

    document.querySelector('#scan-qr').classList.remove('hidden');
    document.querySelector('#back').classList.add('hidden');
    document.querySelector('#open-wallet').classList.remove('hidden');
    document.querySelector('#to-website').classList.add('hidden');
    document.querySelector('div.box-waiting').classList.remove('hidden');
    document.querySelector('div.box-confirm').classList.add('hidden');
    document.querySelector('div.box-qr').classList.add('hidden');
    document.querySelector('div.action-loader').classList.remove('active');

    overlay.style.display = 'flex';
    main.style.display = 'flex';
    testAlert.style.display = 'block';

    setTimeout(() => {
      overlay.classList.remove('faded');
      if (main.classList.contains('faded')) {
        spinner.classList.add('active');
      }
    }, 100);
  }

  function showMain() {
    spinner.classList.remove('active');
    setTimeout(() => {
      overlay.classList.remove('faded');
      main.classList.remove('faded');  
      testAlert.classList.remove('faded');
      spinner.classList.remove('active');
    }, 600);
  }

  function receiveMessage(event) {
    if (event.data.type !== 'wift-rpc')
      return;
    
    if (event.data.action === 'loading') {
      showLoading();
    }

    if (event.data.action === 'init') {
      initApp(event.data);
      showMain();
    }
  }
  
  window.addEventListener('message', receiveMessage, false);

  const clipboard = new ClipboardJS('.click-to-copy');    
  
  const ccAreas = document.querySelectorAll('.click-to-copy');
  [].forEach.call(ccAreas, (area) => {
    area.addEventListener('click', (event) => {
      let block = event.currentTarget;
      block.classList.add('copying');
      setTimeout(() => { block.classList.remove('copying') }, 500);
    })
  });
  
  document.querySelector('#scan-qr').onclick = () => {
    document.querySelector('#back').classList.remove('hidden');
    document.querySelector('#scan-qr').classList.add('hidden');
    document.querySelector('div.box-qr').classList.remove('hidden');
    document.querySelector('div.box-waiting').classList.add('hidden');
  };

  document.querySelector('#back').onclick = () => {
    document.querySelector('#scan-qr').classList.remove('hidden');
    document.querySelector('#back').classList.add('hidden');
    document.querySelector('div.box-waiting').classList.remove('hidden');
    document.querySelector('div.box-qr').classList.add('hidden');
  };
  
  function showConfirmation() {
    document.querySelector('#scan-qr').classList.add('hidden');
    document.querySelector('#back').classList.add('hidden');
    document.querySelector('#open-wallet').classList.add('hidden');
    document.querySelector('#to-website').classList.remove('hidden');
    document.querySelector('div.box-confirm').classList.remove('hidden');
    document.querySelector('div.box-waiting').classList.add('hidden');
    document.querySelector('div.box-qr').classList.add('hidden');
    document.querySelector('div.action-loader').classList.add('active');
  }

  function complete() {
    window.parent.postMessage({ type: 'wift-rpc', action: 'completed'}, '*');
  }

  document.querySelector('#to-website').onclick = (e) => {
    complete();
    e.preventDefault();
  }

  function initApp(data) {
    let amount = data.amount / 100;
    document.querySelector('.charge-company').innerHTML = data.company;
    document.querySelector('.charge-description').innerHTML = data.description;
    document.querySelector('.charge-price').innerHTML = '$' + amount; 
    document.querySelector('.pay-address-container > div.click-to-copy').setAttribute('data-clipboard-text', data.address);
    document.querySelector('.pay-address-data').innerHTML = data.address.slice(2);
    document.querySelector('.pay-amount-container > div.click-to-copy').setAttribute('data-clipboard-text', amount);
    document.querySelector('.pay-amount').innerHTML = amount;
    document.querySelector('#open-wallet').href = data.uri;
    document.querySelector('.box-qr > img').src = '//api.wift.local/demo/qr/' + data.charge;

    let interval = setTimeout(checkPayment, 1000);

    function checkPayment() {
      fetch(`http://api.wift.local/demo/charge/${data.charge}`)
        .then((resp) => resp.json())
        .then((data) => {
          if (data.status === 'payed') {
            console.log('$$$ was payed!');
            showConfirmation();
            setTimeout(complete, 5400);
          } else {
            console.log('still not payed');
            interval = setTimeout(checkPayment, 1000);
          }
        })
        .catch((err) => {
          console.log('got error:', err);
          interval = setTimeout(checkPayment, 2000);
        });
    }
    
    function pauseChecking() {
      clearTimeout(interval);
    }

    document.querySelector('button.close').onclick = function() {
      pauseChecking();
      overlay.classList.add('faded');
      testAlert.classList.add('faded');
      main.classList.add('faded');
      setTimeout(() => {
        const parent = window.parent;
        parent.postMessage({'type': 'wift-rpc', 'action': 'close'}, '*');
      }, 400);
    }  
  }

  window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      web3js = new Web3(web3.currentProvider);
      // console.log('We got web3!', web3.version);
      
      // const Eth = require('ethjs-query');
      // const EthContract = require('ethjs-contract');

      // const eth = new Eth(web3.currentProvider);
      // const contract = new EthContract(eth);

      // const abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"stop","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"owner_","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name_","type":"bytes32"}],"name":"setName","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"src","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"stopped","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"authority_","type":"address"}],"name":"setAuthority","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"start","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"authority","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"src","type":"address"},{"name":"guy","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"symbol_","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"authority","type":"address"}],"name":"LogSetAuthority","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"}],"name":"LogSetOwner","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"name":"sig","type":"bytes4"},{"indexed":true,"name":"guy","type":"address"},{"indexed":true,"name":"foo","type":"bytes32"},{"indexed":true,"name":"bar","type":"bytes32"},{"indexed":false,"name":"wad","type":"uint256"},{"indexed":false,"name":"fax","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"}];
      // const address = '0xc4375b7de8af5a38a93548eb8453a498222c4ff2';

      // const DaiContract = contract(abi).at(address);
      // DaiContract.transfer('0x0dE0BCb0703ff8F1aEb8C892eDbE692683bD8030', 1);

    } else {
      console.log('No web3? Defaulting to the ethereum: URI')
    }
  })

  // show loading screen

  // retrieve payment details
  // fetch('http://api.wift.local/v1/charge/1234', {'mode': 'cors'})
  //     .then(r => r.json())
  //     .then(data => {
  //         console.log(data);
  //     });

  // overlay.classList.add('faded');
  // main.style.display = 'none';
  // setTimeout(() => {
  //   overlay.classList.remove('faded');
  //   document.querySelector('.spinner').classList.add('active');
  // }, 1000);
})();
