/*global module */
module.exports = function freeSpace(existingObjects, width, height) {
	'use strict';
	var allPositions = [],
		result = [],
		index;
	for (index = 0; index < width; index++) {
		allPositions[index] = new Array(height).fill(true);
	}
	existingObjects.forEach(function (ob) {
		if (ob.x >= 0 && ob.x < width && ob.y >= 0 && ob.y < height) {
			allPositions[ob.x][ob.y] = false;
		}
	});
	allPositions.forEach(function (column, x) {
		column.forEach(function (val, y) {
			if (val) {
				result.push({x: x, y: y});
			}
		});
	});
	return result;
};
