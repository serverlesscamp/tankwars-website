/*global module */
module.exports = function skipTurnsWidget(element, model) {
	'use strict';
	var turns = parseInt(element.getAttribute('turns'));
	element.addEventListener('click', function () {
		model.skipTurns(turns);
	});
};
