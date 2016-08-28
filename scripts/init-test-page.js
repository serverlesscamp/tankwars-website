/*global module, require */

var TankWars = require('tankwars-game-controller'),
	mapWidget = require('./tankwars-map-widget');

module.exports = function initMatchPage(document) {
	'use strict';
	var scaleMultiplier = 5,
		findElement = function (role) {
			return document.querySelector('[role=' + role + ']');
		},
		optionFields = document.querySelectorAll('[role=option]'),
		packOptions = function () {
			var options = {};
			Object.keys(optionFields).forEach(function (key) {
				var field = optionFields[key];
				options[field.getAttribute('name')] = parseInt(field.value);
			});
			return options;
		},
		commandSelector = findElement('command'),
		tankSelector = findElement('tankIndex'),
		argsField = findElement('args'),
		updateCommandOptions = function (commands) {
			commandSelector.innerHTML = '<option>---</option>' + commands.map(function (command) {
				return '<option>' + command.name + '</option>';
			}).join(' ');
			commandSelector.addEventListener('change', function () {
				var hint = commands.find(function (command) {
					return command.name === commandSelector.value;
				});
				argsField.value = (hint && JSON.stringify(hint.params, null, 2)) || '';
			});
		},
		randomMap = findElement('randomMap'),
		matchContainer = findElement('matchContainer'),

		matchMap = mapWidget(findElement('matchMap'), scaleMultiplier),
		gameController,
		currentMap;


	randomMap.addEventListener('click', function () {
		currentMap = TankWars.buildMap(packOptions());
		gameController = new TankWars.GameController(currentMap);
		matchMap.updateMap(currentMap);
		updateCommandOptions(gameController.getSupportedCommands());
		matchContainer.classList.add('active');
	});
	matchMap.addEventListener('click', function (e) {
		if (e.target === this) {
			gameController.addWall(Math.floor(e.offsetX / scaleMultiplier), Math.floor(e.offsetY / scaleMultiplier), packOptions().wallStrength);
		} else if (e.target.getAttribute('role') === 'wall') {
			gameController.removeWall(parseInt(e.target.getAttribute('x')), parseInt(e.target.getAttribute('y')));
		}
		matchMap.updateMap(gameController.getMap());
	});
	findElement('execute').addEventListener('click', function () {
		gameController.executeCommand(parseInt(tankSelector.value), commandSelector.value,  JSON.parse(argsField.value));
		matchMap.updateMap(gameController.getMap());
	});
};

