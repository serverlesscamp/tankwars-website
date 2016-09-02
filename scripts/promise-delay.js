/*global Promise, module, setTimeout */
module.exports = function (duration) {
	'use strict';
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve();
		}, duration * 1000);
	});
};
