/*global module, require*/
module.exports = function grow(fieldList, width, height, options) {
	'use strict';
	var randomizer = (options && options.randomizer) || require('./randomizer'),
		xdeltas = [-1, 0, 1],
		ydeltas = [-1, 0, 1],
		inMap = function (ob) {
			return ob.x >= 0 && ob.x < width && ob.y >= 0 && ob.y < height;
		},
		fieldInArray = function (array, position) {
			return array.some(function (field) {
				return field.x === position.x && field.y === position.y;
			});
		},
		startFire = function () {
			var howMany = 1 + randomizer.randomInt(4),
				result = [],
				field;
			while (howMany > 0) {
				field = {x: randomizer.randomInt(width), y: randomizer.randomInt(height)};
				if (!fieldInArray(result, field)) {
					result.push(field);
				}
				howMany--;
			}
			return result;
		},
		nearbyFields = [];

	if (!fieldList || !fieldList.length) {
		return startFire();
	}
	fieldList.forEach(function (ob) {
		xdeltas.forEach(function (dx) {
			ydeltas.forEach(function (dy) {
				var point = {x: ob.x + dx, y: ob.y + dy};
				if (inMap(point) && !fieldInArray(fieldList, point)) {
					nearbyFields.push(point);
				}
			});
		});
	});
	return fieldList.concat(randomizer.shuffle(nearbyFields).slice(randomizer.randomInt(nearbyFields.length)));
};
