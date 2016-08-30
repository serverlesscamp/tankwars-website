/*global module, require */
var makeEmitter = require('./mini-emit'),
	freeSpace = require('./free-space');
module.exports = function TankWarsModel(args) {
	'use strict';
	var self = makeEmitter(this),
		options = args || {},
		mazeBuilder = options.mazeBuilder || require('./maze-builder'),
		directions = ['top', 'left', 'bottom', 'right'],
		movements = {
			top: { x: 0, y: -1 },
			left: { x: -1, y: 0 },
			bottom: {x: 0, y: 1},
			right: {x: 1, y: 0}
		},
		randomizer = options.randomizer || require('./randomizer'),
		walls = options.walls,
		tanks = options.tanks,
		mapWidth = options.mapWidth,
		mapHeight = options.mapHeight,
		wallStrength = options.wallStrength,
		maxAmmo = options.maxAmmo,
		tankStrength = options.tankStrength,
		wallDamage = options.wallDamage,
		tankDamage = options.tankDamage,
		weaponRange = options.weaponRange,
		weaponDamage = options.weaponDamage,
		completeMap = function () {
			return {
				walls: walls,
				tanks: tanks,
				width: mapWidth,
				height: mapHeight,
				wallStrength: wallStrength
			};
		},
		wallByPosition = function (x, y) {
			return walls.find(function (wall) {
				return wall.x === x && wall.y === y;
			});
		},
		tankByPosition = function (x, y) {
			return tanks.find(function (tank) {
				return tank.x === x && tank.y === y;
			});
		},
		makeWall = function (wallPosition) {
			return {
				x: wallPosition.x,
				y: wallPosition.y,
				strength: wallStrength
			};
		},
		makeTank = function (tankPosition) {
			return {
				direction: randomizer.shuffle(directions)[0],
				x: tankPosition.x,
				y: tankPosition.y,
				strength: tankStrength,
				ammo: maxAmmo,
				status: 'passive'
			};
		},
		damageWall = function (wall, damage) {
			wall.strength -= damage;
			if (wall.strength <= 0) {
				self.removeWall(wall.x, wall.y);
			}
		},
		tryMoving = function (tank, direction) {
			var movement = movements[direction],
				x = tank.x + movement.x,
				y = tank.y + movement.y,
				wallInFront = wallByPosition(x, y),
				tankInFront = tankByPosition(x, y);
			if (wallInFront) {
				tank.status = 'bump-' + direction;
				tank.strength = Math.max(0, tank.strength - wallDamage);
				damageWall(wallInFront, tankDamage);
			} else if (tankInFront) {
				tank.status = 'bump-' + direction;
				tank.strength = Math.max(0, tank.strength - tankDamage);
				tankInFront.strength = Math.max(0, tankInFront.strength - tankDamage);
				tankInFront.status = 'bumped';
			} else if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
				tank.status = 'bump-' + direction;
				tank.strength = Math.max(0, tank.strength - wallDamage);
			} else {
				tank.status = 'moving';
				tank.x += movement.x;
				tank.y += movement.y;
			}
		},
		tryShooting = function (tank) {
			var movement = movements[tank.direction],
				range, wallTarget, tankTarget, x = tank.x, y = tank.y;
			if (!tank.ammo) {
				return;
			}
			for (range = 0; range < weaponRange && !wallTarget && !tankTarget; range++) {
				x += movement.x;
				y += movement.y;
				wallTarget = wallByPosition(x, y);
				if (!wallTarget) {
					tankTarget = tankByPosition(x, y);
				}
			}
			tank.status = 'firing';
			tank.target = {x: x, y: y};
			tank.ammo -= 1;
			if (wallTarget) {
				damageWall(wallTarget, weaponDamage);
			}
		};
	self.newMatch = function (options) {
		var numTanks = options.numTanks || 2,
			verticalWallProb = options.verticalWallProb || 0.5,
			horizontalWallProb = options.horizontalWallProb || 0.5,
			minSpacing = options.minSpacing || 3;

		mapWidth = options.mapWidth || 32;
		mapHeight = options.mapHeight || 24;
		wallStrength = options.wallStrength || 100;
		maxAmmo = options.maxAmmo || 100;
		tankStrength = options.tankStrength || 200;
		wallDamage = options.wallDamage || 30;
		tankDamage = options.tankDamage || 50;
		weaponRange = options.weaponRange || 5;
		weaponDamage = options.weaponDamage || 20;

		walls = mazeBuilder(mapWidth, mapHeight, horizontalWallProb, verticalWallProb, minSpacing, randomizer).map(makeWall);
		tanks = randomizer.shuffle(freeSpace(walls, mapWidth, mapHeight)).slice(-1 * numTanks).map(makeTank);
		self.emit('newMatch', completeMap());
	};
	self.addWall = function (x, y) {
		if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
			walls.push(makeWall({x: x, y: y}));
			self.emit('change', completeMap());
		}
	};
	self.removeWall = function (x, y) {
		var existing = wallByPosition(x, y);
		walls = walls.filter(function (wall) {
			return wall !== existing;
		});
		self.emit('change', completeMap());
	};
	self.getMap = function () {
		return completeMap();
	};
	self.getSupportedCommands = function () {
		return ['turn-left', 'turn-right', 'forward', 'reverse', 'fire'];
	};
	self.executeCommand = function (tankIndex, command) {
		var tank = tanks[tankIndex];
		if (!tank.strength) {
			return;
		}
		tanks.forEach(function (atank) {
			atank.status = 'static';
		});
		if (command === 'forward') {
			tryMoving(tank, tank.direction);
		} else if (command === 'reverse') {
			tryMoving(tank, directions[(directions.indexOf(tank.direction) + 2) % directions.length]);
		} else if (command === 'turn-right') {
			tank.direction =  directions[(directions.indexOf(tank.direction) + directions.length - 1) % directions.length];
			tank.status = 'moving';
		} else if (command === 'turn-left') {
			tank.direction =  directions[(directions.indexOf(tank.direction) + 1) % directions.length];
			tank.status = 'moving';
		} else if (command === 'fire') {
			tryShooting(tank);
		}

		self.emit('change', completeMap());
	};
};
