/*global module, localStorage */
module.exports = function localStorageCacheWidget(field, property) {
	'use strict';
	field.addEventListener('change', function () {
		localStorage[property] = this.value;
	});
	if (localStorage[property]) {
		field.value = localStorage[property];
	}
	return field;
};
