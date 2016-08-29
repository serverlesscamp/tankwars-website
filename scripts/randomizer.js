/*global module, require */
var _ = require('underscore');
module.exports = {
	shuffle: _.shuffle,
	random: Math.random,
	randomInt: function (maxInt) {
		'use strict';
		return Math.floor(maxInt * Math.random());
	}
};

