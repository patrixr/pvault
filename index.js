require('babel-register')({
    ignore: false,
    only: /pvault\/lib/
});

var pvault = require('./lib/vault');

module.exports = pvault;