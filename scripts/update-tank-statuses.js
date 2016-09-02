/*global module*/
module.exports = function tankStatusWidget(statusElements, model) {
	'use strict';
	var update = function (map) {
		Object.keys(statusElements).forEach(function (index) {
			var element = statusElements[index],
			tankKey = parseInt(element.getAttribute('key')),
			tankProp = element.getAttribute('flag');
			element.innerHTML = map.tanks[tankKey][tankProp];
		});
	};
	model.on('change', update);
	model.on('newMatch', update);
};

