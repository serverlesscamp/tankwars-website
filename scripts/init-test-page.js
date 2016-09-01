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
		commandSelector = findElement('command'),
		manualTankSelector = findElement('tankManual'),
		apiTankSelector = findElement('tankApi'),
		updateCommandOptions = function (commands) {
			commandSelector.innerHTML = '<option>---</option>' + commands.map(function (command) {
				return '<option>' + command + '</option>';
			}).join(' ');
		},
		updateTankList = function (tanks) {
			manualTankSelector.innerHTML = tanks.map(function (tank, index) {
				return '<option value="' + index + '"> Tank ' + index + '</option>';
			}).join(' ');
			apiTankSelector.innerHTML = tanks.map(function (tank, index) {
				return '<option value="' + index + '"> Tank ' + index + '</option>';
			}).join(' ');

		},
		randomMap = findElement('randomMap'),
		matchContainer = findElement('matchContainer'),
		matchMap = mapWidget(findElement('matchMap'), scaleMultiplier),
		model = new TankWarsModel();

	model.on('newMatch', function (map) {
		matchMap.updateMap(map);
		updateCommandOptions(model.getSupportedCommands());
		updateTankList(map.tanks);
		matchContainer.classList.add('active');
		updateTankStatuses(map, document);
	});
	model.on('change', function (map) {
		matchMap.updateMap(map);
		updateTankStatuses(map, document);
	});
	randomMap.addEventListener('click', function () {
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
	findElement('execute').addEventListener('click', function () {
		model.executeCommand(parseInt(manualTankSelector.value), commandSelector.value);
	});
	model.newMatch(packOptions(document));
};

