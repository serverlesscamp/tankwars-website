/*global module, setTimeout */
module.exports = function mapWidget(domElement, scale) {
	'use strict';
	var document = domElement.ownerDocument,
		directions = {
			right: 0,
			top: 270,
			left: 180,
			bottom: 90
		},
		getWallStatus = function (wallStrength, maxStrength) {
			return Math.ceil(wallStrength * 4 / maxStrength) * 25;
		},
		smoothRotation = function (domElement, newRotation) {
			var currentRotation = parseInt(domElement.dataset.effectiveRotation) || 0,
				delta = (newRotation - currentRotation) % 360,
				effectiveRotation;

			if (delta === 270) {
				delta = -90;
			} else if (delta === -270) {
				delta = 90;
			}
			effectiveRotation = currentRotation + delta;
			domElement.dataset.effectiveRotation = effectiveRotation;
			domElement.style.transform = 'rotate(' + effectiveRotation + 'deg)';

		},
		getTankElement = function (tankKey) {
			var tankElement = domElement.querySelector('tank[key="' + tankKey + '"]');
			if (!tankElement) {
				tankElement = document.createElement('tank');
				tankElement.setAttribute('key', tankKey);
				domElement.appendChild(tankElement);
			}
			return tankElement;
		},
		getWallElement = function (x, y) {
			var wallElement = domElement.querySelector('wall[x="' + x + '"][y="' + y + '"]');
			if (!wallElement) {
				wallElement = document.createElement('wall');
				wallElement.setAttribute('x', x);
				wallElement.setAttribute('y', y);
				wallElement.id = 'wall' + x + 'x' + y;
				wallElement.style.top = y * scale + 'px';
				wallElement.style.left = x * scale + 'px';
				wallElement.style.width = scale + 'px';
				wallElement.style.height = scale + 'px';
				domElement.appendChild(wallElement);
			}
			return wallElement;
		},
		updateWalls = function (walls, maxStrength) {
			var forPurgingDomList = domElement.querySelectorAll('wall'),
				forPurgingIds = {};

			Object.keys(forPurgingDomList).forEach(function (key) {
				forPurgingIds[forPurgingDomList[key].id] = true;
			});

			walls.forEach(function (wall) {
				var wallDom = getWallElement(wall.x, wall.y);
				wallDom.setAttribute('status', getWallStatus(wall.strength, maxStrength));
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



				tankElement.style.top = tank.y * scale + 'px';
				tankElement.style.left = tank.x * scale + 'px';
				tankElement.style.width = (tank.length || 1) * scale + 'px';
				tankElement.style.height = (tank.width || 1) * scale + 'px';
				tankElement.removeAttribute('status');

				setTimeout(function () {
					tankElement.setAttribute('status', tank.status);
				}, 1);
				smoothRotation(tankElement, directions[tank.direction]);
				if (tank.strength === 0) {
					tankElement.classList.add('exploded');
				}
			});
		};
	domElement.updateMap = function (map) {
		domElement.style.width = (map.width * scale + 1) + 'px';
		domElement.style.height = (map.height * scale + 1) + 'px';
		domElement.style.backgroundSize =  scale + 'px ' + scale + 'px ';
		updateWalls(map.walls, map.wallStrength);
		updateTanks(map.tanks);
	};
	return domElement;
};

