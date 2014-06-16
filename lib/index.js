var Runner = require('./runner');
var inject = require('./inject');

module.exports = SauceLabAdapter;

function SauceLabAdapter(){}
SauceLabAdapter.inject = inject;
SauceLabAdapter.runner = Runner;