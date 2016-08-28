/*global module, require */
var makeEmitter = require('./mini-emit');
module.exports = function TankWarsModel(tankWarsApi) {
	'use strict';
	var self = makeEmitter(this);
	self.initiateMatch = function () {
		self.emit('initializing');
		tankWarsApi.initiateMatch({
			mapSize: 100,
			walls: 20,
			maxWallLength: 10,
			tankWidth: 3,
			tankHeight: 6
		}).then(function (response) {
			self.emit('newMatch', response.id, response.map);
		}).catch(function (err) {
			self.emit('error', err);
		});
	};
};
