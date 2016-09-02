/*global module, require */

var TankWarsModel = require('./tankwars-model'),
	mapWidget = require('./tankwars-map-widget'),
	updateTankStatuses = require('./update-tank-statuses'),
	promisingXhr = require('./promising-xhr'),
	uuid = require('uuid'),
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
		model = new TankWarsModel(),
		matchId,
		log = findElement('log');

	model.on('newMatch', function (map) {
		matchMap.updateMap(map);
		matchId = uuid.v4();
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
	findElement('executeApi').addEventListener('click', function () {
		var tankId = parseInt(apiTankSelector.value),
			toSend = model.getVisibleMapForTank(tankId);
		toSend.matchId = matchId;
		log.value = 'sending:\n' + JSON.stringify(toSend, null, 2);
		promisingXhr({
			url: findElement('apiUrl').value + '/command',
			method: 'POST',
			data: toSend
		}).then(function (response) {
			if (response && response.body && response.body.command) {
				log.value = log.value + '\n-----\n RECEIVED: ' + JSON.stringify(response.body, null, 2);
				model.executeCommand(tankId, response.body.command);
			} else {
				throw 'invalid response: ' + response.body;
			}
		}).catch(function (err) {
			log.value = log.value + '\n-----\n' + err && (err.stack || err.message || JSON.stringify(err));
		});

	});
	model.newMatch(packOptions(document));
};

