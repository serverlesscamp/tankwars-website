/*global module */
module.exports = function mapWidget(domElement, scale, model) {
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
				tankElement.addEventListener('animationend', function () {
					tankElement.removeAttribute('status');
				});
				domElement.appendChild(tankElement);
			}
			return tankElement;
		},
		getPositionedElement = function (x, y, type) {
			var id = 'type' + x + 'x' + y,
				element = document.getElementById(id);
			if (!element) {
				element = document.createElement(type);
				element.setAttribute('x', x);
				element.setAttribute('y', y);
				element.id = id;
				element.style.top = y * scale + 'px';
				element.style.left = x * scale + 'px';
				element.style.width = scale + 'px';
				element.style.height = scale + 'px';
				domElement.appendChild(element);
			}
			return element;
		},
		getWallElement = function (x, y) {
			return getPositionedElement(x, y, 'wall');
		},
		getFireElement = function (x, y) {
			return getPositionedElement(x, y, 'fire');
		},
		updateWalls = function (walls, maxStrength) {
			var forPurgingDomList = domElement.querySelectorAll('wall'),
				forPurgingIds = {};

			Array.prototype.slice.call(forPurgingDomList).forEach(function (element) {
				forPurgingIds[element.id] = true;
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
		updateSuddenDeathFields = function (fields) {
			var forPurgingDomList = domElement.querySelectorAll('fire'),
				forPurgingIds = {};

			Array.prototype.slice.call(forPurgingDomList).forEach(function (element) {
				forPurgingIds[element.id] = true;
			});


			fields.forEach(function (field) {
				var fieldDom = getFireElement(field.x, field.y);
				delete forPurgingIds[fieldDom.id];
			});
			Object.keys(forPurgingIds).forEach(function (id) {
				document.getElementById(id).remove();
			});
		},

		addBullet = function (tankElement, targetPosition) {
			var bulletElement = document.createElement('bullet');
			bulletElement.addEventListener('animationend', function () {
				bulletElement.remove();
			});
			bulletElement.style.top = tankElement.style.top;
			bulletElement.style.left = tankElement.style.left;
			bulletElement.style.transform = tankElement.style.transform;
			bulletElement.style.transformOrigin = Math.floor(scale / 2) + 'px ' + Math.floor(scale / 2) + 'px';
			bulletElement.style.width = (targetPosition + 1) * scale + 'px';
			bulletElement.style.height = scale + 'px';
			domElement.appendChild(bulletElement);
		},
		updateTanks = function (tanks) {
			Object.keys(tanks).forEach(function (tankKey) {
				var tankElement = getTankElement(tankKey),
					tank = tanks[tankKey];

				tankElement.style.top = tank.y * scale + 'px';
				tankElement.style.left = tank.x * scale + 'px';
				tankElement.style.width = (tank.length || 1) * scale + 'px';
				tankElement.style.height = (tank.width || 1) * scale + 'px';
				//tankElement.removeAttribute('status');
				tankElement.setAttribute('status', tank.status);
				if (tank.status === 'firing') {
					addBullet(tankElement, tank.targetRange);
				}
				smoothRotation(tankElement, directions[tank.direction]);
				if (tank.strength === 0) {
					tankElement.classList.add('exploded');
				} else {
					tankElement.classList.remove('exploded');
				}
			});
		},
		updateMap = function (map) {
			domElement.style.width = (map.width * scale + 1) + 'px';
			domElement.style.height = (map.height * scale + 1) + 'px';
			domElement.style.backgroundSize =  scale + 'px ' + scale + 'px ';
			updateWalls(map.walls, map.wallStrength);
			updateSuddenDeathFields(map.suddenDeathFields);
			updateTanks(map.tanks);
		};

	model.on('newMatch', function (map) {
		updateMap(map);
	});
	model.on('change', function (map) {
		updateMap(map);
	});
	return domElement;
};

