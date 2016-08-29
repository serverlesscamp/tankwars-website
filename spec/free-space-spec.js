/*global describe, it, expect, require*/
var freeSpace = require('../scripts/free-space');
describe('freeSpace', function () {
	'use strict';
	it('returns a list of free cells based on a grid', function () {
		expect(freeSpace([{x: 1, y: 0}, {x: 0, y: 1}], 2, 2)).toEqual([
			{x: 0, y: 0}, {x: 1, y: 1}
		]);
	});
	it('works with empty existing objects', function () {
		expect(freeSpace([], 2, 2)).toEqual([
			{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}
		]);
	});
	it('works when existing objects are outside the range', function () {
		expect(freeSpace([{x: 1, y: 0}, {x: 5, y: 5}], 2, 2)).toEqual([
			{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}
		]);
	});
});
