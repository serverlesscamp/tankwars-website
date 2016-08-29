/*global module */
module.exports = function mapWidget(domElement, multiplier) {
	'use strict';
	var document = domElement.ownerDocument,
		directions = {
			right: '0deg',
			top: '-90deg',
			left: '-180deg',
			bottom: '90deg'
		},
		getTankElement = function (tankKey) {
			var tankElement = domElement.querySelector('[role=tank][key="' + tankKey + '"]');
			if (!tankElement) {
				tankElement = document.createElement('div');
				tankElement.setAttribute('role', 'tank');
				tankElement.setAttribute('key', tankKey);
				domElement.appendChild(tankElement);
			}
			return tankElement;
		},
		getWallElement = function (x, y) {
			var wallElement = domElement.querySelector('[role=wall][x="' + x + '"][y="' + y + '"]');
			if (!wallElement) {
				wallElement = document.createElement('div');
				wallElement.setAttribute('role', 'wall');
				wallElement.setAttribute('x', x);
				wallElement.setAttribute('y', y);
				wallElement.id = 'wall' + x + 'x' + y;
				wallElement.style.top = y * multiplier + 'px';
				wallElement.style.left = x * multiplier + 'px';
				wallElement.style.width = multiplier + 'px';
				wallElement.style.height = multiplier + 'px';
				domElement.appendChild(wallElement);
			}
			return wallElement;
		},
		updateWalls = function (walls) {
			var forPurgingDomList = domElement.querySelectorAll('[role=wall]'),
				forPurgingIds = {};

			Object.keys(forPurgingDomList).forEach(function (key) {
				forPurgingIds[forPurgingDomList[key].id] = true;
			});

			walls.forEach(function (wall) {
				var wallDom = getWallElement(wall.x, wall.y);
				delete forPurgingIds[wallDom.id];
			});

			Object.keys(forPurgingIds).forEach(function (id) {
				document.getElementById(id).remove();
			});
		},
		updateTanks = function (tanks) {
			Object.keys(tanks).forEach(function (tankKey) {
				var tankElement = getTankElement(tankKey),
					tank = tanks[tankKey];
				tankElement.style.top = tank.y * multiplier + 'px';
				tankElement.style.left = tank.x * multiplier + 'px';
				tankElement.style.width = (tank.length || 1) * multiplier + 'px';
				tankElement.style.height = (tank.width || 1) * multiplier + 'px';
				tankElement.style.transform = 'rotate(' + directions[tank.direction] + ')';
			});
		};
	domElement.updateMap = function (map) {
		domElement.style.width = (map.width * multiplier + 1) + 'px';
		domElement.style.height = (map.height * multiplier + 1) + 'px';
		domElement.style.backgroundSize =  multiplier + 'px ' + multiplier + 'px ';
		updateWalls(map.walls);
		updateTanks(map.tanks);
	};
	return domElement;
};

