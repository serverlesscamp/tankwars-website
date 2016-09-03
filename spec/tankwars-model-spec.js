/*global describe, it, jasmine, expect, require, beforeEach */
var TankWarsModel = require('../scripts/tankwars-model');
describe('TankWarsModel', function () {
	'use strict';
	var randomizer, mazeBuilder; /*, changeListener;*/
	beforeEach(function () {
		randomizer = jasmine.createSpyObj('randomizer', ['shuffle', 'random', 'randomInt']);
		mazeBuilder = jasmine.createSpy('mazeBuilder');

		mazeBuilder.and.returnValue([{x: 1, y: 0}, {x: 0, y: 1}]);

		randomizer.shuffle.and.callFake(function (array) {
			return array.slice().reverse();
		});
	});
	describe('newMatch', function () {
		it('builds a map when it newMatchs, with tanks and walls', function () {
			var model = new TankWarsModel(),
				result;
			model.newMatch({
				numTanks: 5,
				mapWidth: 50,
				mapHeight: 20
			});
			result = model.getMap();

			expect(result.tanks.length).toEqual(5);
			expect(result.width).toEqual(50);
			expect(result.height).toEqual(20);
		});
		it('puts tanks on random orientation', function () {
			var model, map;
			randomizer.shuffle.and.callFake(function (array) {
				array.push(array.shift());
				return array;
			});
			model = new TankWarsModel({
				randomizer: randomizer,
				mazeBuilder: mazeBuilder
			});
			model.newMatch({
				numTanks: 3,
				mapWidth: 3,
				mapHeight: 2
			});
			map = model.getMap();
			expect(map.tanks[0].direction).toEqual('left');
			expect(map.tanks[1].direction).toEqual('bottom');
			expect(map.tanks[2].direction).toEqual('right');

		});
		it('resets sudden death', function () {
			var model = new TankWarsModel({suddenDeath: 5}),
				result;
			model.newMatch({
				numTanks: 5,
				mapWidth: 50,
				mapHeight: 20,
				suddenDeath: 100,
				suddenDeathFields: [{x: 1, y: 2}]
			});
			result = model.getMap();

			expect(result.suddenDeath).toEqual(100);
			expect(result.suddenDeathFields).toEqual([]);
		});
		it('places tanks into random empty spots on the map', function () {
			var model, map;
			/*  012
			 * 0.x.
			 * 1x..
			 */
			model = new TankWarsModel({
				randomizer: randomizer,
				mazeBuilder: mazeBuilder
			});
			model.newMatch({
				numTanks: 2,
				mapWidth: 3,
				mapHeight: 2
			});
			map = model.getMap();
			expect(map.tanks[0].x).toEqual(1);
			expect(map.tanks[0].y).toEqual(1);

			expect(map.tanks[1].x).toEqual(0);
			expect(map.tanks[1].y).toEqual(0);
		});
		it('dispatches newMatch', function () {
			var model = new TankWarsModel(),
				listener = jasmine.createSpy();
			model.on('newMatch', listener);
			model.newMatch({
				numTanks: 2,
				mapWidth: 3,
				mapHeight: 2
			});
			expect(listener).toHaveBeenCalledWith(model.getMap());
		});
	});
	describe('tank commands', function () {

		['turn-left', 'turn-right', 'forward', 'reverse', 'fire', 'pass'].forEach(function (command) {
			it('ignores ' + command +  ' command for destroyed tanks', function () {
				var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 0, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 5,
					suddenDeath: 10
				});
				model.executeCommand(0, command);
				expect(model.getMap().tanks[0].direction).toEqual('left');
				expect(model.getMap().tanks[0].x).toEqual(1);
				expect(model.getMap().tanks[0].y).toEqual(2);
				expect(model.getMap().tanks[0].strength).toEqual(0);
				expect(model.getMap().tanks[0].status).toEqual('xxx');
				expect(model.getMap().suddenDeath).toEqual(10);
			});

			it(command +  ' decreases sudden death counter', function () {
				var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 10, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 5,
					suddenDeath: 10
				});
				model.executeCommand(0, command);
				expect(model.getMap().suddenDeath).toEqual(9);
			});

		});
		describe('pass', function () {
			it('does nothing even for alive tanks', function () {
				var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 0, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 5
				});
				model.executeCommand(0, 'pass');
				expect(model.getMap().tanks[0].direction).toEqual('left');
				expect(model.getMap().tanks[0].x).toEqual(1);
				expect(model.getMap().tanks[0].y).toEqual(2);
				expect(model.getMap().tanks[0].strength).toEqual(0);
				expect(model.getMap().tanks[0].status).toEqual('xxx');
			});
		});
		[{name: 'left', x: -1, y: 0}, {name: 'right', x: 1, y: 0}, {name: 'top', x: 0, y: -1}, {name: 'bottom', x: 0, y: 1}].forEach(function (direction) {
			describe('when facing ' + direction.name, function () {
				describe('fire', function () {
					it('shoots a wall next to the tank without damaging the tank', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name}],
								walls: [
									{x: 10 + direction.x, y: 9 + direction.y, strength: 100},
									{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 100}
								],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.direction).toEqual(direction.name);
						expect(tank.x).toEqual(10);
						expect(tank.y).toEqual(9);
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(1);
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);

						expect(model.getMap().walls[0].strength).toEqual(80);
						expect(model.getMap().walls[1].strength).toEqual(100);

					});
					it('shoots a reachable wall close to the tank', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name}],
								walls: [
									{x: 10 + 3 * direction.x, y: 9 + 3 * direction.y, strength: 100},
									{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 100}
								],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(2);
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls[1].strength).toEqual(80);
					});

					it('shoots a reachable tank', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name},
										{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 90}],
								walls: [{x: 10 + 3 * direction.x, y: 9 + 3 * direction.y, strength: 100}],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(2);
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);

						expect(model.getMap().tanks[1].strength).toEqual(70);
						expect(model.getMap().tanks[1].status).toEqual('hit');
						expect(model.getMap().walls[0].strength).toEqual(100);
					});

					it('destroys a tank if strength less than damage', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name},
										{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 10}],
								walls: [{x: 10 + 3 * direction.x, y: 9 + 3 * direction.y, strength: 100}],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(2);
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);

						expect(model.getMap().tanks[1].strength).toEqual(0);
						expect(model.getMap().tanks[1].status).toEqual('hit');
						expect(model.getMap().walls[0].strength).toEqual(100);
					});


					it('destroys a wall if strength less than damage', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name}],
								walls: [
									{x: 10 + 3 * direction.x, y: 9 + 3 * direction.y, strength: 100},
									{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 10}
								],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(2);
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);
						expect(model.getMap().walls.length).toEqual(1);
						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls[0].x).toEqual(10 + 3 * direction.x);
						expect(model.getMap().walls[0].y).toEqual(9 + 3 * direction.y);
					});

					it('shoots at blank space if there are no reachable targets', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 100, direction: direction.name}],
								walls: [
									{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 100}
								],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 1
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.ammo).toEqual(99);
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(1);
						expect(tank.strength).toEqual(200);

						expect(model.getMap().walls[0].strength).toEqual(100);
					});
					it('does not overshoot the maze boundaries', function () {
						var model = new TankWarsModel({
								tanks: [{x: 2, y: 2, strength: 200, ammo: 100, direction: direction.name}],
								walls: [ ],
								mapWidth: 5,
								mapHeight: 5,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('firing');
						expect(tank.targetRange).toEqual(3);
					});

					it('does not shoot if no ammo', function () {
						var model = new TankWarsModel({
								tanks: [{x: 10, y: 9, strength: 200, ammo: 0, direction: direction.name}],
								walls: [
									{x: 10 + 2 * direction.x, y: 9 + 2 * direction.y, strength: 100}
								],
								mapWidth: 20,
								mapHeight: 20,
								wallDamage: 30,
								tankDamage: 50,
								weaponDamage: 20,
								weaponRange: 5
							}), tank;
						model.executeCommand(0, 'fire');
						tank = model.getMap().tanks[0];
						expect(tank.status).toEqual('static');

						expect(model.getMap().walls[0].strength).toEqual(100);
					});

				});
				describe('forward', function () {
					it('moves tank by 1 place if space is available', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 100, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5
						});
						model.executeCommand(0, 'forward');
						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1 + direction.x);
						expect(model.getMap().tanks[0].y).toEqual(2 + direction.y);
						expect(model.getMap().tanks[0].strength).toEqual(100);
						expect(model.getMap().tanks[0].status).toEqual('moving');
					});
					it('resets status for all other tanks', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 100, direction: direction.name}, { x: 4, y: 4, status: 'moving'}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5
						});
						model.executeCommand(0, 'forward');
						expect(model.getMap().tanks[1].status).toEqual('static');
					});
					it('bumps the wall if the tank is hitting a wall', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 + direction.x, y: 2 + direction.y, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');
						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(170);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls[1].strength).toEqual(50);
					});
					it('bumps the tank if it hits the edge of the maze', function () {
						var model = new TankWarsModel({
							tanks: [{x: 0, y: 0, strength: 200, direction: direction.name}],
							walls: [],
							mapWidth: 1,
							mapHeight: 1,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');
						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(0);
						expect(model.getMap().tanks[0].y).toEqual(0);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(170);
					});
					it('destroys a wall if strength less than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 + direction.x, y: 2 + direction.y, strength: 20}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(170);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls.length).toEqual(1);
					});
					it('bumps another tank if it is in front', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}, {x : 1 + direction.x, y: 2 + direction.y, strength: 100}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(150);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(50);
					});
					it('destroys itself bumping a wall if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 25, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 + direction.x, y: 2 + direction.y, strength: 20}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(0);
					});
					it('destroys itself bumping tank if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 20, direction: direction.name}, {x : 1 + direction.x, y: 2 + direction.y, strength: 100}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(0);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(50);

					});
					it('destroys a bumped tank if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}, {x : 1 + direction.x, y: 2 + direction.y, strength: 30}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'forward');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + direction.name);
						expect(model.getMap().tanks[0].strength).toEqual(150);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(0);

					});
				});
				describe('reverse', function () {
					var reverseDirection = {
						top: 'bottom',
						bottom: 'top',
						right: 'left',
						left: 'right'
					};
					it('moves tank by 1 place if space is available', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 100, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5
						});
						model.executeCommand(0, 'reverse');
						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1 - direction.x);
						expect(model.getMap().tanks[0].y).toEqual(2 - direction.y);
						expect(model.getMap().tanks[0].strength).toEqual(100);
						expect(model.getMap().tanks[0].status).toEqual('moving');
					});
					it('resets status for all other tanks', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 100, direction: direction.name}, { x: 4, y: 4, status: 'moving'}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5
						});
						model.executeCommand(0, 'reverse');
						expect(model.getMap().tanks[1].status).toEqual('static');
					});
					it('bumps the wall if the tank is hitting a wall', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 - direction.x, y: 2 - direction.y, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');
						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(170);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls[1].strength).toEqual(50);
					});
					it('destroys a wall if strength less than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 - direction.x, y: 2 - direction.y, strength: 20}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(170);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls.length).toEqual(1);
					});
					it('bumps another tank if it is in front', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}, {x : 1 - direction.x, y: 2 - direction.y, strength: 100}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(150);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(50);
					});
					it('destroys itself bumping a wall if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 25, direction: direction.name}],
							walls: [{x: 3, y: 3, strength: 100}, {x: 1 - direction.x, y: 2 - direction.y, strength: 20}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(0);
					});
					it('destroys itself bumping tank if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 20, direction: direction.name}, {x : 1 - direction.x, y: 2 - direction.y, strength: 100}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(0);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(50);

					});
					it('destroys a bumped tank if less strength than damage', function () {
						var model = new TankWarsModel({
							tanks: [{x: 1, y: 2, strength: 200, direction: direction.name}, {x : 1 - direction.x, y: 2 - direction.y, strength: 30}],
							walls: [{x: 3, y: 3, strength: 100}],
							mapWidth: 5,
							mapHeight: 5,
							wallDamage: 30,
							tankDamage: 50
						});
						model.executeCommand(0, 'reverse');

						expect(model.getMap().tanks[0].direction).toEqual(direction.name);
						expect(model.getMap().tanks[0].x).toEqual(1);
						expect(model.getMap().tanks[0].y).toEqual(2);
						expect(model.getMap().tanks[0].status).toEqual('bump-' + reverseDirection[direction.name]);
						expect(model.getMap().tanks[0].strength).toEqual(150);

						expect(model.getMap().tanks[1].status).toEqual('bumped');
						expect(model.getMap().tanks[1].strength).toEqual(0);

					});
				});
			});
		});
	});
	describe('getVisibleMapForTank', function () {
		var model;

		beforeEach(function () {
			model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 30, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 50, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				suddenDeath: 1000,
				suddenDeathFields: [{x: 1, y: 3}, {x: 7, y: 6}],
				additionalArg: 'some value'
			});
		});
		it('includes full information about the subject tank', function () {
			var result = model.getVisibleMapForTank(0);
			expect(result.you).toEqual({x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'});
		});
		it('includes generic map arguments', function () {
			var result = model.getVisibleMapForTank(0);
			expect(result).toEqual(jasmine.objectContaining({
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				suddenDeath: 1000
			}));
			expect(result.additionalArg).not.toBeDefined();
		});
		it('includes walls within the visibility range', function () {
			var result = model.getVisibleMapForTank(0);
			expect(result.walls).toEqual([{x: 3, y: 3, strength: 100}]);
		});
		it('includes full information on other tanks within the visibility range', function () {
			var result = model.getVisibleMapForTank(0);
			expect(result.enemies.length).toEqual(2);
			expect(result.enemies[0]).toEqual({x: 3, y: 2, strength: 30, ammo: 100, direction: 'top', status: 'moving'});
		});
		it('includes only summary info for the tanks outside the visibility range', function () {
			var result = model.getVisibleMapForTank(0);
			expect(result.enemies[1]).toEqual({strength: 50});
		});
		it('includes only visible sudden death fields', function () {
			expect(model.getVisibleMapForTank(0).fire).toEqual([{x: 1, y: 3}]);

		});
	});
	describe('alive', function () {
		it('returns true if the tank is still in the game', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 1, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 0, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				additionalArg: 'some value'
			});
			expect(model.alive(0)).toBeTruthy();
			expect(model.alive(1)).toBeTruthy();
			expect(model.alive(2)).toBeFalsy();
		});
	});
	describe('winner', function () {
		it('returns false if all tanks are alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 10, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 10, ammo: 100, direction: 'bottom', status: 'moving'}
					]
			});
			expect(model.getWinner()).toEqual(false);
		});

		it('returns false if some tanks are dead, but at least two tanks are alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 10, ammo: 100, direction: 'bottom', status: 'moving'}
					]
			});
			expect(model.getWinner()).toEqual(false);
		});
		it('returns the winning tank index if only one is alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 7, y: 7, strength: 0, ammo: 100, direction: 'bottom', status: 'moving'}
					]
			});
			expect(model.getWinner()).toEqual(1);
		});
		it('returns false if no alive tanks', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 0, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 0, ammo: 100, direction: 'bottom', status: 'moving'}
					]
			});
			expect(model.getWinner()).toEqual(false);
		});
	});

	describe('isOver', function () {
		it('returns false if all tanks are alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 10, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 10, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				additionalArg: 'some value'
			});
			expect(model.isOver()).toBeFalsy();
		});

		it('returns false if some tanks are dead, but at least two tanks are alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 10, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				additionalArg: 'some value'
			});
			expect(model.isOver()).toBeFalsy();
		});
		it('returns true if exactly one tank is alive', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 200, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 0, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				additionalArg: 'some value'
			});
			expect(model.isOver()).toBeTruthy();
		});
		it('returns true if no alive tanks', function () {
			var model = new TankWarsModel({
				tanks: [
						{x: 1, y: 2, strength: 0, ammo: 111, direction: 'top', status: 'hit'},
						{x: 3, y: 2, strength: 0, ammo: 100, direction: 'top', status: 'moving'},
						{x: 7, y: 7, strength: 0, ammo: 100, direction: 'bottom', status: 'moving'}
						],
				walls: [{x: 3, y: 3, strength: 100}, {x: 10, y: 10, strength: 50}],
				mapWidth: 20,
				mapHeight: 15,
				visibility: 4,
				wallDamage: 30,
				tankDamage: 50,
				weaponDamage: 20,
				weaponRange: 5,
				additionalArg: 'some value'
			});
			expect(model.isOver()).toBeTruthy();
		});
	});
	describe('sudden death', function () {
		it('does nothing if sudden death counter is positive', function () {
			var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 5, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 5,
					suddenDeath: 1
				});
			model.executeCommand(0, 'pass');
			expect(model.getMap().suddenDeathFields).toEqual([]);
		});
		it('marks corners during sudden death if no other fields are marked', function () {
			var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 5, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 4,
					suddenDeath: 0
				});
			model.executeCommand(0, 'pass');
			expect(model.getMap().suddenDeathFields).toEqual([{x: 0, y: 0}, {x: 0, y: 3}, {x: 4, y: 0}, {x: 4, y: 3}]);
			expect(model.getMap().suddenDeath).toEqual(0);
		});
		it('causes weapon damage to any tanks caught in sudden death fields', function () {
			var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 5, direction: 'left', status: 'xxx'},
							{x: 4, y: 3, strength: 100, direction: 'top'}],
					mapWidth: 5,
					mapHeight: 4,
					suddenDeath: 0,
					weaponDamage: 20
				});
			model.executeCommand(0, 'pass');
			expect(model.getMap().tanks[0].strength).toEqual(5);
			expect(model.getMap().tanks[1].strength).toEqual(80);
			expect(model.getMap().tanks[1].status).toEqual('hit');
		});
		it('destroys a tank if strength less than damage', function () {
			var model = new TankWarsModel({
					tanks: [{x: 4, y: 3, strength: 5, direction: 'left', status: 'xxx'}],
					walls: [{x: 2, y: 2, strength: 100}],
					mapWidth: 5,
					mapHeight: 4,
					suddenDeath: 0,
					weaponDamage: 20
				});
			model.executeCommand(0, 'pass');
			expect(model.getMap().tanks[0].strength).toEqual(0);
		});
		it('expands to nearby fields if already in sudden death', function () {
			var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 5, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 4,
					suddenDeath: 0,
					suddenDeathFields: [{x: 2, y: 2}]
				});
			model.executeCommand(0, 'pass');
			expect(model.getMap().suddenDeathFields).toEqual([
					{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3},
					{x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3},
					{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}
			]);
			expect(model.getMap().suddenDeath).toEqual(0);
		});
	});
});
