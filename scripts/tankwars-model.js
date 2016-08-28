/*global makeEmitter, TW */
TW.TankWarsModel = function (tankWarsApi) {
	'use strict';
	var self = makeEmitter(this);
	self.initiateMatch = function () {
		self.emit('initializing');
		tankWarsApi.initiateMatch({mapSize: 100, walls: 10, maxWallLength: 20}).then(function (response) {
			self.emit('newMatch', response.id, response.map);
		}).catch(function (err) {
			self.emit('error', err);
		});
	};
};
