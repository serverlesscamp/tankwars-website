/*global module*/
module.exports = function grow(fieldList, width, height) {
	'use strict';
	var allPositions = [],
		result = [],
		index,
		xdeltas = [-1, 0, 1],
		ydeltas = [-1, 0, 1],
		inMap = function (ob) {
			return ob.x >= 0 && ob.x < width && ob.y >= 0 && ob.y < height;
		};
	if (!fieldList || !fieldList.length) {
		return [{x: 0, y: 0}, {x: 0, y: height - 1}, {x: width - 1, y: 0}, {x: width - 1, y: height - 1}];
	}
	for (index = 0; index < width; index++) {
		allPositions[index] = new Array(height).fill(false);
	}
	fieldList.forEach(function (ob) {
		xdeltas.forEach(function (dx) {
			ydeltas.forEach(function (dy) {
				var point = {x: ob.x + dx, y: ob.y + dy};
				if (inMap(point)) {
					allPositions[point.x][point.y] = true;
				}
			});
		});
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
