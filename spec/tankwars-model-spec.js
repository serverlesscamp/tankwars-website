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
	it('dispatches newMatch when a match is initialized', function () {
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

	describe('tank commands', function () {

		['turn-left', 'turn-right', 'forward', 'reverse', 'fire'].forEach(function (command) {
			it('ignores ' + command +  ' command for destroyed tanks', function () {
				var model = new TankWarsModel({
					tanks: [{x: 1, y: 2, strength: 0, direction: 'left', status: 'xxx'}],
					walls: [{x: 3, y: 3, strength: 100}],
					mapWidth: 5,
					mapHeight: 5
				});
				model.executeCommand(0, 'command');
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
						expect(tank.target).toEqual({x: 10 + direction.x, y: 9 + direction.y});
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
						expect(tank.target).toEqual({x: 10 + 2 * direction.x, y: 9 + 2 * direction.y});
						expect(tank.strength).toEqual(200);
						expect(tank.ammo).toEqual(99);

						expect(model.getMap().walls[0].strength).toEqual(100);
						expect(model.getMap().walls[1].strength).toEqual(80);
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
						expect(tank.target).toEqual({x: 10 + 2 * direction.x, y: 9 + 2 * direction.y});
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
						expect(tank.target).toEqual({x: 10 + direction.x, y: 9 + direction.y});
						expect(tank.strength).toEqual(200);

						expect(model.getMap().walls[0].strength).toEqual(100);
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
});
