/*global module */
module.exports = function logWidget(element) {
	'use strict';
	element.appendLog = function (string) {
		element.value = element.value + '\n------\n' + string + '\n';
	};
	element.clearLog = function () {
		element.value = '';
	};
	return element;
};
