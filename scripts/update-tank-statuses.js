/*global module*/
module.exports = function tankStatusWidget(statusElements, model) {
	'use strict';
	var update = function (map) {
		Array.prototype.slice.call(statusElements).forEach(function (element) {
			var	tankKey = parseInt(element.getAttribute('key')),
			tankProp = element.getAttribute('flag');
			element.innerHTML = map.tanks[tankKey][tankProp];
		});
	};
	model.on('change', update);
	model.on('newMatch', update);
};

