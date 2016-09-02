/*global describe, it, expect, require */
var grow = require('../scripts/grow');
describe('grow', function () {
	'use strict';
	it('marks the corners of a grid if nothing is marked yet', function () {
		expect(grow([], 3, 5)).toEqual([
				{x: 0, y: 0}, {x: 0, y: 4}, {x: 2, y: 0}, {x: 2, y: 4}
		]);

	});
	it('expands existing fields in the map', function () {
		expect(grow([{x: 2, y: 2}], 5, 5)).toEqual([
				{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3},
				{x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3},
				{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}
		]);
	});
	it('does not grow outside the map', function () {
		expect(grow([{x: 2, y: 2}], 3, 3)).toEqual([
				{x: 1, y: 1}, {x: 1, y: 2},
				{x: 2, y: 1}, {x: 2, y: 2}
		]);
	});
	it('does not create duplicates', function () {
		expect(grow([{x: 2, y: 2}, {x: 2, y: 3}], 5, 5)).toEqual([
				{x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 1, y: 4},
				{x: 2, y: 1}, {x: 2, y: 2}, {x: 2, y: 3}, {x: 2, y: 4},
				{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}, {x: 3, y: 4}
		]);

	});
});
