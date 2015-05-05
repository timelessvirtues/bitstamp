var Bitstamp = require('./bitstamp.js');
var Bluebird = require('bluebird');


var publicBitstamp = new Bitstamp();

publicBitstamp.transactions({ time: 'minute' })
.then(function(transactions) {
    console.dir(transactions);
})
.catch(function(error) {
    console.error(error);
});
// publicBitstamp.ticker();
// publicBitstamp.order_book({ time: 'hour' });
// publicBitstamp.eur_usd();


var key = 'your key';
var secret = 'your secret';
var client_id = '0'; // your Bitstamp user ID
var privateBitstamp = new Bitstamp(key, secret, client_id);

// Commented out for your protection
// privateBitstamp.balance();
// privateBitstamp.user_transactions(100);
// privateBitstamp.open_orders();
// privateBitstamp.cancel_order(id);
// privateBitstamp.buy(amount, price);
// privateBitstamp.sell(amount, price);
// privateBitstamp.withdrawal_requests();
// privateBitstamp.bitcoin_withdrawal(amount, address);
// privateBitstamp.bitcoin_deposit_address();
// privateBitstamp.unconfirmed_btc();
// privateBitstamp.ripple_withdrawal(amount, address, currency);
// privateBitstamp.ripple_address();
