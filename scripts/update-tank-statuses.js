/*global module*/
module.exports = function updateTankStatuses(map, document) {
	'use strict';
	var statusElements = document.querySelectorAll('[role=tankStatus]');
	Object.keys(statusElements).forEach(function (index) {
		var element = statusElements[index],
		tankKey = parseInt(element.getAttribute('key')),
		tankProp = element.getAttribute('flag');
		element.innerHTML = map.tanks[tankKey][tankProp];
	});
};

