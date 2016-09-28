/*global describe, it, expect, require, beforeEach, jasmine */
var grow = require('../scripts/grow');
describe('grow', function () {
	'use strict';
	var randomizer,
		randomInts,
		randomNumbers;
	beforeEach(function () {
		randomInts = [];
		randomNumbers = [];
		randomizer = jasmine.createSpyObj('randomizer', ['randomInt', 'random', 'shuffle']);
		randomizer.randomInt.and.callFake(function () {
			return randomInts.shift() || 0;
		});
		randomizer.random.and.callFake(function () {
			return randomNumbers.shift() || 0;
		});
		randomizer.shuffle.and.callFake(function (arr) {
			return arr.slice().reverse();
		});
	});
	it('creates random fields if it receives an empty array', function () {
		randomInts = [
			2, /* howMany - 1 */
			0, 0,
			0, 4,
			2, 0
		];
		expect(grow([], 3, 5, {randomizer: randomizer})).toEqual([
				{x: 0, y: 0}, {x: 0, y: 4}, {x: 2, y: 0}
		]);

	});
	it('expands existing fields in the map', function () {
		randomInts = [3];
		expect(grow([{x: 2, y: 2}], 5, 5, {randomizer: randomizer})).toEqual([
				{ x: 2, y: 2 },
				{ x: 2, y: 3 },
				{ x: 2, y: 1 },
				{ x: 1, y: 3 },
				{ x: 1, y: 2 },
				{ x: 1, y: 1 }
		]);
		expect(randomizer.shuffle).toHaveBeenCalledWith([{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3},
				{x: 2, y: 1}, {x: 2, y: 3},
				{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}]);
		expect(randomizer.randomInt).toHaveBeenCalledWith(8);
	});
	it('does not grow outside the map', function () {
		randomInts = [0];
		expect(grow([{x: 2, y: 2}], 3, 3, {randomizer: randomizer})).toEqual([
				{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 1 }
		]);
	});
});
