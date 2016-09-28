/*global module, require */
var makeEmitter = require('./mini-emit'),
	uuid = require('uuid'),
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
		walls = options.walls || [],
		tanks = options.tanks || [],
		mapWidth,
		matchId,
		visibility,
		mapHeight,
		wallStrength,
		maxAmmo,
		tankStrength,
		wallDamage,
		tankDamage,
		weaponRange,
		weaponDamage,
		growFire = options.growFire || require('./grow'),
		suddenDeathFields = options.suddenDeathFields || [],
		suddenDeath,
		jsonClone = function (obj) {
			return JSON.parse(JSON.stringify(obj));
		},
		completeMap = function () {
			return {
				width: mapWidth,
				height: mapHeight,
				matchId: matchId,
				walls: walls,
				tanks: tanks,
				wallStrength: wallStrength,
				suddenDeath: suddenDeath,
				suddenDeathFields: suddenDeathFields
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
		tankByPoint = function (point) {
			return tankByPosition(point.x, point.y);
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
				status: 'static'
			};
		},
		damageWall = function (wall, damage) {
			wall.strength -= damage;
			if (wall.strength <= 0) {
				self.removeWall(wall.x, wall.y);
			}
		},
		damageTank = function (tank, status, damage) {
			tank.status = status;
			tank.strength = Math.max(0, tank.strength - damage);
		},
		outsideMaze = function (x, y) {
			return x < 0 || x >= mapWidth || y < 0 || y >= mapHeight;
		},
		tryMoving = function (tank, direction) {
			var movement = movements[direction],
				x = tank.x + movement.x,
				y = tank.y + movement.y,
				wallInFront = wallByPosition(x, y),
				tankInFront = tankByPosition(x, y);
			if (wallInFront) {
				damageTank(tank, 'bump-' + direction, wallDamage);
				damageWall(wallInFront, tankDamage);
			} else if (tankInFront) {
				damageTank(tank, 'bump-' + direction, tankDamage);
				damageTank(tankInFront, 'bumped', tankDamage);
			} else if (outsideMaze(x, y)) {
				damageTank(tank, 'bump-' + direction, wallDamage);
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
			for (range = 0; range < weaponRange && !wallTarget && !tankTarget && !outsideMaze(x, y); range++) {
				x += movement.x;
				y += movement.y;
				wallTarget = wallByPosition(x, y);
				if (!wallTarget) {
					tankTarget = tankByPosition(x, y);
				}
			}
			tank.status = 'firing';
			tank.targetRange = range;
			tank.ammo -= 1;
			if (wallTarget) {
				damageWall(wallTarget, weaponDamage);
			} else if (tankTarget) {
				damageTank(tankTarget, 'hit', weaponDamage);
			}
		},
		loadOptions = function (options) {
			mapWidth = options.mapWidth || 32;
			mapHeight = options.mapHeight || 24;
			wallStrength = options.wallStrength || 100;
			maxAmmo = options.maxAmmo || 100;
			tankStrength = options.tankStrength || 200;
			wallDamage = options.wallDamage || 30;
			tankDamage = options.tankDamage || 50;
			weaponRange = options.weaponRange || 5;
			weaponDamage = options.weaponDamage || 20;
			visibility = options.visibility || 5;
			suddenDeath = options.suddenDeath === 0 ? 0 : (options.suddenDeath || 1000);
		},
		notFalsy = function (t) {
			return t;
		},
		suddenDeathTurn = function () {
			if (suddenDeath > 0) {
				suddenDeath--;
			} else {
				suddenDeathFields = growFire(suddenDeathFields, mapWidth, mapHeight);
				suddenDeathFields.map(tankByPoint).filter(notFalsy).forEach(function (tankTarget) {
					damageTank(tankTarget, 'hit', weaponDamage);
				});
			}
		};
	self.newMatch = function (options) {
		var numTanks = options.numTanks || 2,
			verticalWallProb = options.verticalWallProb || 0.5,
			horizontalWallProb = options.horizontalWallProb || 0.5,
			minSpacing = options.minSpacing || 3;

		matchId = uuid.v4();
		loadOptions(options);
		walls = mazeBuilder(mapWidth, mapHeight, horizontalWallProb, verticalWallProb, minSpacing, randomizer).map(makeWall);
		tanks = randomizer.shuffle(freeSpace(walls, mapWidth, mapHeight)).slice(-1 * numTanks).map(makeTank);
		suddenDeathFields = [];
		self.emit('newMatch', completeMap());
	};
	self.getMatchId = function () {
		return matchId;
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
		return ['turn-left', 'turn-right', 'forward', 'reverse', 'fire', 'pass'];
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
		suddenDeathTurn();
		self.emit('change', completeMap());
		if (self.isOver()) {
			self.emit('over', self.getWinner());
		}
	};
	self.getVisibleMapForTank = function (tankIndex) {
		var tank = tanks[tankIndex],
			isEnemy = function (val) {
				return tank !== val;
			},
			distance = function (point1, point2) {
				return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
			},
			isVisible = function (point) {
				return distance(tank, point) < visibility;
			},
			getEnemyInfo = function (enemyTank) {
				var clone;
				if (isVisible(enemyTank)) {
					clone = jsonClone(enemyTank);
					delete clone.status;
					return clone;
				} else {
					return {strength: enemyTank.strength};
				}
			};
		return {
			matchId: matchId,
			mapWidth: mapWidth,
			mapHeight: mapHeight,
			wallDamage: wallDamage,
			tankDamage: tankDamage,
			weaponDamage: weaponDamage,
			visibility: visibility,
			weaponRange: weaponRange,
			you: tanks[tankIndex],
			enemies: tanks.filter(isEnemy).map(getEnemyInfo),
			walls: walls.filter(isVisible),
			suddenDeath: suddenDeath,
			fire: suddenDeathFields.filter(isVisible)
		};
	};
	self.alive = function (tankIndex) {
		return tanks[tankIndex].strength > 0;
	};
	self.isOver = function () {
		return tanks.filter(function (tank) {
			return tank.strength > 0;
		}).length < 2;
	};
	self.skipTurns = function (howMuch) {
		suddenDeath = Math.max(suddenDeath - howMuch, 0);
		self.emit('change', completeMap());
	};
	self.getWinner = function () {
		var result = false;
		if (!self.isOver()) {
			return false;
		}
		tanks.forEach(function (tank, index) {
			if (tank.strength > 0) {
				result = index;
			}
		});
		return result;
	};
	loadOptions(options);
};
