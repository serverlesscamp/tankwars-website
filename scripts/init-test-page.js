/*global module, require */

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 30,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		optionFields = document.querySelectorAll('[role=option]'),
		packOptions = function () {
			var options = {};
			Object.keys(optionFields).forEach(function (key) {
				var field = optionFields[key];
				if (field.getAttribute('data-type') === 'float') {
					options[field.getAttribute('name')] = parseFloat(field.value);
				} else {
					options[field.getAttribute('name')] = parseInt(field.value);
				}
			});
			return options;
		},
		commandSelector = findElement('command'),
		tankSelector = findElement('tankIndex'),
		updateCommandOptions = function (commands) {
			commandSelector.innerHTML = '<option>---</option>' + commands.map(function (command) {
				return '<option>' + command + '</option>';
			}).join(' ');
		},
		updateTankStatuses = function (map) {
			var statusElements = document.querySelectorAll('[role=tankStatus]');
			Object.keys(statusElements).forEach(function (index) {
				var element = statusElements[index],
					tankKey = parseInt(element.getAttribute('key')),
					tankProp = element.getAttribute('flag');
				element.innerHTML = map.tanks[tankKey][tankProp];
			});
		},
		updateTankList = function (tanks) {
			tankSelector.innerHTML = tanks.map(function (tank, index) {
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
		updateTankStatuses(map);
	});
	model.on('change', function (map) {
		matchMap.updateMap(map);
		updateTankStatuses(map);
	});
	randomMap.addEventListener('click', function () {
		model.newMatch(packOptions());
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
		model.executeCommand(parseInt(tankSelector.value), commandSelector.value);
	});
	model.newMatch(packOptions());
};

