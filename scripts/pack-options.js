/*global module */
module.exports = function packOptions(document) {
	'use strict';
	var optionFields = document.querySelectorAll('[role=option]'),
	options = {};
	Array.prototype.slice.call(optionFields).forEach(function (field) {
		if (field.getAttribute('data-type') === 'float') {
			options[field.getAttribute('name')] = parseFloat(field.value);
		} else {
			options[field.getAttribute('name')] = parseInt(field.value);
		}
	});
	return options;
};

