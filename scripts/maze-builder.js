/*global module */
module.exports = function mazeBuilder(width, height, horizontalWallProb, verticalWallProb, minSpacing, randomizer) {
	'use strict';
	var walls = [],
		splitChamber = function (left, top, right, bottom) {
			var isVerticalSplit = randomizer.random() * (horizontalWallProb + verticalWallProb) <= verticalWallProb,
				wallPosition, index,
				wall = [];
			if (isVerticalSplit) {
				wallPosition = left + 1 + randomizer.randomInt(right - left - 2);
				for (index = top; index <= bottom; index++) {
					wall.push({ x: wallPosition, y: index});
				}
				if (wallPosition - left - 2 > minSpacing) {
					splitChamber(left, top, wallPosition - 1, bottom);
				}
				if (right - wallPosition - 2 > minSpacing) {
					splitChamber(wallPosition + 1, top, right, bottom);
				}
			} else {
				wallPosition = top + 1 + randomizer.randomInt(bottom - top - 2);
				for (index = left; index <= right; index++) {
					wall.push({ x: index, y: wallPosition});
				}
				if (wallPosition - top - 2 > minSpacing) {
					splitChamber(left, top, right, wallPosition - 1);
				}
				if (bottom - wallPosition - 2 > minSpacing) {
					splitChamber(left, wallPosition + 1, right, bottom);
				}
			}
			wall = randomizer.shuffle(wall).slice(randomizer.randomInt(wall.length / 2) + 1);
			walls = walls.concat(wall);
		};
	splitChamber(0, 0, width - 1, height - 1);
	return walls;
};
