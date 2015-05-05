var _ = require('underscore');
var Bluebird = require('bluebird');
var Crypto = require('crypto');
var Https = require('https');
var Querystring = require('querystring');


_.mixin({
    // Compact for objects
    compactObject: function(to_clean) {
        _.map(to_clean, function(value, key, to_clean) {
            if (value === undefined)
                delete to_clean[key];
        });
        return to_clean;
    }
});

var Bitstamp = function(key, secret, client_id) {
    this.key = key;
    this.secret = secret;
    this.client_id = client_id;

    // Expose id, key & secret to prototyped methods
    _.bindAll.apply(_, [this].concat(_.functions(this)));
};

Bitstamp.prototype._request = function(method, path, data, args) {
    var options = {
        host: 'www.bitstamp.net',
        path: path,
        method: method,
        headers: {
            'User-Agent': 'NodeJS ' + process.version + ' bitstamp-bluebird.js'
        }
    };

    if (method === 'post') {
        options.headers['Content-Length'] = data.length;
        options.headers['content-type'] = 'application/x-www-form-urlencoded';
    }

    return new Bluebird(function(resolve, reject) {
        var request = Https.request(options, function(response) {
            response.setEncoding('utf8');
            var buffer = '';
            response.on('data', function(chunk) {
                buffer += chunk;
            });
            response.on('end', function() {
                try {
                    var json = JSON.parse(buffer);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.on('error', function(error) {
            reject(error);
        });

        request.on('socket', function(socket) {
            socket.setTimeout(5000);
            socket.on('timeout', function() {
                request.abort();
            });
            socket.on('error', function(error) {
                reject(error);
            });
        });

        request.end(data);
    });
};

// If you call new Date() too fast it will generate
// the same ms. Helper function to make sure the nonce is
// truly unique (supports up to 999 calls per ms).
Bitstamp.prototype._generateNonce = function() {
    var now = new Date().getTime();

    if(now !== this.last)
        this.nonceIncr = -1;

    this.last = now;
    this.nonceIncr++;

    // Add padding to nonce increment
    // @link https://stackoverflow.com/questions/6823592/numbers-in-the-form-of-001
    var padding =
        this.nonceIncr < 10 ? '000' :
            this.nonceIncr < 100 ? '00' :
                this.nonceIncr < 1000 ?  '0' : '';
    return now + padding + this.nonceIncr;
};

Bitstamp.prototype._get = function(action, args) {
    args = _.compactObject(args);
    var path = '/api/' + action + '/?' + Querystring.stringify(args);
    return this._request('get', path, undefined, args);
};

Bitstamp.prototype._post = function(action, args) {
    if(!this.key || !this.secret || !this.client_id)
        return Bluebird.reject('Must provide key, secret and client ID to make this API request.');

    var path = '/api/' + action + '/';

    var nonce = this._generateNonce();
    var message = nonce + this.client_id + this.key;
    var signer = Crypto.createHmac('sha256', new Buffer(this.secret, 'utf8'));
    var signature = signer.update(message).digest('hex').toUpperCase();

    args = _.extend({
        key: this.key,
        signature: signature,
        nonce: nonce
    }, args);
    args = _.compactObject(args);

    var data = Querystring.stringify(args);

    return this._request('post', path, data, args);
};

//
// Public API
//

Bitstamp.prototype.transactions = function(options) {
    return this._get('transactions', options);
};

Bitstamp.prototype.ticker = function() {
    return this._get('ticker');
};

Bitstamp.prototype.order_book = function(group) {
    return this._get('order_book', { group: group });
};

Bitstamp.prototype.eur_usd = function() {
    return this._get('eur_usd');
};

//
// Private API
// Requires customer id, key & secret
//

Bitstamp.prototype.balance = function() {
    return this._post('balance');
};

Bitstamp.prototype.user_transactions = function(limit) {
    return this._post('user_transactions', { limit: limit });
};

Bitstamp.prototype.open_orders = function() {
    return this._post('open_orders');
};

Bitstamp.prototype.cancel_order = function(id) {
    return this._post('cancel_order', { id: id });
};

Bitstamp.prototype.buy = function(amount, price) {
    return this._post('buy', { amount: amount, price: price });
};

Bitstamp.prototype.sell = function(amount, price) {
    return this._post('sell', { amount: amount, price: price });
};

Bitstamp.prototype.withdrawal_requests = function() {
    return this._post('withdrawal_requests');
};

Bitstamp.prototype.bitcoin_withdrawal = function(amount, address) {
    return this._post('bitcoin_withdrawal', { amount: amount, address: address });
};

Bitstamp.prototype.bitcoin_deposit_address = function() {
    return this._post('bitcoin_deposit_address');
};

Bitstamp.prototype.unconfirmed_btc = function() {
    return this._post('unconfirmed_btc');
};

Bitstamp.prototype.ripple_withdrawal = function(amount, address, currency) {
    return this._post('ripple_withdrawal', { amount: amount, address: address, currency: currency });
};

Bitstamp.prototype.ripple_address = function() {
    return this._post('ripple_address');
};

module.exports = Bitstamp;
