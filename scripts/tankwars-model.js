/*global module, require */
var makeEmitter = require('./mini-emit'),
	freeSpace = require('./free-space');
module.exports = function TankWarsModel(options) {
	'use strict';
	var self = makeEmitter(this),
		mazeBuilder = (options && options.mazeBuilder) || require('./maze-builder'),
		directions = ['top', 'left', 'bottom', 'right'],
		movements = {
			top: { x: 0, y: -1 },
			left: { x: -1, y: 0 },
			bottom: {x: 0, y: 1},
			right: {x: 1, y: 0}
		},
		randomizer = (options && options.randomizer) || require('./randomizer'),
		walls,
		tanks,
		mapWidth,
		mapHeight,
		wallStrength,
		maxAmmo,
		tankStrength,
		completeMap = function () {
			return {
				walls: walls,
				tanks: tanks,
				width: mapWidth,
				height: mapHeight
			};
		},
		wallByPosition = function (x, y) {
			return walls.find(function (wall) {
				return wall.x === x && wall.y === y;
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
		};
	self.newMatch = function (options) {
		var numTanks = options.numTanks || 2,
			verticalWallProb = options.verticalWallProb || 0.5,
			horizontalWallProb = options.horizontalWallProb || 0.5,
			minSpacing = options.minSpacing || 3;

		mapWidth = options.mapWidth || 32;
		mapHeight = options.mapHeight || 24;
		wallStrength = options.wallStrength || 3;
		maxAmmo = options.maxAmmo || 100;
		tankStrength = options.tankStrength || 200;
		walls = mazeBuilder(mapWidth, mapHeight, horizontalWallProb, verticalWallProb, minSpacing, randomizer).map(makeWall);
		tanks = randomizer.shuffle(freeSpace(walls, mapWidth, mapHeight)).slice(-1 * numTanks).map(makeTank);
		self.emit('newMatch', completeMap());
	};
	self.addWall = function (x, y) {
		walls.push(makeWall({x: x, y: y}));
		self.emit('change', completeMap());
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
		var tank = tanks[tankIndex],
			movement = movements[tank.direction];
		if (command === 'forward') {
			tank.x += movement.x;
			tank.y += movement.y;
		} else if (command === 'reverse') {
			tank.x -= movement.x;
			tank.y -= movement.y;
		} else if (command === 'turn-right') {
			tank.direction =  directions[(directions.indexOf(tank.direction) + directions.length - 1) % directions.length];
		} else if (command === 'turn-left') {
			tank.direction =  directions[(directions.indexOf(tank.direction) + 1) % directions.length];
		}

		self.emit('change', completeMap());
	};
};
