/*global require, it, expect, jasmine, describe, beforeEach */
var mazeBuilder = require('../scripts/maze-builder');
describe('mazeBuilder', function () {
	'use strict';
	var randomizer;
	beforeEach(function () {
		randomizer = jasmine.createSpyObj('randomizer', ['randomInt', 'random', 'shuffle']);
		randomizer.randomInt.and.callFake(function (x) {
			return Math.floor(x / 2);
		});
		randomizer.random.and.returnValue(0.5);
		randomizer.shuffle.and.callFake(function (x) {
			return x.slice().reverse();
		});
	});
	it('creates a maze by subviding chambers', function () {
		expect(mazeBuilder(5, 5, 0.5, 0.5, 2, randomizer)).toEqual([{ x: 2, y: 2 }, { x: 1, y: 2 },{ x: 0, y: 2 }]);
	});
});
