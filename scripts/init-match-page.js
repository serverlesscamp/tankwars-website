/*global module, require */

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	updateTankStatuses = require('./update-tank-statuses'),
	packOptions = require('./pack-options');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 30,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		matchContainer = findElement('matchContainer'),
		matchMap = mapWidget(findElement('matchMap'), scaleMultiplier),
		initMatch = findElement('initMatch'),
		status = findElement('status'),
		log = findElement('log'),
		model = new TankWarsModel();


	model.on('initializing', function () {
		status.innerHTML = 'Please wait... initializing';
	});
	model.on('error', function (err) {
		status.innerHTML = 'Error';
		log.value = log.value + '\n' + 'ERROR:' + JSON.stringify(err);
	});

	model.on('newMatch', function (map) {
		matchMap.updateMap(map);
		matchContainer.classList.add('active');
		updateTankStatuses(map, document);
	});
	model.on('change', function (map) {
		matchMap.updateMap(map);
		updateTankStatuses(map, document);
	});
	initMatch.addEventListener('click', function () {
		model.newMatch(packOptions(document));
	});
	matchMap.addEventListener('click', function (e) {
		var x, y;
		if (e.target === this) {
			x = Math.floor(e.offsetX / scaleMultiplier);
			y = Math.floor(e.offsetY / scaleMultiplier);
			model.addWall(x, y);
		} else if (e.target.tagName === 'WALL') {
			model.removeWall(parseInt(e.target.getAttribute('x')), parseInt(e.target.getAttribute('y')));
		}
	});

};

