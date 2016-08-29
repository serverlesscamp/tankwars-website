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
});
